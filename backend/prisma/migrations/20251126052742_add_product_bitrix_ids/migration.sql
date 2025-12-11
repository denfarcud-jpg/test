/*
  Warnings:

  - A unique constraint covering the columns `[bitrix_id]` on the table `catalog` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bitrix_id]` on the table `product` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "catalog" ADD COLUMN     "bitrix_id" INTEGER;

-- AlterTable
ALTER TABLE "product" ADD COLUMN     "bitrix_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "catalog_bitrix_id_key" ON "catalog"("bitrix_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_bitrix_id_key" ON "product"("bitrix_id");
