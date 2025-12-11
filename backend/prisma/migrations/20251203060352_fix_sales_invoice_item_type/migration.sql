/*
  Warnings:

  - Changed the type of `count_location` on the `sales_invoice_item` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "sales_invoice_item" DROP COLUMN "count_location";

ALTER TABLE "sales_invoice_item" ADD COLUMN "count_location" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "sales_invoice_item" ALTER COLUMN "count_location" DROP DEFAULT;
