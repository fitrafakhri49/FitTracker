-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar_url" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_stats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_workouts" INTEGER NOT NULL DEFAULT 0,
    "total_calories" INTEGER NOT NULL DEFAULT 0,
    "streak_days" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workouts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "calories_burned" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_stats_user_id_key" ON "user_stats"("user_id");

-- CreateIndex
CREATE INDEX "workouts_user_id_idx" ON "workouts"("user_id");

-- AddForeignKey
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
