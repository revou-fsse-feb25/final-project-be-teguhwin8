-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PolicyType" ADD VALUE 'TERMS_AND_CONDITIONS_GENERAL';
ALTER TYPE "PolicyType" ADD VALUE 'TERMS_AND_CONDITIONS_SUBSCRIPTION';
ALTER TYPE "PolicyType" ADD VALUE 'TERMS_AND_CONDITIONS_PROMO';
ALTER TYPE "PolicyType" ADD VALUE 'DISCLAIMER_PROMO';
ALTER TYPE "PolicyType" ADD VALUE 'PRIVACY_POLICY_GENERAL';
ALTER TYPE "PolicyType" ADD VALUE 'COOKIE_POLICY_GENERAL';
