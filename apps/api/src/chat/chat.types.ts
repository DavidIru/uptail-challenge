export type ChatRequest = {
  message: string;
  chatId?: string;
};

export type ChatResponse = {
  chatId: string;
  reply: string;
};

export type Chat = {
  id: string;
  messages: ChatMessage[];
  facts: Facts;
  summary?: string;
};

export type ChatMessage = {
  role: ChatMessageRole;
  content: string;
};

type ChatMessageRole = 'user' | 'assistant' | 'system';

export type Facts = {
  solutionPresented: boolean;
  informationRetrieved: Record<string, string>;
  lastUserMsg?: string;
  usedGuidelines: string[];
  waitingFor?: string;
  lastSystemQuestion?: string;
};
