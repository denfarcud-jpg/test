-- DropForeignKey
ALTER TABLE "posting_item" DROP CONSTRAINT "posting_item_posting_id_fkey";

-- DropForeignKey
ALTER TABLE "posting_item" DROP CONSTRAINT "posting_item_product_id_fkey";

-- DropForeignKey
ALTER TABLE "receipt_item" DROP CONSTRAINT "receipt_item_product_id_fkey";

-- DropForeignKey
ALTER TABLE "receipt_item" DROP CONSTRAINT "receipt_item_receipt_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_invoice_item" DROP CONSTRAINT "sales_invoice_item_product_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_invoice_item" DROP CONSTRAINT "sales_invoice_item_sales_invoice_id_fkey";

-- DropForeignKey
ALTER TABLE "write_off_act_item" DROP CONSTRAINT "write_off_act_item_product_id_fkey";

-- DropForeignKey
ALTER TABLE "write_off_act_item" DROP CONSTRAINT "write_off_act_item_write_off_act_id_fkey";

-- AddForeignKey
ALTER TABLE "receipt_item" ADD CONSTRAINT "receipt_item_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_item" ADD CONSTRAINT "receipt_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoice_item" ADD CONSTRAINT "sales_invoice_item_sales_invoice_id_fkey" FOREIGN KEY ("sales_invoice_id") REFERENCES "sales_invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoice_item" ADD CONSTRAINT "sales_invoice_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posting_item" ADD CONSTRAINT "posting_item_posting_id_fkey" FOREIGN KEY ("posting_id") REFERENCES "posting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posting_item" ADD CONSTRAINT "posting_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "write_off_act_item" ADD CONSTRAINT "write_off_act_item_write_off_act_id_fkey" FOREIGN KEY ("write_off_act_id") REFERENCES "write_off_act"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "write_off_act_item" ADD CONSTRAINT "write_off_act_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
