import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { StoreModule } from './store/store.module';
import { ReceiptModule } from './receipt/receipt.module';
import { SalesInvoiceModule } from './sales-invoice/sales-invoice.module';
import { PostingModule } from './posting/posting.module';
import { WriteOffActModule } from './write-off-act/write-off-act.module';
import { ReservationModule } from './reservation/reservation.module';
import { ReportModule } from './report/report.module';
import { BitrixModule } from './integrations/bitrix/bitrix.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';



@Module({

  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), '../frontend/dist'),
      serveRoot: '/',
      serveStaticOptions: {
        setHeaders: (res) => {
          const allowed = "frame-ancestors 'self' https://*.bitrix24.ru https://*.bitrix24.com https://*.ngrok-free.dev";
          res.setHeader('Content-Security-Policy', allowed);
          res.removeHeader('X-Frame-Options');
        }
      }
    }),
      PrismaModule, StoreModule, ReceiptModule, SalesInvoiceModule, PostingModule, WriteOffActModule, ReservationModule, ReportModule, BitrixModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
