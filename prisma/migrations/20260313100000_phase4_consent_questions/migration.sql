-- Phase 4: Add questions JSON to consent_templates, change active default to false
ALTER TABLE "consent_templates" ADD COLUMN "questions" JSONB;
ALTER TABLE "consent_templates" ALTER COLUMN "active" SET DEFAULT false;
