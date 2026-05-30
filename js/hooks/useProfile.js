import { useState, useMemo } from '../lib.js';
import { loadProfile, saveProfile } from '../storage/localStorage.js';
import { calcLeanMass, calcBMR } from '../calc/bmr.js';
import { calcTDEE, calcMacros, calcProteinTarget } from '../calc/macros.js';
import { assessDeficit } from '../calc/nutritionLogic.js';

export function useProfile() {
  const [profile, setProfileState] = useState(() => loadProfile());

  // calculated: alle abgeleiteten Werte neu berechnen wenn profile sich ändert
  const calculated = useMemo(() => {
    if (!profile) return null;

    const leanMass = calcLeanMass(profile.weight, profile.bodyFat);
    const bmr = calcBMR(leanMass);
    const tdeeTraining = calcTDEE(bmr, profile.trainingFactor);
    const tdeeRest = calcTDEE(bmr, profile.restFactor);
    const targetKcalTraining = tdeeTraining - profile.deficit;
    const targetKcalRest = tdeeRest - profile.deficit;
    const macrosTraining = calcMacros(profile, targetKcalTraining);
    const macrosRest = calcMacros(profile, targetKcalRest);
    const proteinTarget = calcProteinTarget(profile);
    const deficitAssessment = assessDeficit(profile, tdeeTraining); // Trainingstag als Referenz

    return {
      leanMass,
      bmr,
      tdeeTraining,
      tdeeRest,
      targetKcalTraining,
      targetKcalRest,
      macrosTraining,
      macrosRest,
      proteinTarget,
      deficitAssessment
    };
  }, [profile]);

  function setProfile(updates) {
    // updates kann ein vollständiges Profil-Objekt oder ein Patch sein
    const newProfile = { ...profile, ...updates };
    // leanMass automatisch aktualisieren
    newProfile.leanMass = calcLeanMass(newProfile.weight, newProfile.bodyFat);
    saveProfile(newProfile);
    setProfileState(newProfile);
  }

  return [profile, setProfile, calculated];
}
