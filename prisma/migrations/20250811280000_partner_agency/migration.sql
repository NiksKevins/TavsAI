-- Partner / agency layer (isolated from core Workspace tenancy)
-- Drop unused Referral stub (was never wired in application code)

DROP TABLE IF EXISTS "Referral";

CREATE TYPE "PartnerStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');
CREATE TYPE "PartnerMemberRole" AS ENUM ('OWNER', 'ADMIN', 'VIEWER');
CREATE TYPE "PartnerWorkspaceStatus" AS ENUM ('INVITED', 'ACTIVE', 'CHURNED');
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'VOID');

CREATE TABLE "Partner" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "PartnerStatus" NOT NULL DEFAULT 'ACTIVE',
    "defaultCommissionBps" INTEGER NOT NULL DEFAULT 2000,
    "branding" JSONB,
    "customDomain" TEXT,
    "widgetBrandName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Partner_slug_key" ON "Partner"("slug");
CREATE INDEX "Partner_status_idx" ON "Partner"("status");
CREATE INDEX "Partner_createdAt_idx" ON "Partner"("createdAt");

CREATE TABLE "PartnerMember" (
    "id" UUID NOT NULL,
    "partnerId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "PartnerMemberRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PartnerMember_partnerId_userId_key" ON "PartnerMember"("partnerId", "userId");
CREATE INDEX "PartnerMember_userId_idx" ON "PartnerMember"("userId");

CREATE TABLE "Referral" (
    "id" UUID NOT NULL,
    "partnerId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Referral_code_key" ON "Referral"("code");
CREATE INDEX "Referral_partnerId_idx" ON "Referral"("partnerId");

CREATE TABLE "PartnerWorkspace" (
    "id" UUID NOT NULL,
    "partnerId" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "status" "PartnerWorkspaceStatus" NOT NULL DEFAULT 'INVITED',
    "commissionBpsOverride" INTEGER,
    "source" TEXT,
    "referralId" UUID,
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerWorkspace_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PartnerWorkspace_workspaceId_key" ON "PartnerWorkspace"("workspaceId");
CREATE INDEX "PartnerWorkspace_partnerId_status_idx" ON "PartnerWorkspace"("partnerId", "status");
CREATE INDEX "PartnerWorkspace_referralId_idx" ON "PartnerWorkspace"("referralId");
CREATE INDEX "PartnerWorkspace_createdAt_idx" ON "PartnerWorkspace"("createdAt");

CREATE TABLE "Commission" (
    "id" UUID NOT NULL,
    "partnerId" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "partnerWorkspaceId" UUID NOT NULL,
    "stripeInvoiceId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "invoiceAmountCents" INTEGER NOT NULL,
    "commissionBps" INTEGER NOT NULL,
    "commissionAmountCents" INTEGER NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Commission_stripeInvoiceId_key" ON "Commission"("stripeInvoiceId");
CREATE INDEX "Commission_partnerId_createdAt_idx" ON "Commission"("partnerId", "createdAt");
CREATE INDEX "Commission_workspaceId_idx" ON "Commission"("workspaceId");
CREATE INDEX "Commission_status_idx" ON "Commission"("status");

ALTER TABLE "PartnerMember" ADD CONSTRAINT "PartnerMember_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnerMember" ADD CONSTRAINT "PartnerMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Referral" ADD CONSTRAINT "Referral_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PartnerWorkspace" ADD CONSTRAINT "PartnerWorkspace_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnerWorkspace" ADD CONSTRAINT "PartnerWorkspace_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnerWorkspace" ADD CONSTRAINT "PartnerWorkspace_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Commission" ADD CONSTRAINT "Commission_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_partnerWorkspaceId_fkey" FOREIGN KEY ("partnerWorkspaceId") REFERENCES "PartnerWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
