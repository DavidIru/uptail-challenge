import { Body, Controller, Get, Post } from '@nestjs/common';
import { AgentService } from './agent.service';
import { ChatRequest, ChatResponse } from './agent.types';

@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post()
  async chat(@Body() body: ChatRequest): Promise<ChatResponse> {
    return this.agentService.chat(body);
  }
}
