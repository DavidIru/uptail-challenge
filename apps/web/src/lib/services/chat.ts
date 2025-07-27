import type { ChatRequest, ChatResponse, ChatListItem, ChatDetails } from '$lib/types';

const API_BASE_URL = 'http://localhost:3001';

export class ChatService {
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      // Only include chatId in the request if it exists
      const payload: any = {
        message: request.message
      };
      
      if (request.chatId) {
        payload.chatId = request.chatId;
      }
      
      const response = await fetch(`${API_BASE_URL}/agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Could not send message. Please try again.');
    }
  }

  async getChats(): Promise<ChatListItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Convert timestamp strings to Date objects
      return data.map((chat: any) => ({
        ...chat,
        timestamp: new Date(chat.timestamp)
      }));
    } catch (error) {
      console.error('Error getting chats:', error);
      throw new Error('Could not load chat history. Please try again.');
    }
  }

  async getChatById(chatId: string): Promise<ChatDetails> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Chat not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Convert timestamp strings to Date objects
      return {
        ...data,
        messages: data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
      };
    } catch (error) {
      console.error('Error getting chat by ID:', error);
      throw new Error('Could not load chat details. Please try again.');
    }
  }
}

export const chatService = new ChatService(); 