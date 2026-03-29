import { parseBp } from './pregnancyHealthMetrics';

function levelRank(level) {
  if (level === 'High') return 3;
  if (level === 'Moderate') return 2;
  return 1;
}

/**
 * Rule-based pregnancy risk from ASHA field visits (aligned with backend/utils/aiHealthAlerts.js).
 * @param {Array<object>} visits - ASHAFieldVisit docs for this beneficiary (woman)
 * @param {object} profile - pregnancy profile from API / session (optional, for EDD / gestational week)
 */
export function buildPregnancyInsightsFromAshaVisits(visits, profile) {
  if (!Array.isArray(visits) || visits.length === 0) {
    return null;
  }

  let worst = 'Low';
  const seen = new Set();
  const reasons = [];

  const addReason = (r) => {
    if (r && !seen.has(r)) {
      seen.add(r);
      reasons.push(r);
    }
  };

  visits.forEach((v) => {
    let level = 'Low';
    const visitReasons = [];

    if (v.hemoglobin != null && !isNaN(v.hemoglobin)) {
      const hb = Number(v.hemoglobin);
      if (hb < 7) {
        visitReasons.push(`Severe anemia (Hb ${hb} g/dL)`);
        level = 'High';
      } else if (hb < 10) {
        visitReasons.push(`Moderate anemia (Hb ${hb} g/dL)`);
        if (level !== 'High') level = 'Moderate';
      } else if (hb < 11) {
        visitReasons.push(`Mild anemia (Hb ${hb} g/dL)`);
        if (level === 'Low') level = 'Moderate';
      }
    }

    const bp = parseBp(v.bloodPressure);
    if (bp && (bp.sys >= 140 || bp.dia >= 90)) {
      visitReasons.push(`Hypertension / pre-eclampsia risk (BP ${v.bloodPressure})`);
      level = 'High';
    }

    const age = v.age != null ? parseInt(v.age, 10) : null;
    if (age != null && !isNaN(age)) {
      if (age < 18) {
        visitReasons.push(`Young maternal age (${age} years)`);
        level = 'High';
      } else if (age > 35) {
        visitReasons.push(`Advanced maternal age (${age} years)`);
        if (level !== 'High') level = 'Moderate';
      }
    }

    if (v.weight != null && v.height != null && Number(v.height) > 0) {
      const heightM = Number(v.height) / 100;
      const bmi = Number(v.weight) / (heightM * heightM);
      if (bmi < 18.5) {
        visitReasons.push(`Underweight (BMI ${bmi.toFixed(1)})`);
        if (level === 'Low') level = 'Moderate';
      } else if (bmi >= 30) {
        visitReasons.push(`High BMI (BMI ${bmi.toFixed(1)})`);
        level = 'High';
      }
    }

    if (v.healthIndicators?.highRiskPregnancy) {
      visitReasons.push('High-risk pregnancy (flagged in ASHA field visit)');
      level = 'High';
    }
    if (v.healthIndicators?.anemia && !visitReasons.some((r) => r.toLowerCase().includes('anemia'))) {
      visitReasons.push('Anemia (flagged in visit)');
      if (level === 'Low') level = 'Moderate';
    }

    visitReasons.forEach((r) => addReason(r));
    if (levelRank(level) > levelRank(worst)) worst = level;
  });

  const sorted = [...visits].sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
  const latest = sorted[0];

  const overallRisk = worst === 'High' ? 'high' : worst === 'Moderate' ? 'medium' : 'low';
  const riskScore = worst === 'High' ? 68 : worst === 'Moderate' ? 42 : 18;

  const gw = profile?.woman?.gestationalWeek ?? 20;
  const birthWeightEstimate = `${(2.5 + gw * 0.05).toFixed(1)} kg`;
  const edd =
    profile?.woman?.edd ||
    (latest?.visitDate ? new Date(latest.visitDate).toISOString().split('T')[0] : '—');

  const complicationsRisk =
    worst === 'High' ? 'elevated' : worst === 'Moderate' ? 'moderate' : 'minimal';

  let iron = 'needs_improvement';
  let calcium = 'needs_improvement';
  let folicAcid = 'needs_improvement';
  visits.forEach((v) => {
    const s = v.supplements || {};
    if (s.iron) iron = 'adequate';
    if (s.calcium) calcium = 'adequate';
    if (s.folicAcid) folicAcid = 'adequate';
  });

  const visitCount = visits.length;
  const visitAdherence =
    visitCount >= 4 ? 'good' : visitCount >= 1 ? 'moderate' : 'needs_follow_up';

  const recommendations = [];
  if (worst === 'High') {
    recommendations.push('Refer to PHC or ANM urgently based on ASHA visit findings.');
  } else if (worst === 'Moderate') {
    recommendations.push('Continue ANC visits and follow ASHA advice on diet and supplements.');
  } else {
    recommendations.push('Continue routine ANC and maintain iron/folic acid as prescribed.');
  }
  if (reasons.length === 0) {
    recommendations.push('No risk flags recorded in ASHA field visits; keep regular checkups.');
  }
  reasons.slice(0, 5).forEach((r) => recommendations.push(`Monitor: ${r}`));

  const nextCheck =
    profile?.appointments?.[0]?.date ||
    (latest?.visitDate
      ? new Date(new Date(latest.visitDate).getTime() + 14 * 86400000).toISOString().split('T')[0]
      : '—');

  return {
    source: 'asha_field_visits',
    worstLevel: worst,
    overallRisk,
    riskScore,
    reasons,
    latestVisit: latest,
    recommendations,
    predictiveAnalytics: {
      birthWeightPrediction: birthWeightEstimate,
      deliveryDatePrediction: edd,
      complicationsRisk,
      recoveryTimePrediction: '6 weeks (typical postpartum; confirm with doctor)',
    },
    nutritionalAnalysis: {
      ironSupplements: iron,
      calciumSupplements: calcium,
      folicAcidSupplements: folicAcid,
    },
    behavioralInsights: {
      ashaVisitAdherence: visitAdherence,
      recordedVisits: visitCount,
    },
    personalizedCarePlan: {
      nextCriticalCheckup: nextCheck,
      recommendedTests:
        worst === 'High'
          ? ['Hb repeat', 'BP monitoring', 'Urine protein if advised']
          : worst === 'Moderate'
            ? ['Hb panel', 'Routine ANC']
            : ['Routine ANC'],
      lifestyleModifications: [
        'Balanced diet rich in iron and protein',
        'Rest and light activity as advised by ASHA/ANM',
      ],
      warningSigns: [
        'Severe headache or vision changes',
        'Swelling of face or hands',
        'Bleeding or reduced baby movements',
      ],
    },
    riskBreakdown: buildRiskBreakdown(visits, worst),
  };
}

