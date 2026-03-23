/**
 * Derive Health Score (0–100) and supplement compliance from profile data
 * (Hb, BP, BMI, ASHA visits, supplement progress).
 */

export function parseBp(bpStr) {
  if (!bpStr || typeof bpStr !== 'string') return { sys: 120, dia: 80 };
  const m = String(bpStr).match(/(\d+)\s*\/\s*(\d+)/);
  if (!m) return { sys: 120, dia: 80 };
  return { sys: parseInt(m[1], 10), dia: parseInt(m[2], 10) };
}

/**
 * Average supplement progress % from iron / calcium / folicAcid blocks (uses merged current vs target).
 */
export function computeSupplementCompliancePercent(supplements) {
  if (!supplements || typeof supplements !== 'object') return 0;
  const keys = ['iron', 'calcium', 'folicAcid'];
  let sum = 0;
  let n = 0;
  for (const k of keys) {
    const s = supplements[k];
    if (s && Number(s.target) > 0) {
      const pct = Math.min(100, Math.round(((Number(s.current) || 0) / Number(s.target)) * 100));
      sum += pct;
      n += 1;
    }
  }
  return n === 0 ? 0 : Math.round(sum / n);
}

/**
 * Health score: penalize anemia, hypertension, BMI extremes, low ASHA contact.
 */
export function computeHealthScore({
  health,
  totalVisits = 0,
  gestationalWeek = 20,
}) {
  const hb = Number(health?.hemoglobin ?? health?.hb);
  const { sys, dia } = parseBp(health?.bp);
  const bmi = Number(health?.bmi);
  let score = 100;

  if (!Number.isNaN(hb)) {
    if (hb < 7) score -= 40;
    else if (hb < 9) score -= 28;
    else if (hb < 11) score -= 14;
    else if (hb < 12) score -= 6;
  }

  if (sys > 160 || dia > 100) score -= 28;
  else if (sys > 140 || dia > 90) score -= 16;

  if (!Number.isNaN(bmi)) {
    if (bmi < 16 || bmi > 40) score -= 14;
    else if (bmi < 18.5 || bmi > 35) score -= 10;
    else if (bmi > 30) score -= 5;
  }

  const gw = Math.min(42, Math.max(1, Number(gestationalWeek) || 20));
  const trimester = gw <= 13 ? 1 : gw <= 27 ? 2 : 3;
  const minVisits = trimester === 1 ? 1 : trimester === 2 ? 2 : 4;
  const v = Number(totalVisits) || 0;
  if (v < minVisits) {
    score -= Math.min(18, (minVisits - v) * 6);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
