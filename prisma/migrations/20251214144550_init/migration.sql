/*
  Warnings:

  - You are about to drop the column `calories_burned` on the `workouts` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `workouts` table. All the data in the column will be lost.
  - You are about to drop the column `duration_minutes` on the `workouts` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `workouts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "workouts" DROP COLUMN "calories_burned",
DROP COLUMN "date",
DROP COLUMN "duration_minutes",
DROP COLUMN "type",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "exerciseId" TEXT;

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "exerciseApiId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "videoUrl" TEXT,
    "exerciseType" TEXT NOT NULL,
    "bodyParts" TEXT[],
    "equipments" TEXT[],
    "targetMuscles" TEXT[],
    "secondaryMuscles" TEXT[],
    "keywords" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutExercise" (
    "id" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "rest" INTEGER NOT NULL,

    CONSTRAINT "WorkoutExercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_exerciseApiId_key" ON "Exercise"("exerciseApiId");

-- AddForeignKey
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "workouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
