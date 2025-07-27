import { Body, Controller, Get, Param } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  async getChats() {
    return this.chatService.getChats();
  }

  @Get(':id')
  async getChatById(@Param('id') id: string) {
    return this.chatService.getChatById(id);
  }
}
