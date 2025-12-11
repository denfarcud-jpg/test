-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
