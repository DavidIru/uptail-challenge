import { Injectable } from '@nestjs/common';
import { ChatRequest, ChatResponse } from './agent.types';
import { ChatService } from 'src/chat/chat.service';
import { Chat, ChatMessage, Facts } from 'src/chat/chat.types';
import { GuidelinesService } from 'src/guidelines/guidelines.service';
import { OpenaiService } from 'src/openai/openai.service';
import { ToolsService } from 'src/tools/tools.service';

@Injectable()
export class AgentService {
  constructor(
    private readonly chatService: ChatService,
    private readonly guidelinesService: GuidelinesService,
    private readonly openaiService: OpenaiService,
    private readonly toolsService: ToolsService,
  ) {}

  async chat({ chatId: previousChatId, message }: ChatRequest): Promise<ChatResponse> {
    const chat = await this.chatService.getChat(previousChatId);
    const chatId = chat.id;

    const facts: Facts = {
      ...chat.facts,
      lastUserMsg: message,
    };

    const extractedInformation = await this.extractInformationFromMessage({ message, facts });
    if (extractedInformation) {
      facts.informationRetrieved = {
        ...facts.informationRetrieved,
        ...extractedInformation,
      };
    }

    const activeGuidelines = await this.guidelinesService.selectGuidelines({
      facts,
    });

    const systemPrompt = await this.buildSystemPrompt({
      chat,
    });

    if (facts.waitingFor) {
      const userResponse = await this.processUserResponse({ message, facts });

      if (!facts.informationRetrieved) {
        facts.informationRetrieved = {};
      }

      facts.informationRetrieved[facts.waitingFor] = userResponse;
      facts.waitingFor = undefined;
      facts.lastSystemQuestion = undefined;
    }

    const plan = await this.guidelinesService.runGuidelines(
      activeGuidelines,
      facts,
      await this.toolsService.getToolsMap(facts),
    );

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
    };

    await this.chatService.saveMessage(chatId, userMessage);

    const systemMessages: ChatMessage[] = plan.replies.map((r) => ({ role: 'system', content: r }));

    if (plan.tools && plan.tools.length > 0) {
      const successfulTools = plan.tools.filter((t) => t.ok && t.result);

      for (const tool of successfulTools) {
        systemMessages.push({
          role: 'system',
          content: `Tool: ${tool.name}\nResult: ${JSON.stringify(tool.result)}`,
        });
      }
    }

    const response = await this.openaiService.evaluate(
      [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...systemMessages,
        userMessage,
      ],
      {
        tools: await this.toolsService.getTools(),
        toolsExecutor: async (name, args) => {
          const result = await this.toolsService.execute({
            name,
            args,
            facts,
          });
          return result;
        },
      },
    );

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: response,
    };
    await this.chatService.saveMessage(chatId, assistantMessage);

    await this.chatService.updateFacts({
      chatId,
      facts,
      update: {
        lastUserMsg: message,
      },
      activeGuidelines,
    });

    await this.chatService.updateChatSummary({
      chatId,
      prevSummary: chat.summary ?? '',
      lastUserMessage: message,
      lastAssistantMessage: response,
    });

    return {
      chatId: chat.id,
      reply: response,
      activeGuidelines: activeGuidelines.map(g => ({
        id: g.id,
        title: g.title,
        priority: g.priority,
        condition: g.condition,
        action: g.action
      })),
      facts: facts
    };
  }

  private async buildSystemPrompt({ chat }: { chat: Chat }) {
    const { summary, messages } = chat;

    const SYSTEM_PROMPT = `You are a healthcare assistant who helps people find the right professional for their problem.\n
Your main goal is to recommend at least one professional to each person you interact with. You will ask for all the necessary information to be able to make appropriate recommendations.\n
You only offer professional recommendations, no other products.\n
Do not reveal that you are an AI model. Never mention OpenAI. Maintain a warm and encouraging tone throughout the conversation.\n
Be brief, accurate and use the available tools if you need it.\n
Always respond in the message's language.\n
Tags to classify the user's problem:\n
- Coaching:\n
- Psychology\n
- Nutrition\n
- Other\n

Examples:\n

Message: I want to improve my leadership skills.\n
Tag: Coaching\n

Message: I don't feel like going to work.\n
Tag: Psychology\n

Message: I need help losing weight.\n
Tag: Nutrition\n

If you are unsure, classify it as "other" and continue searching for more information to classify it correctly.\n

You have tools and you are able to use them as you need.\n\n
You will always follow the behavioral guidelines provided below:\n\n`;

    let prompt = `${SYSTEM_PROMPT}\n\n`;

    if (summary) {
      prompt += `\nPrevious summary: ${summary}`;
    }

    if (messages.length > 0) {
      prompt += `\nLatest messages: ${messages.map((m) => `${m.role}: ${m.content}`).join('\n')}`;
    }

    // prompt += `\n${rules}`;

    return prompt;
  }

  private async processUserResponse({ message, facts }: { message: string; facts: Facts }): Promise<string> {
    const extractionPrompt = `Extract the user's response for the question "${facts.lastSystemQuestion}" about "${facts.waitingFor}".\n
User message: "${message}"\n

Instructions:\n
- If asking about professional type, extract one of: psychology, coaching, nutrition, other\n
- If asking about location, extract the city name\n
- If asking about preferences, extract the specific preference\n
- Return ONLY the extracted value, nothing else\n
- If unclear, return "other"\n

Response:`;

    const response = await this.openaiService.evaluate([
      {
        role: 'user',
        content: extractionPrompt,
      },
    ]);

    return response.trim().toLowerCase();
  }

  private async extractInformationFromMessage({
    message,
    facts,
  }: {
    message: string;
    facts: Facts;
  }): Promise<Record<string, string> | null> {
    const extractionPrompt = `Analyze this user message and extract any obvious information about their professional needs.\n

    Current facts information: ${JSON.stringify(facts.informationRetrieved)}\n

User message: "${message}"\n

Extract information for these fields if clearly mentioned:\n
- professionalType: psychology, coaching, nutrition, other (other is the less specific option)\n
- location: city name if mentioned\n
- budget: if mentioned\n
- sessionType: online, offline, either\n

Rules:\n
- Only extract if CLEARLY stated or strongly implied\n
- For professional type, use these keywords:\n
* psychology: depression, anxiety, stress, mental health, therapy, psychologist\n
* nutrition: diet, weight, eating, food, nutritionist, dietitian\n
* coaching: leadership, goals, career, performance, coach\n
- Return JSON format or "null" if nothing obvious\n
- Be conservative - if unsure, don't extract\n
- If there is information in the current facts, evaluate if the new information makes more sense than the current information\n

Response:`;

    const response = await this.openaiService.evaluate(
      [
        {
          role: 'user',
          content: extractionPrompt,
        },
      ],
      { responseFormat: { type: 'json_object' } },
    );

    try {
      const extracted = JSON.parse(response);

      const filteredExtracted = Object.fromEntries(
        Object.entries(extracted).filter(([_, value]) => value !== null),
      ) as Record<string, string>;

      return Object.keys(filteredExtracted).length > 0 ? filteredExtracted : null;
    } catch {
      return null;
    }
  }
}
