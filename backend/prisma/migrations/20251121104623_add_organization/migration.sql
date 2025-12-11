-- AlterTable
ALTER TABLE "receipt" ADD COLUMN     "organization_id" INTEGER;

-- AlterTable
ALTER TABLE "sales_invoice" ADD COLUMN     "organization_id" INTEGER;

-- AlterTable
ALTER TABLE "write_off_act" ADD COLUMN     "organization_id" INTEGER;

-- CreateTable
CREATE TABLE "organization" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "inn" TEXT,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "receipt" ADD CONSTRAINT "receipt_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoice" ADD CONSTRAINT "sales_invoice_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "write_off_act" ADD CONSTRAINT "write_off_act_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
