export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  chatId: string;
  reply: string;
  activeGuidelines: {
    id: string;
    title: string;
    priority: number;
    condition: any;
    action: any;
  }[];
  facts: any;
}

export interface ChatRequest {
  message: string;
  chatId?: string;
}

export interface Professional {
  id: string;
  name: string;
  surname: string;
  sessionPrice: number;
  sessionDuration: number;
  location: string;
  online: boolean;
  description: string;
  rating: number;
  reviews: number;
  specialties: string[];
  languages: string[];
}

export interface ChatListItem {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  preview: string;
}

export interface ChatDetails {
  id: string;
  summary?: string;
  facts?: any;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
} 