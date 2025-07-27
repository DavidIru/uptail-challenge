import type { Facts } from "../chat/chat.types";

export type ChatRequest = {
  message: string;
  chatId?: string;
};

export type ChatResponse = {
  chatId: string;
  reply: string;
  activeGuidelines: {
    id: string;
    title: string;
    priority: number;
    condition: any;
    action: any;
  }[];
  facts: Facts;
};