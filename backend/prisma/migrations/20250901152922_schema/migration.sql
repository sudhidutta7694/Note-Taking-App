-- AlterTable
ALTER TABLE "public"."notes" ALTER COLUMN "content" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "dateOfBirth" TIMESTAMP(3);
