/**
 * Shared rule-based AI health alerts from ASHA field visit data.
 * Used by both ASHA (per-area) and Admin (all areas) routes.
 */

function parseBP(bp) {
  if (bp == null || bp === '') return null;
  const s = String(bp).match(/(\d+)\s*\/\s*(\d+)/);
  return s ? { systolic: parseInt(s[1], 10), diastolic: parseInt(s[2], 10) } : null;
}

function buildAiAlertsFromVisits(womanVisits, childVisits, adolescentVisits) {
  const aiAlerts = [];

  (womanVisits || []).forEach((v) => {
    const reasons = [];
    let riskLevel = 'Low';
    if (v.hemoglobin != null && !isNaN(v.hemoglobin)) {
      const hb = Number(v.hemoglobin);
      if (hb < 7) { reasons.push(`Severe Anemia (Hb: ${hb} g/dL)`); riskLevel = 'High'; }
      else if (hb < 10) { reasons.push(`Moderate Anemia (Hb: ${hb} g/dL)`); if (riskLevel !== 'High') riskLevel = 'Moderate'; }
      else if (hb < 11) { reasons.push(`Mild Anemia (Hb: ${hb} g/dL)`); if (riskLevel === 'Low') riskLevel = 'Moderate'; }
    }
    const bp = parseBP(v.bloodPressure);
    if (bp && (bp.systolic >= 140 || bp.diastolic >= 90)) {
      reasons.push(`Hypertension / Pre-eclampsia risk (BP: ${bp.systolic}/${bp.diastolic} mmHg)`);
      riskLevel = 'High';
    }
    const age = v.age != null ? parseInt(v.age, 10) : null;
    if (age != null && !isNaN(age)) {
      if (age < 18) { reasons.push(`Young maternal age (${age} years)`); riskLevel = 'High'; }
      else if (age > 35) { reasons.push(`Advanced maternal age (${age} years)`); if (riskLevel !== 'High') riskLevel = 'Moderate'; }
    }
    if (v.weight != null && v.height != null && v.height > 0) {
      const heightM = Number(v.height) / 100;
      const bmi = Number(v.weight) / (heightM * heightM);
      if (bmi < 18.5) { reasons.push(`Underweight (BMI: ${bmi.toFixed(1)})`); if (riskLevel === 'Low') riskLevel = 'Moderate'; }
      else if (bmi >= 30) { reasons.push(`High BMI (BMI: ${bmi.toFixed(1)})`); riskLevel = 'High'; }
    }
    if (v.healthIndicators?.highRiskPregnancy) { reasons.push('High-risk pregnancy (flagged in visit)'); riskLevel = 'High'; }
    if (v.healthIndicators?.anemia && reasons.every(r => !r.includes('Anemia'))) { reasons.push('Anemia (flagged in visit)'); if (riskLevel === 'Low') riskLevel = 'Moderate'; }
    if (reasons.length > 0) {
      const action = riskLevel === 'High' ? 'Refer to PHC immediately' : 'Medical consultation and monitoring recommended';
      aiAlerts.push({
        id: v._id,
        type: 'pregnancy_risk',
        riskLevel,
        title: riskLevel === 'High' ? 'Pregnancy Risk Alert' : 'Pregnancy Monitoring Alert',
        reason: reasons.join('; '),
        action,
        beneficiaryName: v.personName,
        date: v.visitDate,
        ashaArea: v.ashaArea || null,
        confidence: reasons.length >= 2 ? 'High' : 'Medium',
        details: { hemoglobin: v.hemoglobin, bloodPressure: v.bloodPressure, age: v.age, weight: v.weight, height: v.height }
      });
    }
  });

  (childVisits || []).forEach((v) => {
    const reasons = [];
    let riskLevel = 'Low';
    if (v.muac != null && !isNaN(v.muac)) {
      const muac = Number(v.muac);
      if (muac < 11.5) { reasons.push(`Severe malnutrition (MUAC: ${muac} cm)`); riskLevel = 'High'; }
      else if (muac < 12.5) { reasons.push(`Moderate malnutrition (MUAC: ${muac} cm)`); riskLevel = 'Moderate'; }
    }
    if (v.healthIndicators?.malnutrition && reasons.length === 0) { reasons.push('Malnutrition (flagged in visit)'); riskLevel = 'Moderate'; }
    if (v.weight != null && v.age != null && reasons.length === 0) {
      const age = parseInt(v.age, 10);
      const wt = Number(v.weight);
      if (!isNaN(age) && !isNaN(wt) && age >= 1 && age <= 6) {
        const roughMin = age * 2 + 5;
        if (wt < roughMin) { reasons.push(`Weight below expected for age (${v.age} yrs, ${wt} kg)`); riskLevel = 'Moderate'; }
      }
    }
    if (reasons.length > 0) {
      aiAlerts.push({
        id: v._id,
        type: 'child_malnutrition',
        riskLevel,
        title: 'Child Malnutrition Alert',
        reason: reasons.join('; '),
        action: riskLevel === 'High' ? 'Nutrition rehabilitation and referral' : 'Nutrition intervention required',
        beneficiaryName: v.personName,
        date: v.visitDate,
        ashaArea: v.ashaArea || null,
        details: { weight: v.weight, muac: v.muac, age: v.age, height: v.height }
      });
    }
  });

  (adolescentVisits || []).forEach((v) => {
    if (v.hemoglobin == null || isNaN(v.hemoglobin)) return;
    const hb = Number(v.hemoglobin);
    if (hb < 12) {
      const riskLevel = hb < 10 ? 'High' : 'Moderate';
      aiAlerts.push({
        id: v._id,
        type: 'adolescent_anemia',
        riskLevel,
        title: 'Adolescent Anemia Alert',
        reason: `Hemoglobin ${hb} g/dL (below 12 g/dL for adolescents)`,
        action: riskLevel === 'High' ? 'Refer to PHC; iron supplementation' : 'Iron supplementation and follow-up',
        beneficiaryName: v.personName,
        date: v.visitDate,
        ashaArea: v.ashaArea || null,
        details: { hemoglobin: v.hemoglobin, age: v.age }
      });
    }
  });

  aiAlerts.sort((a, b) => new Date(b.date) - new Date(a.date));
  return aiAlerts;
}

module.exports = { parseBP, buildAiAlertsFromVisits };