function probForRisk(r) {
  if (r === 'high') return 0.85;
  if (r === 'medium') return 0.55;
  if (r === 'low') return 0.25;
  return 0.15;
}

function buildRiskBreakdown(visits, worstOverall) {
  const hb = hbRiskFromVisits(visits);
  const bp = bpRiskFromVisits(visits);
  const hr = worstOverall === 'High' ? 'high' : 'low';
  return [
    { key: 'anemia', label: 'Anemia (Hb from visits)', risk: hb, probability: probForRisk(hb) },
    { key: 'hypertension', label: 'Blood pressure', risk: bp, probability: probForRisk(bp) },
    { key: 'highRiskPregnancy', label: 'High-risk pregnancy (ASHA flag)', risk: hr, probability: probForRisk(hr) },
  ];
}

function hbRiskFromVisits(visits) {
  let worst = 'low';
  visits.forEach((v) => {
    if (v.hemoglobin == null || isNaN(v.hemoglobin)) return;
    const hb = Number(v.hemoglobin);
    if (hb < 7) worst = 'high';
    else if (hb < 11 && worst !== 'high') worst = 'medium';
  });
  return worst;
}

function bpRiskFromVisits(visits) {
  let worst = 'low';
  visits.forEach((v) => {
    const bp = parseBp(v.bloodPressure);
    if (bp && (bp.sys >= 140 || bp.dia >= 90)) worst = 'high';
    else if (bp && (bp.sys >= 130 || bp.dia >= 85) && worst !== 'high') worst = 'medium';
  });
  return worst;
}
