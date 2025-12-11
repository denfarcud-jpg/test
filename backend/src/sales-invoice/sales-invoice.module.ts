import { Module } from '@nestjs/common';
import { SalesInvoiceService } from './sales-invoice.service';
import { SalesInvoiceController } from './sales-invoice.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BitrixModule } from '../integrations/bitrix/bitrix.module';

@Module({
  imports: [PrismaModule, BitrixModule],
  controllers: [SalesInvoiceController],
  providers: [SalesInvoiceService],
})
export class SalesInvoiceModule {}
