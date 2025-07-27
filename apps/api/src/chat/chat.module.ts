import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { DbModule } from '../db/db.module';
import { OpenaiModule } from 'src/openai/openai.module';

@Module({
  imports: [DbModule, OpenaiModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
