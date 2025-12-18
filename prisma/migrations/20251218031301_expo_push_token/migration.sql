-- CreateTable
CREATE TABLE "expo_push_tokens" (
    "id" UUID NOT NULL,
    "user_id" TEXT,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expo_push_tokens_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "expo_push_tokens" ADD CONSTRAINT "expo_push_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
