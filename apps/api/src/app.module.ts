import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentModule } from './agent/agent.module';
import { DbModule } from './db/db.module';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './chat/chat.module';
import { OpenaiModule } from './openai/openai.module';
import { GuidelinesModule } from './guidelines/guidelines.module';
import { ProductsModule } from './products/products.module';
import { ToolsModule } from './tools/tools.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    AgentModule,
    ChatModule,
    OpenaiModule,
    GuidelinesModule,
    ProductsModule,
    ToolsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
