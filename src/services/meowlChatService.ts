import axiosInstance from "./axiosInstance";

// Types
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type MeowlRoleMode = "LEARNER" | "MENTOR" | "RECRUITER" | "GENERAL";

export interface MeowlChatRequest {
  message: string;
  language: "vi" | "en";
  userId?: number | null;
  activeRole?: MeowlRoleMode | null;
  sessionId?: string;
  includeReminders?: boolean;
  chatHistory?: ChatMessage[];
}

export interface MeowlChatResponse {
  message: string;
  originalMessage?: string;
  success: boolean;
  timestamp?: string;
  reminders?: MeowlReminder[];
  notifications?: MeowlNotification[];
  mood?: string;
  activeRole?: MeowlRoleMode;
  nextBestAction?: string;
  actionType?: "NAVIGATE" | "LINK" | "NONE";
  actionUrl?: string;
  actionLabel?: string;
}

export interface MeowlQuickAction {
  id: string;
  label: string;
  description: string;
  actionType: "NAVIGATE" | "PROMPT";
  actionValue: string;
}

export interface MeowlOnboardingContextResponse {
  success: boolean;
  language: "vi" | "en";
  activeRole: MeowlRoleMode;
  availableRoles: MeowlRoleMode[];
  roleSwitchEnabled: boolean;
  onboardingSeen: boolean;
  onboardingSeenAt?: string;
  welcomeMessage: string;
  nextBestAction: string;
  whatYouCanDo: string[];
  quickActions: MeowlQuickAction[];
  suggestedPrompts: string[];
  contextSummary: Record<string, string>;
}

export interface MeowlReminder {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
}

export interface MeowlNotification {
  id: string;
  title: string;
  message: string;
  type: string;
}

export const MEOWL_CHAT_PERSISTENCE_PREFIX = "meowl_chat_state:";

export const getMeowlChatPersistenceKey = (userId: number): string =>
  `${MEOWL_CHAT_PERSISTENCE_PREFIX}${userId}`;

export const clearPersistedMeowlChatState = (
  storage: Storage = localStorage,
): void => {
  const keysToRemove: string[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(MEOWL_CHAT_PERSISTENCE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => storage.removeItem(key));
};

// Guest session management
const GUEST_SESSION_KEY = "meowl_guest_session";
const GUEST_MESSAGE_LIMIT = 5;
const SESSION_EXPIRY_MS = 3600000; // 1 hour

export interface GuestSession {
  messageCount: number;
  sessionId: string;
  createdAt: number;
}

class MeowlChatService {
  // Get or create guest session
  getGuestSession(): GuestSession | null {
    try {
      const stored = sessionStorage.getItem(GUEST_SESSION_KEY);
      if (!stored) return null;

      const session = JSON.parse(stored) as GuestSession;

      // Check if session is expired
      if (Date.now() - session.createdAt >= SESSION_EXPIRY_MS) {
        this.clearGuestSession();
        return null;
      }

      return session;
    } catch {
      return null;
    }
  }

  // Create new guest session
  createGuestSession(): GuestSession {
    const newSession: GuestSession = {
      messageCount: 0,
      sessionId: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    };
    sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(newSession));
    return newSession;
  }

  // Increment guest message count
  incrementGuestMessageCount(): GuestSession | null {
    const session = this.getGuestSession();
    if (!session) return null;

    const updated: GuestSession = {
      ...session,
      messageCount: session.messageCount + 1,
    };
    sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(updated));
    return updated;
  }

  // Check if guest can send message
  canGuestSendMessage(): boolean {
    const session = this.getGuestSession();
    if (!session) return true; // Will create new session

    return session.messageCount < GUEST_MESSAGE_LIMIT;
  }

  // Get remaining messages for guest
  getGuestRemainingMessages(): number {
    const session = this.getGuestSession();
    if (!session) return GUEST_MESSAGE_LIMIT;

    return Math.max(0, GUEST_MESSAGE_LIMIT - session.messageCount);
  }

  // Clear guest session
  clearGuestSession(): void {
    sessionStorage.removeItem(GUEST_SESSION_KEY);
  }

  // Send chat message
  async sendMessage(request: MeowlChatRequest): Promise<MeowlChatResponse> {
    try {
      const response = await axiosInstance.post<MeowlChatResponse>(
        "/v1/meowl/chat",
        request,
      );
      return response.data;
    } catch (error: any) {
      console.error("Meowl chat error:", error);

      const isVietnamese = request.language === "vi";
      const errorMessage = isVietnamese
        ? "Meo ơi! 🐱 Mình đang gặp chút trục trặc. Thử lại sau nhé! ✨"
        : "Meow! 🐱 I'm having a little trouble right now. Please try again! ✨";

      return {
        message: errorMessage,
        success: false,
        mood: "apologetic",
      };
    }
  }

  // Get chat history for logged-in user
  async getChatHistory(userId: number): Promise<ChatMessage[]> {
    try {
      const response = await axiosInstance.get<ChatMessage[]>(
        `/v1/meowl/history/${userId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get chat history:", error);
      return [];
    }
  }

  // Clear chat history for logged-in user
  async clearChatHistory(userId: number): Promise<boolean> {
    try {
      await axiosInstance.delete(`/v1/meowl/history/${userId}`);
      return true;
    } catch (error) {
      console.error("Failed to clear chat history:", error);
      return false;
    }
  }

  // Get reminders
  async getReminders(
    userId: number,
    language: string = "en",
  ): Promise<MeowlReminder[]> {
    try {
      const response = await axiosInstance.get<MeowlReminder[]>(
        `/v1/meowl/reminders/${userId}?language=${language}`,
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get reminders:", error);
      return [];
    }
  }

  // Get notifications
  async getNotifications(
    userId: number,
    language: string = "en",
  ): Promise<MeowlNotification[]> {
    try {
      const response = await axiosInstance.get<MeowlNotification[]>(
        `/v1/meowl/notifications/${userId}?language=${language}`,
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get notifications:", error);
      return [];
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axiosInstance.get("/v1/meowl/health");
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async getOnboardingContext(
    userId: number,
    language: "vi" | "en",
    activeRole?: MeowlRoleMode | null,
  ): Promise<MeowlOnboardingContextResponse | null> {
    try {
      const roleQuery = activeRole ? `&activeRole=${activeRole}` : "";
      const response = await axiosInstance.get<MeowlOnboardingContextResponse>(
        `/v1/meowl/onboarding/${userId}?language=${language}${roleQuery}`,
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get Meowl onboarding context:", error);
      return null;
    }
  }

  async markOnboardingSeen(
    userId: number,
    activeRole?: MeowlRoleMode | null,
  ): Promise<boolean> {
    try {
      const roleQuery = activeRole ? `?activeRole=${activeRole}` : "";
      await axiosInstance.post(`/v1/meowl/onboarding/${userId}/seen${roleQuery}`);
      return true;
    } catch (error) {
      console.error("Failed to mark onboarding seen:", error);
      return false;
    }
  }
}

// Export singleton instance
const meowlChatService = new MeowlChatService();
export default meowlChatService;
