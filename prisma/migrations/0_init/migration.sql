-- CreateTable
CREATE TABLE "MasterPIC" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterPIC_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterBranch" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterPrioritas" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterPrioritas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterStatus" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterKode" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterKode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterBnP" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterBnP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterSO" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterSO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterActivityType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterActivityType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "kode" TEXT,
    "branchId" INTEGER,
    "namaCalonMitra" TEXT NOT NULL,
    "prioritasId" INTEGER,
    "picId" INTEGER,
    "jenisKerjaSama" TEXT,
    "progressPercentage" INTEGER NOT NULL DEFAULT 0,
    "latestDateUpdated" TIMESTAMP(3),
    "latestUpdate" TEXT,
    "actionPlan" TEXT,
    "targetDate" TIMESTAMP(3),
    "linkDokumen" TEXT,
    "latestActivity" TEXT,
    "latestActivityStatusId" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "lastEditedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" SERIAL NOT NULL,
    "pageNumber" TEXT NOT NULL,
    "partnershipName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" SERIAL NOT NULL,
    "pageId" INTEGER NOT NULL,
    "no" INTEGER NOT NULL DEFAULT 0,
    "activity" TEXT NOT NULL,
    "bobot" INTEGER NOT NULL DEFAULT 0,
    "target" TEXT,
    "status" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "lastEditedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyProgress" (
    "id" SERIAL NOT NULL,
    "pageId" INTEGER NOT NULL,
    "date" TIMESTAMP(3),
    "activityType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetIfPlan" TIMESTAMP(3),
    "pic" TEXT NOT NULL,
    "category" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "lastEditedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PKROpex" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mitra" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "saldoTopUp" DECIMAL(15,2),
    "saldoPRK" DECIMAL(15,2),
    "evidence" TEXT,
    "pic" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "lastEditedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PKROpex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MasterPIC_name_key" ON "MasterPIC"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MasterBranch_name_key" ON "MasterBranch"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MasterPrioritas_name_key" ON "MasterPrioritas"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MasterStatus_name_key" ON "MasterStatus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MasterKode_name_key" ON "MasterKode"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MasterBnP_name_key" ON "MasterBnP"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MasterSO_name_key" ON "MasterSO"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MasterActivityType_name_key" ON "MasterActivityType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Project_code_key" ON "Project"("code");

-- CreateIndex
CREATE INDEX "Project_sortOrder_idx" ON "Project"("sortOrder");

-- CreateIndex
CREATE INDEX "Project_branchId_idx" ON "Project"("branchId");

-- CreateIndex
CREATE INDEX "Project_prioritasId_idx" ON "Project"("prioritasId");

-- CreateIndex
CREATE INDEX "Project_picId_idx" ON "Project"("picId");

-- CreateIndex
CREATE UNIQUE INDEX "Page_pageNumber_key" ON "Page"("pageNumber");

-- CreateIndex
CREATE INDEX "Workflow_pageId_idx" ON "Workflow"("pageId");

-- CreateIndex
CREATE INDEX "Workflow_sortOrder_idx" ON "Workflow"("sortOrder");

-- CreateIndex
CREATE INDEX "DailyProgress_pageId_idx" ON "DailyProgress"("pageId");

-- CreateIndex
CREATE INDEX "DailyProgress_sortOrder_idx" ON "DailyProgress"("sortOrder");

-- CreateIndex
CREATE INDEX "DailyProgress_date_idx" ON "DailyProgress"("date");

-- CreateIndex
CREATE INDEX "PKROpex_sortOrder_idx" ON "PKROpex"("sortOrder");

-- CreateIndex
CREATE INDEX "PKROpex_date_idx" ON "PKROpex"("date");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "MasterBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_prioritasId_fkey" FOREIGN KEY ("prioritasId") REFERENCES "MasterPrioritas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_picId_fkey" FOREIGN KEY ("picId") REFERENCES "MasterPIC"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_latestActivityStatusId_fkey" FOREIGN KEY ("latestActivityStatusId") REFERENCES "MasterStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyProgress" ADD CONSTRAINT "DailyProgress_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
