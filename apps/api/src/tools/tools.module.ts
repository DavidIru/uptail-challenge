import { Module } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { ProfessionalsModule } from 'src/professionals/professionals.module';

@Module({
  imports: [ProfessionalsModule],
  providers: [ToolsService],
  exports: [ToolsService],
})
export class ToolsModule {}
