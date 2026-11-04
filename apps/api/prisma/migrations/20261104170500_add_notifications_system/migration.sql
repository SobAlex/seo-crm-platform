-- Тип события и компания добавляются к уже существующим уведомлениям.

CREATE TYPE "NotificationType" AS ENUM ('TASK_ASSIGNED', 'TASK_SUBMITTED', 'TASK_REWORK', 'TASK_DONE', 'TASK_COMMENT', 'REPORT_READY');

ALTER TABLE "Notification" ADD COLUMN "companyId" TEXT;

UPDATE "Notification" AS n
SET "companyId" = member."companyId"
FROM (
  SELECT DISTINCT ON ("userId") "userId", "companyId"
  FROM "CompanyMember"
  ORDER BY "userId", "createdAt" ASC
) AS member
WHERE member."userId" = n."userId";

DELETE FROM "Notification" WHERE "companyId" IS NULL;

ALTER TABLE "Notification" ALTER COLUMN "companyId" SET NOT NULL;

ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType" USING (
  CASE "type"
    WHEN 'report.approved' THEN 'REPORT_READY'
    WHEN 'task.review' THEN 'TASK_SUBMITTED'
    WHEN 'task.waiting_client' THEN 'TASK_COMMENT'
    WHEN 'TASK_ASSIGNED' THEN 'TASK_ASSIGNED'
    WHEN 'TASK_SUBMITTED' THEN 'TASK_SUBMITTED'
    WHEN 'TASK_REWORK' THEN 'TASK_REWORK'
    WHEN 'TASK_DONE' THEN 'TASK_DONE'
    WHEN 'TASK_COMMENT' THEN 'TASK_COMMENT'
    WHEN 'REPORT_READY' THEN 'REPORT_READY'
    ELSE 'TASK_COMMENT'
  END
)::"NotificationType";

CREATE INDEX "Notification_companyId_userId_isRead_idx" ON "Notification"("companyId", "userId", "isRead");
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
