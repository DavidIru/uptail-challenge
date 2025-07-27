import { Injectable } from '@nestjs/common';
import { ChatCompletionTool } from 'openai/resources/index';
import { Facts } from 'src/chat/chat.types';
import { ProfessionalsService } from 'src/professionals/professionals.service';

@Injectable()
export class ToolsService {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  async getTools(): Promise<ChatCompletionTool[]> {
    return [
      {
        type: 'function',
        function: {
          name: 'getProfessional',
          description: 'Get professionals by their name or specialization.',
          parameters: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Professional name or specialization',
              },
            },
            required: ['name'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'bookProfessional',
          description: 'Book a session with a specific professional',
          parameters: {
            type: 'object',
            properties: {
              professionalId: {
                type: 'string',
                description: 'ID of the professional to book',
              },
              message: {
                type: 'string',
                description: 'Additional message or requirements (optional)',
              },
            },
            required: ['professionalId'],
          },
        },
      },
    ];
  }

  async getToolsMap(facts: Facts): Promise<Record<string, (args?: Record<string, any>) => Promise<any>>> {
    return {
      getProfessional: async (args) => {
        return this.execute({ name: 'getProfessional', args, facts });
      },
      bookProfessional: async (args) => {
        return this.execute({ name: 'bookProfessional', args, facts });
      },
    };
  }

  async execute({ name, args, facts }: { name: string; args: Record<string, any>; facts: Facts }) {
    switch (name) {
      case 'getProfessional':
        return this.professionalsService.getProfessional({ ...args, facts });

      case 'bookProfessional':
        return this.professionalsService.bookProfessional({ ...args, facts });

      default:
        throw new Error(`tool_not_found:${name}`);
    }
  }
}
