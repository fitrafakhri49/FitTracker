-- CreateTable
CREATE TABLE "WorkoutHistory" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutHistoryExercise" (
    "id" TEXT NOT NULL,
    "workoutHistoryId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION,

    CONSTRAINT "WorkoutHistoryExercise_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WorkoutHistoryExercise" ADD CONSTRAINT "WorkoutHistoryExercise_workoutHistoryId_fkey" FOREIGN KEY ("workoutHistoryId") REFERENCES "WorkoutHistory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
