export const KG_TO_LBS = 2.20462;

export const kgToLbs = (kg: number): number =>
  Math.round(kg * KG_TO_LBS * 10) / 10;

export const lbsToKg = (lbs: number): number => lbs / KG_TO_LBS;

export const cmToInches = (cm: number): number =>
  Math.round(cm * 0.393701 * 10) / 10;

export const inchesToCm = (inches: number): number => inches * 2.54;
