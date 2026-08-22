-- CreateTable
CREATE TABLE "LearningAttempt" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "grade" "Grade" NOT NULL,
    "selectedAnswer" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LearningAttempt_userId_idx" ON "LearningAttempt"("userId");

-- CreateIndex
CREATE INDEX "LearningAttempt_userId_answeredAt_idx" ON "LearningAttempt"("userId", "answeredAt");

-- AddForeignKey
ALTER TABLE "LearningAttempt" ADD CONSTRAINT "LearningAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
