-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SEEKER', 'NURSERY', 'ADMIN');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('APPLIED', 'SCREENING', 'MATCHED', 'WORKING', 'COMPLETED', 'REVIEW_OPEN', 'REVIEW_DONE');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('NONE', 'PARTIAL', 'DONE');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "agreedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supabaseId" TEXT,
    "lineUserId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeekerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "realName" TEXT,
    "displayName" TEXT,
    "license" BOOLEAN NOT NULL DEFAULT false,
    "blankYears" TEXT,
    "preferredArea" TEXT,
    "preferredStyle" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bio" TEXT,
    "experience" TEXT,
    "skills" TEXT,
    "ngConditions" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeekerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NurseryProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nurseryName" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "address" TEXT,
    "contactName" TEXT,
    "phone" TEXT,
    "concept" TEXT,
    "policy" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NurseryProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "nurseryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "workContent" TEXT NOT NULL,
    "workDate" TIMESTAMP(3) NOT NULL,
    "workTimeStart" TEXT NOT NULL,
    "workTimeEnd" TEXT NOT NULL,
    "hourlyWage" INTEGER,
    "targetPerson" TEXT,
    "remarks" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'OPEN',
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "seekerId" TEXT NOT NULL,
    "applyMessage" TEXT,
    "lineContactOk" BOOLEAN NOT NULL DEFAULT false,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "nurseryId" TEXT NOT NULL,
    "seekerId" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'APPLIED',
    "lineContacted" BOOLEAN NOT NULL DEFAULT false,
    "workDate" TIMESTAMP(3),
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'NONE',
    "adminMemo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkReport" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "reporterType" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL,
    "comment" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewNurseryToSeeker" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "nurseryId" TEXT NOT NULL,
    "seekerId" TEXT NOT NULL,
    "attitude" INTEGER NOT NULL,
    "communication" INTEGER NOT NULL,
    "skill" INTEGER NOT NULL,
    "comment" TEXT,
    "wouldRehire" BOOLEAN NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewNurseryToSeeker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewSeekerToNursery" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "seekerId" TEXT NOT NULL,
    "nurseryId" TEXT NOT NULL,
    "explanation" INTEGER NOT NULL,
    "atmosphere" INTEGER NOT NULL,
    "support" INTEGER NOT NULL,
    "clarity" INTEGER NOT NULL,
    "comment" TEXT,
    "wouldWorkAgain" BOOLEAN NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewSeekerToNursery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseId_key" ON "User"("supabaseId");

-- CreateIndex
CREATE UNIQUE INDEX "User_lineUserId_key" ON "User"("lineUserId");

-- CreateIndex
CREATE UNIQUE INDEX "SeekerProfile_userId_key" ON "SeekerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NurseryProfile_userId_key" ON "NurseryProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_applicationId_key" ON "Match"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewNurseryToSeeker_matchId_key" ON "ReviewNurseryToSeeker"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewSeekerToNursery_matchId_key" ON "ReviewSeekerToNursery"("matchId");

-- AddForeignKey
ALTER TABLE "SeekerProfile" ADD CONSTRAINT "SeekerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurseryProfile" ADD CONSTRAINT "NurseryProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_nurseryId_fkey" FOREIGN KEY ("nurseryId") REFERENCES "NurseryProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPosting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES "SeekerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPosting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_nurseryId_fkey" FOREIGN KEY ("nurseryId") REFERENCES "NurseryProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES "SeekerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkReport" ADD CONSTRAINT "WorkReport_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewNurseryToSeeker" ADD CONSTRAINT "ReviewNurseryToSeeker_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewNurseryToSeeker" ADD CONSTRAINT "ReviewNurseryToSeeker_nurseryId_fkey" FOREIGN KEY ("nurseryId") REFERENCES "NurseryProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewNurseryToSeeker" ADD CONSTRAINT "ReviewNurseryToSeeker_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES "SeekerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSeekerToNursery" ADD CONSTRAINT "ReviewSeekerToNursery_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSeekerToNursery" ADD CONSTRAINT "ReviewSeekerToNursery_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES "SeekerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSeekerToNursery" ADD CONSTRAINT "ReviewSeekerToNursery_nurseryId_fkey" FOREIGN KEY ("nurseryId") REFERENCES "NurseryProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
