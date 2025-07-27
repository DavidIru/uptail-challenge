import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { Chat, ChatMessage, Facts } from './chat.types';
import { OpenaiService } from 'src/openai/openai.service';
import OpenAI from 'openai';
import { Guideline } from 'src/guidelines/guidelines.types';

@Injectable()
export class ChatService {
  private readonly defaultFacts: Facts = {
    solutionPresented: false,
    informationRetrieved: {},
    usedGuidelines: [],
  };

  constructor(private readonly dbService: DbService, private readonly openaiService: OpenaiService) {}

  async getChat(chatId?: string): Promise<Chat> {
    let chat: Chat;

    if (!chatId) {
      const { data, error } = await this.dbService.client
        .from('chats')
        .insert({ facts: this.defaultFacts })
        .select()
        .single();

      if (error) {
        throw error;
      }

      chat = {
        id: data.id,
        messages: [],
        facts: this.defaultFacts,
        summary: undefined,
      };
    } else {
      const [messages, chatData] = await Promise.all([
        this.dbService.client
          .from('chat_messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: false })
          .limit(6),
        this.dbService.client.from('chats').select('*').eq('id', chatId).single(),
      ]);

      if (messages.error || chatData.error) {
        throw messages.error || chatData.error;
      }

      chat = {
        id: chatId,
        messages: messages.data.reverse(),
        ...chatData.data,
      };
    }

    return chat;
  }

  async saveMessage(chatId: string, message: ChatMessage): Promise<boolean> {
    const { error } = await this.dbService.client.from('chat_messages').insert({
      chat_id: chatId,
      ...message,
    });

    if (error) {
      throw error;
    }

    return true;
  }

  async updateChatSummary({
    chatId,
    prevSummary,
    lastUserMessage,
    lastAssistantMessage,
  }: {
    chatId: string;
    prevSummary: string;
    lastUserMessage: string;
    lastAssistantMessage: string;
  }): Promise<boolean> {
    const summary = await this.summarize({
      prevSummary,
      lastUserMessage,
      lastAssistantMessage,
    });

    const { error } = await this.dbService.client.from('chats').update({ summary }).eq('id', chatId);

    if (error) {
      throw error;
    }

    return true;
  }

  private async summarize({
    prevSummary,
    lastUserMessage,
    lastAssistantMessage,
  }: {
    prevSummary: string;
    lastUserMessage: string;
    lastAssistantMessage: string;
  }): Promise<string> {
    const prompt = `Summarize the conversation in <= 2 sentences in English. Keep only stable facts, user's intent, product(s) of interest, and return status.\n
  Previous summary: "${prevSummary}"\n
  Latest exchange:\n
  user: "${lastUserMessage}"\n
  assistant: "${lastAssistantMessage}"\n
  Output ONLY the new summary:\n`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: 'user', content: prompt }];

    const newSummary = await this.openaiService.evaluate(messages);

    return newSummary;
  }

  async updateFacts({
    chatId,
    facts,
    update,
    activeGuidelines,
  }: {
    chatId: string;
    facts: Facts;
    update: Partial<Facts>;
    activeGuidelines: Guideline[];
  }): Promise<void> {
    const newFacts = {
      ...facts,
      ...update,
      usedGuidelines: [...new Set([...facts.usedGuidelines, ...activeGuidelines.map((g) => g.id)])],
    };

    const { error } = await this.dbService.client.from('chats').update({ facts: newFacts }).eq('id', chatId);

    if (error) {
      throw error;
    }
  }

  async getChats() {
    try {
      const { data: chats, error } = await this.dbService.client
        .from('chats')
        .select(
          `
          id,
          summary,
          updated_at,
          facts
        `,
        )
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      const chatsWithMessages = await Promise.all(
        chats.map(async (chat) => {
          const { data: lastMessage } = await this.dbService.client
            .from('chat_messages')
            .select('content, role, created_at')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          let title = 'New Conversation';
          let lastMessageContent = 'No messages yet';

          title = chat.summary;

          if (lastMessage) {
            lastMessageContent = lastMessage.content;
          }

          return {
            id: chat.id,
            title,
            lastMessage: lastMessageContent,
            timestamp: new Date(chat.updated_at),
          };
        }),
      );

      return chatsWithMessages;
    } catch (error) {
      console.error('Error getting chats:', error);
      throw error;
    }
  }

  async getChatById(chatId: string) {
    try {
      // Get the chat details
      const { data: chat, error: chatError } = await this.dbService.client
        .from('chats')
        .select(`
          summary,
          facts
        `)
        .eq('id', chatId)
        .single();

      if (chatError) {
        throw chatError;
      }

      if (!chat) {
        throw new Error('Chat not found');
      }

      // Get all messages for this chat
      const { data: messages, error: messagesError } = await this.dbService.client
        .from('chat_messages')
        .select('content, role, created_at')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        throw messagesError;
      }

      // Format messages for frontend
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at)
      }));

      return {
        id: chatId,
        facts: chat.facts,
        messages: formattedMessages,
      };
    } catch (error) {
      console.error('Error getting chat by ID:', error);
      throw error;
    }
  }
}
