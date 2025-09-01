-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PROBATION', 'SABBATICAL', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('DAY', 'NIGHT', 'ROTATIONAL', 'FLEX');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'OTHER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED');

-- CreateTable
CREATE TABLE "StaffProfile" (
    "userId" TEXT NOT NULL,
    "employeeNo" TEXT,
    "fullName" TEXT NOT NULL,
    "preferredName" TEXT,
    "workEmail" TEXT,
    "personalEmail" TEXT,
    "phone" TEXT,
    "secondaryPhone" TEXT,
    "jobTitle" TEXT,
    "photoUrl" TEXT,
    "gender" "Gender",
    "dateOfBirth" TIMESTAMP(3),
    "maritalStatus" "MaritalStatus",
    "department" TEXT,
    "managerId" TEXT,
    "grade" TEXT,
    "costCenter" TEXT,
    "workLocation" TEXT,
    "workSchedule" TEXT,
    "employmentType" "EmploymentType",
    "shiftType" "ShiftType",
    "hiredAt" TIMESTAMP(3),
    "probationEndAt" TIMESTAMP(3),
    "terminatedAt" TIMESTAMP(3),
    "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "terminationReason" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "nationalId" TEXT,
    "taxId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_employeeNo_key" ON "StaffProfile"("employeeNo");

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_workEmail_key" ON "StaffProfile"("workEmail");

-- CreateIndex
CREATE INDEX "StaffProfile_department_idx" ON "StaffProfile"("department");

-- CreateIndex
CREATE INDEX "StaffProfile_status_idx" ON "StaffProfile"("status");

-- CreateIndex
CREATE INDEX "StaffProfile_employmentType_idx" ON "StaffProfile"("employmentType");

-- CreateIndex
CREATE INDEX "StaffProfile_managerId_idx" ON "StaffProfile"("managerId");

-- CreateIndex
CREATE INDEX "StaffProfile_deletedAt_idx" ON "StaffProfile"("deletedAt");

-- CreateIndex
CREATE INDEX "StaffProfile_grade_idx" ON "StaffProfile"("grade");

-- CreateIndex
CREATE INDEX "StaffProfile_dateOfBirth_idx" ON "StaffProfile"("dateOfBirth");

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "StaffProfile"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
