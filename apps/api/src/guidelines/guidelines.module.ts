import { Module } from '@nestjs/common';
import { GuidelinesController } from './guidelines.controller';
import { GuidelinesService } from './guidelines.service';
import { DbModule } from 'src/db/db.module';
import { OpenaiModule } from 'src/openai/openai.module';

@Module({
  imports: [DbModule, OpenaiModule],
  controllers: [GuidelinesController],
  providers: [GuidelinesService],
  exports: [GuidelinesService],
})
export class GuidelinesModule {}
