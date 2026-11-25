-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."ApplicationStatus" AS ENUM ('APPLIED', 'INTERVIEW_SCHEDULED', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."AuditActionType" AS ENUM ('COMPANY_APPROVE', 'COMPANY_REJECT', 'OFFER_WITHDRAW', 'OFFER_ACTIVATE', 'SETTINGS_UPDATE', 'GDPR_ANONYMIZE', 'USER_ROLE_CHANGE', 'USER_STATUS_CHANGE');

-- CreateEnum
CREATE TYPE "public"."CompanyStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."ConventionStatus" AS ENUM ('DRAFT', 'GENERATED', 'SIGNED_BY_STUDENT', 'SIGNED_BY_COMPANY', 'APPROVED_BY_COORDINATOR', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."EngineeringDomain" AS ENUM ('COMPUTER_SCIENCE_IT', 'ELECTRONICS_TELECOM', 'ROBOTICS_MECHATRONICS', 'INDUSTRIAL_MANAGEMENT', 'GENERAL_ENGINEERING');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('OFFER_WITHDRAWN', 'COMPANY_STATUS_CHANGED', 'SYSTEM_ALERT', 'PLACEMENT_CANCELLED');

-- CreateEnum
CREATE TYPE "public"."OfferStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."PlacementStatus" AS ENUM ('PENDING_CONFIRMATION', 'CONFIRMED', 'REFUSED_BY_STUDENT', 'CANCELLED_BY_COMPANY', 'CANCELLED_BY_COORDINATOR', 'NEPLASAT');

-- CreateEnum
CREATE TYPE "public"."ProficiencyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "public"."TieBreakerRule" AS ENUM ('APPLICATION_ORDER', 'ACADEMIC_SCORE');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('STUDENT', 'COMPANY_TUTOR', 'COORDINATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."WorkLogStatus" AS ENUM ('PENDING', 'VALIDATED_TUTOR', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action_type" "public"."AuditActionType" NOT NULL,
    "target_entity" TEXT NOT NULL,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_applicant_ranks" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "feedback" TEXT,
    "status" "public"."ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_applicant_ranks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "cui_cif" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "contact_phone" TEXT,
    "status" "public"."CompanyStatus" NOT NULL DEFAULT 'APPROVED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."final_evaluations" (
    "id" TEXT NOT NULL,
    "placement_id" TEXT NOT NULL,
    "grade" DOUBLE PRECISION,
    "feedback" TEXT,
    "competencies_acquired" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "evaluator_name" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "final_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."internship_conventions" (
    "id" TEXT NOT NULL,
    "placement_id" TEXT NOT NULL,
    "convention_number" TEXT NOT NULL,
    "status" "public"."ConventionStatus" NOT NULL DEFAULT 'DRAFT',
    "prefilled_data" JSONB NOT NULL,
    "generated_pdf_url" TEXT,
    "signed_pdf_url" TEXT,
    "signed_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internship_conventions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."internship_offers" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "primary_domain" "public"."EngineeringDomain" NOT NULL DEFAULT 'COMPUTER_SCIENCE_IT',
    "slots_total" INTEGER NOT NULL DEFAULT 1,
    "slots_available" INTEGER NOT NULL DEFAULT 1,
    "location" TEXT NOT NULL,
    "is_remote" BOOLEAN NOT NULL DEFAULT false,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "tutor_name" TEXT NOT NULL,
    "tutor_email" TEXT NOT NULL,
    "status" "public"."OfferStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internship_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."interview_slots" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "student_id" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "meeting_link" TEXT,
    "is_booked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL DEFAULT 'SYSTEM_ALERT',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."offer_tags" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offer_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."placements" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "status" "public"."PlacementStatus" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "matched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_preferences" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "faculty" TEXT NOT NULL DEFAULT 'Facultatea de Inginerie ULBS',
    "specialization" TEXT NOT NULL,
    "study_year" INTEGER NOT NULL,
    "group" TEXT NOT NULL,
    "domain" "public"."EngineeringDomain" NOT NULL DEFAULT 'COMPUTER_SCIENCE_IT',
    "headline" TEXT,
    "bio" TEXT,
    "phone" TEXT,
    "cv_url" TEXT,
    "github_url" TEXT,
    "linkedin_url" TEXT,
    "portfolio_url" TEXT,
    "available_from" TIMESTAMP(3),
    "available_to" TIMESTAMP(3),
    "gdpr_consent" BOOLEAN NOT NULL DEFAULT false,
    "gdpr_consent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_tags" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "proficiency" "public"."ProficiencyLevel" NOT NULL DEFAULT 'INTERMEDIATE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "required_hours" INTEGER NOT NULL DEFAULT 120,
    "tie_breaker_rule" "public"."TieBreakerRule" NOT NULL DEFAULT 'APPLICATION_ORDER',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" "public"."EngineeringDomain" NOT NULL DEFAULT 'COMPUTER_SCIENCE_IT',
    "is_predefined" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'STUDENT',
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."work_logs" (
    "id" TEXT NOT NULL,
    "placement_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hours_worked" INTEGER NOT NULL,
    "activity_summary" TEXT NOT NULL,
    "status" "public"."WorkLogStatus" NOT NULL DEFAULT 'PENDING',
    "tutor_feedback" TEXT,
    "validated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_action_type_idx" ON "public"."audit_logs"("action_type" ASC);

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "public"."audit_logs"("actor_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "company_applicant_ranks_offer_id_rank_key" ON "public"."company_applicant_ranks"("offer_id" ASC, "rank" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "company_applicant_ranks_offer_id_student_id_key" ON "public"."company_applicant_ranks"("offer_id" ASC, "student_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "company_profiles_cui_cif_key" ON "public"."company_profiles"("cui_cif" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "company_profiles_user_id_key" ON "public"."company_profiles"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "final_evaluations_placement_id_key" ON "public"."final_evaluations"("placement_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "internship_conventions_convention_number_key" ON "public"."internship_conventions"("convention_number" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "internship_conventions_placement_id_key" ON "public"."internship_conventions"("placement_id" ASC);

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "public"."notifications"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "offer_tags_offer_id_tag_id_key" ON "public"."offer_tags"("offer_id" ASC, "tag_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "placements_student_id_key" ON "public"."placements"("student_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "student_preferences_student_id_offer_id_key" ON "public"."student_preferences"("student_id" ASC, "offer_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "student_preferences_student_id_rank_key" ON "public"."student_preferences"("student_id" ASC, "rank" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_user_id_key" ON "public"."student_profiles"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "student_tags_student_id_tag_id_key" ON "public"."student_tags"("student_id" ASC, "tag_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "public"."tags"("name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email" ASC);

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_applicant_ranks" ADD CONSTRAINT "company_applicant_ranks_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."internship_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_applicant_ranks" ADD CONSTRAINT "company_applicant_ranks_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_profiles" ADD CONSTRAINT "company_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."final_evaluations" ADD CONSTRAINT "final_evaluations_placement_id_fkey" FOREIGN KEY ("placement_id") REFERENCES "public"."placements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."internship_conventions" ADD CONSTRAINT "internship_conventions_placement_id_fkey" FOREIGN KEY ("placement_id") REFERENCES "public"."placements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."internship_offers" ADD CONSTRAINT "internship_offers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interview_slots" ADD CONSTRAINT "interview_slots_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."internship_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interview_slots" ADD CONSTRAINT "interview_slots_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offer_tags" ADD CONSTRAINT "offer_tags_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."internship_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offer_tags" ADD CONSTRAINT "offer_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."placements" ADD CONSTRAINT "placements_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."internship_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."placements" ADD CONSTRAINT "placements_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_preferences" ADD CONSTRAINT "student_preferences_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."internship_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_preferences" ADD CONSTRAINT "student_preferences_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_profiles" ADD CONSTRAINT "student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_tags" ADD CONSTRAINT "student_tags_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_tags" ADD CONSTRAINT "student_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_logs" ADD CONSTRAINT "work_logs_placement_id_fkey" FOREIGN KEY ("placement_id") REFERENCES "public"."placements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

