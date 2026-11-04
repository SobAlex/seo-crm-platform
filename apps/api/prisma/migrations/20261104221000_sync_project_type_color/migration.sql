-- Цвет маркера типа проекта и реквизиты компании для форм настроек.
ALTER TABLE "ProjectType" ADD COLUMN "color" TEXT NOT NULL DEFAULT 'violet';

ALTER TABLE "Company" ADD COLUMN "city" TEXT;
ALTER TABLE "Company" ADD COLUMN "email" TEXT;
