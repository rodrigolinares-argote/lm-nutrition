/**
 * LM Nutrition — ProfileService
 * Gestiona el perfil único del usuario y calcula objetivos.
 */

import { db }                        from '../storage/db.js';
import { defaults }                  from '../storage/schema.js';
import { eventBus, EVENTS }         from '../utils/eventBus.js';
import { calcBMR, calcTDEE,
         calcCalorieTarget,
         calcMacroTargets, calcAge } from '../utils/macroCalc.js';

class ProfileService {
  async get() {
    return db.get('profile', 'main');
  }

  async isComplete() {
    const p = await this.get();
    return !!(p?.name && p?.sex && p?.birthDate && p?.heightCm && p?.weightKg && p?.activityLevel && p?.goal);
  }

  async save(data) {
    const existing = (await this.get()) ?? defaults.profile();
    const merged   = { ...existing, ...data, id: 'main', updatedAt: new Date().toISOString() };
    if (this._canCalc(merged)) merged.targets = this._calcTargets(merged);
    await db.put('profile', merged);
    await db.sync('profile', 'main');
    eventBus.emit(EVENTS.PROFILE_UPDATED, merged);
    return merged;
  }

  async getTargets() {
    const p = await this.get();
    return p?.targets ?? { calories: 2000, proteinG: 150, carbsG: 200, fatG: 67, waterMl: 2000 };
  }

  _canCalc(p) {
    return !!(p.sex && p.birthDate && p.heightCm && p.weightKg && p.activityLevel && p.goal);
  }

  _calcTargets(p) {
    const age      = calcAge(p.birthDate);
    const bmr      = calcBMR(p.sex, p.weightKg, p.heightCm, age);
    const tdee     = calcTDEE(bmr, p.activityLevel);
    const calories = calcCalorieTarget(tdee, p.goal);
    const { proteinG, carbsG, fatG } = calcMacroTargets(calories, p.weightKg, p.goal);
    return { calories, proteinG, carbsG, fatG, waterMl: p.targets?.waterMl ?? 2000 };
  }
}

export const profileService = new ProfileService();
