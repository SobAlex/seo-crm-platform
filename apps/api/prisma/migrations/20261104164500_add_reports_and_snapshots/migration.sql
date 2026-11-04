-- Поля снимка и компании добавляются поверх существующей таблицы Report.
-- Сначала колонки допускают пустое значение, затем строки заполняются из проекта и периода.

ALTER TABLE "Report" ADD COLUMN "companyId" TEXT,
ADD COLUMN "month" TEXT,
ADD COLUMN "title" TEXT,
ADD COLUMN "snapshot" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN "sentToEmail" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "Report" AS r
SET
  "companyId" = p."companyId",
  "month" = to_char(r."periodMonth", 'YYYY-MM'),
  "updatedAt" = r."createdAt"
FROM "Project" AS p
WHERE r."projectId" = p."id";

UPDATE "Report"
SET "title" = 'Отчёт по SEO за ' ||
  CASE substring("month" from 6 for 2)
    WHEN '01' THEN 'Январь'
    WHEN '02' THEN 'Февраль'
    WHEN '03' THEN 'Март'
    WHEN '04' THEN 'Апрель'
    WHEN '05' THEN 'Май'
    WHEN '06' THEN 'Июнь'
    WHEN '07' THEN 'Июль'
    WHEN '08' THEN 'Август'
    WHEN '09' THEN 'Сентябрь'
    WHEN '10' THEN 'Октябрь'
    WHEN '11' THEN 'Ноябрь'
    WHEN '12' THEN 'Декабрь'
    ELSE "month"
  END || ' ' || substring("month" from 1 for 4)
WHERE "title" IS NULL;

ALTER TABLE "Report" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Report" ALTER COLUMN "month" SET NOT NULL;
ALTER TABLE "Report" ALTER COLUMN "title" SET NOT NULL;
ALTER TABLE "Report" ALTER COLUMN "updatedAt" SET NOT NULL;

CREATE UNIQUE INDEX "Report_projectId_month_key" ON "Report"("projectId", "month");
CREATE INDEX "Report_companyId_status_idx" ON "Report"("companyId", "status");
CREATE INDEX "Report_publicToken_idx" ON "Report"("publicToken");

ALTER TABLE "Report" ADD CONSTRAINT "Report_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
