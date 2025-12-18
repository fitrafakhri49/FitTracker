import { ACTIVITY_FACTOR } from "../constants/activityFactor";
import { getAge } from "./age";

interface CalorieInput {
  gender: "MALE" | "FEMALE";
  weightKg: number;
  heightCm: number;
  birthDate: Date;
  activity: keyof typeof ACTIVITY_FACTOR;
}

export function calculateMaintenanceCalories(input: CalorieInput): number {
  const age = getAge(input.birthDate);

  const bmr =
    input.gender === "MALE"
      ? 10 * input.weightKg + 6.25 * input.heightCm - 5 * age + 5
      : 10 * input.weightKg + 6.25 * input.heightCm - 5 * age - 161;

  const tdee = bmr * ACTIVITY_FACTOR[input.activity];
  return Math.round(tdee);
}
