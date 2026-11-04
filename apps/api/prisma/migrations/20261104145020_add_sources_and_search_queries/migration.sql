-- CreateTable
CREATE TABLE "ProjectSource" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "metrikaCounter" TEXT,
    "goalIds" TEXT[],
    "searchEngine" TEXT DEFAULT 'YANDEX',
    "regionId" INTEGER,
    "isAutoSync" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchQuery" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "targetUrl" TEXT,
    "frequency" INTEGER,
    "isMarker" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchQueryPosition" (
    "id" TEXT NOT NULL,
    "queryId" TEXT NOT NULL,
    "engine" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchQueryPosition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSource_projectId_key" ON "ProjectSource"("projectId");

-- CreateIndex
CREATE INDEX "SearchQuery_projectId_idx" ON "SearchQuery"("projectId");

-- CreateIndex
CREATE INDEX "SearchQuery_projectId_isMarker_idx" ON "SearchQuery"("projectId", "isMarker");

-- CreateIndex
CREATE INDEX "SearchQueryPosition_queryId_checkedAt_idx" ON "SearchQueryPosition"("queryId", "checkedAt");

-- AddForeignKey
ALTER TABLE "ProjectSource" ADD CONSTRAINT "ProjectSource_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchQuery" ADD CONSTRAINT "SearchQuery_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchQueryPosition" ADD CONSTRAINT "SearchQueryPosition_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "SearchQuery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
