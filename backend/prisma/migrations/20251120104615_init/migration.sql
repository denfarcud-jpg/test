-- CreateTable
CREATE TABLE "store" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" SERIAL NOT NULL,
    "catalogId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog" (
    "id" SERIAL NOT NULL,
    "name" TEXT,

    CONSTRAINT "catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt" (
    "id" SERIAL NOT NULL,
    "date_receipt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "num_receipt" TEXT NOT NULL,
    "partner_id" INTEGER NOT NULL,
    "date_conducted" TIMESTAMP(3),
    "store_id" INTEGER NOT NULL,
    "total_sum" DECIMAL(15,2) NOT NULL,
    "responsible" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_item" (
    "id" SERIAL NOT NULL,
    "receipt_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "count_product" DECIMAL(10,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "price_product" DECIMAL(15,2) NOT NULL,
    "count_location" INTEGER NOT NULL,

    CONSTRAINT "receipt_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_invoice" (
    "id" SERIAL NOT NULL,
    "date_shipment" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "num_shipment" TEXT,
    "partner_id" INTEGER NOT NULL,
    "date_conducted" TIMESTAMP(3),
    "store_id" INTEGER NOT NULL,
    "total_sum" DECIMAL(15,2) NOT NULL,
    "deal_id" INTEGER NOT NULL,
    "responsible" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "sales_invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_invoice_item" (
    "id" SERIAL NOT NULL,
    "sales_invoice_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "count_product" DECIMAL(10,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "price_product" DECIMAL(15,2) NOT NULL,
    "count_location" TEXT NOT NULL,

    CONSTRAINT "sales_invoice_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posting" (
    "id" SERIAL NOT NULL,
    "date_posting" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "num_posting" TEXT NOT NULL,
    "date_cancellation" TIMESTAMP(3),
    "store_id" INTEGER NOT NULL,
    "total_sum" DECIMAL(15,2) NOT NULL,
    "deal_id" INTEGER NOT NULL,
    "responsible" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "posting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posting_item" (
    "id" SERIAL NOT NULL,
    "posting_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "count_product" DECIMAL(10,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "price_product" DECIMAL(15,2) NOT NULL,
    "count_location" INTEGER NOT NULL,

    CONSTRAINT "posting_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "write_off_act" (
    "id" SERIAL NOT NULL,
    "date_cancellation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "num_cancellation" TEXT NOT NULL,
    "date_conducted" TIMESTAMP(3),
    "store_id" INTEGER NOT NULL,
    "total_sum" DECIMAL(15,2) NOT NULL,
    "deal_id" INTEGER NOT NULL,
    "responsible" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "write_off_act_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "write_off_act_item" (
    "id" SERIAL NOT NULL,
    "write_off_act_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "count_product" DECIMAL(10,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "price_product" DECIMAL(15,2) NOT NULL,
    "count_location" INTEGER NOT NULL,

    CONSTRAINT "write_off_act_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "store_id" INTEGER NOT NULL,
    "deal_id" INTEGER NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_name_key" ON "product"("name");

-- AddForeignKey
ALTER TABLE "receipt" ADD CONSTRAINT "receipt_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt" ADD CONSTRAINT "receipt_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_item" ADD CONSTRAINT "receipt_item_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_item" ADD CONSTRAINT "receipt_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoice" ADD CONSTRAINT "sales_invoice_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoice" ADD CONSTRAINT "sales_invoice_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoice_item" ADD CONSTRAINT "sales_invoice_item_sales_invoice_id_fkey" FOREIGN KEY ("sales_invoice_id") REFERENCES "sales_invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoice_item" ADD CONSTRAINT "sales_invoice_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posting" ADD CONSTRAINT "posting_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posting_item" ADD CONSTRAINT "posting_item_posting_id_fkey" FOREIGN KEY ("posting_id") REFERENCES "posting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posting_item" ADD CONSTRAINT "posting_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "write_off_act" ADD CONSTRAINT "write_off_act_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "write_off_act_item" ADD CONSTRAINT "write_off_act_item_write_off_act_id_fkey" FOREIGN KEY ("write_off_act_id") REFERENCES "write_off_act"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "write_off_act_item" ADD CONSTRAINT "write_off_act_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
