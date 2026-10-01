// Explicitly assessed, complete comparison cases for component-weight tests.
// Each test overrides the factor under study. These are not UI defaults:
// missing-input tests call the raw helpers without this fixture.
export const completeCases = {
  recommendAcuteDAPT: { noncardioembolicConfirmed: true, hemorrhageExcluded: true, reperfusionExcluded: true, antiplateletContraindicationsReviewed: true },
  calculateESSEN: { age: 40, hypertension: false, diabetes: false, priorMI: false, otherCV: false, pad: false, smoker: false, priorTIA: false },
  calculateSPI2: { age: 40, hypertension: false, diabetes: false, cad: false, priorStroke: false, chf: false, indexEventStroke: false },
  calculateBAT: { blendSign: false, hypodensity: false, timeToCTHours: 10 },
  calculateBRAIN: { volumeMl: 5, recurrentICH: false, anticoagulated: false, ivh: false, onsetToCTHours: 10 },
  calculateNinePoint: { warfarin: false, spotSign: false, volumeMl: 5, onsetToCTHours: 10 },
  calculateCHADS2VA: { chf: false, hypertension: false, age: 40, diabetes: false, strokeTia: false, vascular: false },
  calculateHAVOC: { hypertension: false, age: 40, valvularDisease: false, peripheralVascularDisease: false, obesity: false, heartFailure: false, coronaryArteryDisease: false },
  interpretBarnesJewishDysphagia: { gcs15: true, canSitUpright: true, lowerFacialAsymmetry: false, tongueAsymmetry: false, palatalAsymmetry: false, throatClearing: false, coughOnWater3oz: false, voiceChange: false },
  interpretMRS9Q: { q1Symptoms: false, q2BowelBladder: false, q3Dressing: false, q4Walking: true, q5WalkingUnaided: true, q6Work: true, q7Chores: true, q8Hobbies: true, q9NeedsHelp: 'none' },
  calculateSeLECTScore: { corticalInvolvement: false, earlySeizure: false, largeArteryAtherosclerosis: false, middleCerebralTerritory: false },
  calculateEDEMAScore: { basalCisternEffacement: false, glucoseMgDl: 100, noReperfusionTherapy: false, noPreviousStroke: false },
  recommendVTEProphylaxis: { immobile: true }
};
