import { Module } from '@nestjs/common';
import { PostingService } from './posting.service';
import { PostingController } from './posting.controller';
import { BitrixModule } from '../integrations/bitrix/bitrix.module';
@Module({
  imports: [BitrixModule],
  controllers: [PostingController],
  providers: [PostingService],
  exports: [PostingService],
})
export class PostingModule {}
