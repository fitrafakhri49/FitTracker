-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "activity" "ActivityLevel",
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "heightCm" DOUBLE PRECISION,
ADD COLUMN     "maintenanceCalories" INTEGER,
ADD COLUMN     "weightKg" DOUBLE PRECISION;
