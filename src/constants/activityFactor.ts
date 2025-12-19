export const ACTIVITY_FACTOR = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.4625,   // sesuai website ~exercise 4-5x/week
  ACTIVE: 1.55,        // daily exercise 3-4x/week
  VERY_ACTIVE: 1.725,  // intense 6-7x/week
  EXTRA_ACTIVE: 1.9,   // very intense daily / physical job
} as const;

  //sedentary,light,moderate,active,very active, extra active