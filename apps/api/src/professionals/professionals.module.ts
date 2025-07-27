import { Module } from '@nestjs/common';
import { ChatModule } from 'src/chat/chat.module';
import { DbModule } from 'src/db/db.module';
import { ProfessionalsService } from './professionals.service';

@Module({
  imports: [ChatModule, DbModule],
  providers: [ProfessionalsService],
  exports: [ProfessionalsService],
})
export class ProfessionalsModule {}
