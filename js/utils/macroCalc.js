/**
 * LM Nutrition — Calculadora de macros
 * Funciones puras. Mifflin-St Jeor para BMR/TDEE.
 */

const ACTIVITY = {
  sedentary:   1.2,
  light:       1.375,
  moderate:    1.55,
  active:      1.725,
  very_active: 1.9
};

export function calcBMR(sex, weightKg, heightCm, age) {
  const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  return sex === 'male' ? base + 5 : base - 161;
}

export function calcTDEE(bmr, activityLevel) {
  return Math.round(bmr * (ACTIVITY[activityLevel] ?? 1.55));
}

export function calcCalorieTarget(tdee, goal) {
  const adj = { lose: -400, maintain: 0, gain: 300 };
  return Math.round(tdee + (adj[goal] ?? 0));
}

export function calcMacroTargets(calories, weightKg, goal) {
  const proteinG    = Math.round(weightKg * 2);
  const proteinKcal = proteinG * 4;
  const remaining   = calories - proteinKcal;
  const fatRatio    = { lose: 0.35, maintain: 0.30, gain: 0.25 }[goal] ?? 0.30;
  return {
    proteinG,
    carbsG: Math.round((remaining * (1 - fatRatio)) / 4),
    fatG:   Math.round((remaining * fatRatio) / 9)
  };
}

export function calcAge(birthDateStr) {
  const b = new Date(birthDateStr);
  const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  return a;
}

export function scaleMacros(per100g, quantityG) {
  const f = quantityG / 100;
  return {
    calories: Math.round(per100g.calories * f * 10) / 10,
    proteinG: Math.round(per100g.proteinG * f * 10) / 10,
    carbsG:   Math.round(per100g.carbsG   * f * 10) / 10,
    fatG:     Math.round(per100g.fatG     * f * 10) / 10
  };
}

export function sumMacros(items) {
  return items.reduce((a, i) => ({
    calories: a.calories + (i.calories ?? 0),
    proteinG: a.proteinG + (i.proteinG ?? 0),
    carbsG:   a.carbsG   + (i.carbsG   ?? 0),
    fatG:     a.fatG     + (i.fatG     ?? 0)
  }), { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 });
}

export function pct(consumed, target) {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((consumed / target) * 100));
}

export function calcBMI(weightKg, heightCm) {
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}

export function bmiCategory(bmi) {
  if (bmi < 18.5) return 'Bajo peso';
  if (bmi < 25)   return 'Normal';
  if (bmi < 30)   return 'Sobrepeso';
  return 'Obesidad';
}
