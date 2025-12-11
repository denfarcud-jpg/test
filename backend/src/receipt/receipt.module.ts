import { Module } from '@nestjs/common';
import { ReceiptService } from './receipt.service';
import { ReceiptController } from './receipt.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BitrixModule } from "../integrations/bitrix/bitrix.module";

@Module({
  controllers: [ReceiptController],
  providers: [ReceiptService],
  imports: [BitrixModule, PrismaModule]
})
export class ReceiptModule {}
