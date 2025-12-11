/*
  Warnings:

  - Added the required column `bitrix_org_id` to the `posting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `org_name` to the `posting` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "posting" ADD COLUMN     "bitrix_org_id" INTEGER NOT NULL,
ADD COLUMN     "org_name" TEXT NOT NULL;
