import { Controller, Post } from '@nestjs/common';
import { GuidelinesService } from './guidelines.service';

@Controller('guidelines')
export class GuidelinesController {
  constructor(private readonly guidelinesService: GuidelinesService) {}

  @Post('calculate-embeddings')
  async calculateEmbeddings(): Promise<{ success: boolean }> {
    await this.guidelinesService.calculateEmbeddings();

    return {
      success: true,
    }
  }
}
