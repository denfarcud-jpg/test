import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BitrixModule } from '../integrations/bitrix/bitrix.module';


@Module({
  imports: [
    PrismaModule,
    BitrixModule,
  ],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
