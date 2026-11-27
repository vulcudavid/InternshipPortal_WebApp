-- AlterTable
ALTER TABLE "internship_offers" ADD COLUMN     "domains" "EngineeringDomain"[] DEFAULT ARRAY[]::"EngineeringDomain"[],
ALTER COLUMN "primary_domain" DROP NOT NULL,
ALTER COLUMN "primary_domain" DROP DEFAULT;
