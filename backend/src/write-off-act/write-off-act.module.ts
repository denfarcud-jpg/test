import { Module } from '@nestjs/common';
import { WriteOffActService } from './write-off-act.service';
import { WriteOffActController } from './write-off-act.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WriteOffActController],
  providers: [WriteOffActService],
})
export class WriteOffActModule {}
