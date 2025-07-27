import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { ChatCompletionTool } from 'openai/resources/chat/completions';

@Injectable()
export class OpenaiService {
  private readonly openai: OpenAI;
  private readonly CHAT_MODEL: string = 'qwen2.5:7b-instruct';
  private readonly EMBED_MODEL: string = 'bge-m3';

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      baseURL: this.configService.get('OPENAI_BASE_URL'),
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  async evaluate(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      tools?: ChatCompletionTool[];
      toolsExecutor?: (name: string, args: any) => Promise<any>;
      responseFormat?: { type: 'text' | 'json_object' };
    },
  ): Promise<string> {
    const { temperature = 0, maxTokens = 300, tools, responseFormat } = options ?? {};

    const msgs: OpenAI.Chat.ChatCompletionMessageParam[] = [...messages];

    while (true) {
      const resp = await this.openai.chat.completions.create({
        model: this.CHAT_MODEL,
        messages: msgs,
        max_tokens: maxTokens,
        temperature,
        ...(tools && { tools, tool_choice: 'auto' as const }),
        ...(responseFormat && { response_format: tools ? { type: 'text' } : responseFormat }),
      });

      const choice = resp.choices[0];
      const msg = choice.message;
      const toolCalls = msg.tool_calls ?? [];

      if (!toolCalls.length) {
        return (msg.content ?? '').trim();
      }
      msgs.push(msg as any);

      for (const c of toolCalls) {
        const args = this.safeParse(c.function.arguments);
        let result: any;
        try {
          result = await options.toolsExecutor(c.function.name, args);
        } catch (e: any) {
          result = { error: String(e?.message ?? e), args };
        }

        msgs.push({
          role: 'tool',
          tool_call_id: c.id,
          name: c.function.name,
          content: JSON.stringify(result),
        } as OpenAI.Chat.ChatCompletionMessageParam);
      }
    }
  }

  private safeParse<T = any>(s?: string): T {
    try {
      return JSON.parse(s ?? '{}') as T;
    } catch {
      return {} as T;
    }
  }

  async embed(text: string): Promise<number[]> {
    const res = await fetch('http://localhost:11434/api/embed', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: this.EMBED_MODEL,
        input: text,
      }),
    });
    const data = await res.json();

    return data.embeddings[0];
  }
}
