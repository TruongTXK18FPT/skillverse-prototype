/**
 * Career Chat Types
 * Aligned with backend DTOs for AI Career Counseling
 */

export enum ChatMode {
  GENERAL_CAREER_ADVISOR = 'GENERAL_CAREER_ADVISOR',
  EXPERT_MODE = 'EXPERT_MODE'
}

export interface ExpertContext {
  domain: string;
  industry: string;
  jobRole: string;
  expertName: string;
  mediaUrl?: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: number;
  chatMode?: ChatMode;
  aiAgentMode?: 'NORMAL' | 'DEEP_RESEARCH' | 'deep-research-pro-preview-12-2025';
  domain?: string;
  industry?: string;
  jobRole?: string;
}

export interface ChatResponse {
  sessionId: number;
  message: string;
  aiResponse: string;
  timestamp: string;
  chatMode: ChatMode;
  expertContext?: ExpertContext;
}

export interface ChatSession {
  sessionId: number;
  title: string;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
  chatMode?: ChatMode;
}

export interface ChatMessageHistory {
  messageId: number;
  userMessage: string;
  aiResponse: string;
  createdAt: string;
}

// Expert Field Selection Types
export interface RoleInfo {
  jobRole: string;
  keywords: string;
  mediaUrl?: string;
  isActive: boolean;
}

export interface IndustryInfo {
  industry: string;
  roles: RoleInfo[];
}

export interface ExpertFieldResponse {
  domain: string;
  industries: IndustryInfo[];
}

// UI Message for display
export interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  expertContext?: ExpertContext;
  isStreaming?: boolean;
}
