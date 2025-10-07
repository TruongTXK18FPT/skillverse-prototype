/**
 * TypeScript type definitions for AI Career Counseling Chatbot
 */

export interface ChatMessage {
  id: number;
  sessionId: number;
  userMessage: string;
  aiResponse: string;
  createdAt: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: number | null;
}

export interface ChatResponse {
  sessionId: number;
  message: string;
  aiResponse: string;
  timestamp: string;
}

export interface ChatSession {
  sessionId: number;
  lastMessageTime: string;
  messageCount: number;
}

// UI-specific message type for rendering
export interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
