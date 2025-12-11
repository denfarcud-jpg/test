/*
  Warnings:

  - You are about to drop the column `organization_id` on the `receipt` table. All the data in the column will be lost.
  - You are about to drop the column `partner_id` on the `receipt` table. All the data in the column will be lost.
  - You are about to drop the column `product_id` on the `receipt_item` table. All the data in the column will be lost.
  - You are about to drop the column `deal_id` on the `sales_invoice` table. All the data in the column will be lost.
  - You are about to drop the column `organization_id` on the `sales_invoice` table. All the data in the column will be lost.
  - You are about to drop the column `partner_id` on the `sales_invoice` table. All the data in the column will be lost.
  - You are about to drop the column `product_id` on the `sales_invoice_item` table. All the data in the column will be lost.
  - You are about to drop the column `deal_id` on the `write_off_act` table. All the data in the column will be lost.
  - You are about to drop the column `organization_id` on the `write_off_act` table. All the data in the column will be lost.
  - You are about to drop the column `product_id` on the `write_off_act_item` table. All the data in the column will be lost.
  - You are about to drop the `catalog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `organization` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `partner` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `product_name` to the `posting_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bitrix_org_id` to the `receipt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bitrix_partner_id` to the `receipt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `org_name` to the `receipt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `partner_name` to the `receipt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bitrix_product_id` to the `receipt_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_name` to the `receipt_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_name` to the `reservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bitrix_org_id` to the `sales_invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bitrix_partner_id` to the `sales_invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `org_name` to the `sales_invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `partner_name` to the `sales_invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bitrix_product_id` to the `sales_invoice_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_name` to the `sales_invoice_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bitrix_org_id` to the `write_off_act` table without a default value. This is not possible if the table is not empty.
  - Added the required column `org_name` to the `write_off_act` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bitrix_product_id` to the `write_off_act_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_name` to the `write_off_act_item` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "posting_item" DROP CONSTRAINT "posting_item_product_id_fkey";

-- DropForeignKey
ALTER TABLE "product" DROP CONSTRAINT "product_catalogId_fkey";

-- DropForeignKey
ALTER TABLE "receipt" DROP CONSTRAINT "receipt_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "receipt" DROP CONSTRAINT "receipt_partner_id_fkey";

-- DropForeignKey
ALTER TABLE "receipt_item" DROP CONSTRAINT "receipt_item_product_id_fkey";

-- DropForeignKey
ALTER TABLE "reservation" DROP CONSTRAINT "reservation_product_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_invoice" DROP CONSTRAINT "sales_invoice_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_invoice" DROP CONSTRAINT "sales_invoice_partner_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_invoice_item" DROP CONSTRAINT "sales_invoice_item_product_id_fkey";

-- DropForeignKey
ALTER TABLE "write_off_act" DROP CONSTRAINT "write_off_act_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "write_off_act_item" DROP CONSTRAINT "write_off_act_item_product_id_fkey";

-- AlterTable
ALTER TABLE "posting" ALTER COLUMN "deal_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "posting_item" ADD COLUMN     "product_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "receipt" DROP COLUMN "organization_id",
DROP COLUMN "partner_id",
ADD COLUMN     "bitrix_org_id" INTEGER NOT NULL,
ADD COLUMN     "bitrix_partner_id" INTEGER NOT NULL,
ADD COLUMN     "org_name" TEXT NOT NULL,
ADD COLUMN     "partner_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "receipt_item" DROP COLUMN "product_id",
ADD COLUMN     "bitrix_product_id" INTEGER NOT NULL,
ADD COLUMN     "product_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "reservation" ADD COLUMN     "product_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "sales_invoice" DROP COLUMN "deal_id",
DROP COLUMN "organization_id",
DROP COLUMN "partner_id",
ADD COLUMN     "bitrix_deal_id" INTEGER,
ADD COLUMN     "bitrix_org_id" INTEGER NOT NULL,
ADD COLUMN     "bitrix_partner_id" INTEGER NOT NULL,
ADD COLUMN     "org_name" TEXT NOT NULL,
ADD COLUMN     "partner_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "sales_invoice_item" DROP COLUMN "product_id",
ADD COLUMN     "bitrix_product_id" INTEGER NOT NULL,
ADD COLUMN     "product_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "write_off_act" DROP COLUMN "deal_id",
DROP COLUMN "organization_id",
ADD COLUMN     "bitrix_deal_id" INTEGER,
ADD COLUMN     "bitrix_org_id" INTEGER NOT NULL,
ADD COLUMN     "org_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "write_off_act_item" DROP COLUMN "product_id",
ADD COLUMN     "bitrix_product_id" INTEGER NOT NULL,
ADD COLUMN     "product_name" TEXT NOT NULL;

-- DropTable
DROP TABLE "catalog";

-- DropTable
DROP TABLE "organization";

-- DropTable
DROP TABLE "partner";

-- DropTable
DROP TABLE "product";
