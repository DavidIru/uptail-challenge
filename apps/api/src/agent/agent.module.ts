import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { ChatModule } from 'src/chat/chat.module';
import { GuidelinesModule } from 'src/guidelines/guidelines.module';
import { OpenaiModule } from 'src/openai/openai.module';
import { ToolsModule } from 'src/tools/tools.module';

@Module({
  imports: [ChatModule, GuidelinesModule, OpenaiModule, ToolsModule],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}
