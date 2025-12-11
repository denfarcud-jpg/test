/*
  Warnings:

  - A unique constraint covering the columns `[bitrix_id]` on the table `organization` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bitrix_id]` on the table `partner` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "organization" ADD COLUMN     "bitrix_id" INTEGER;

-- AlterTable
ALTER TABLE "partner" ADD COLUMN     "bitrix_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "organization_bitrix_id_key" ON "organization"("bitrix_id");

-- CreateIndex
CREATE UNIQUE INDEX "partner_bitrix_id_key" ON "partner"("bitrix_id");
