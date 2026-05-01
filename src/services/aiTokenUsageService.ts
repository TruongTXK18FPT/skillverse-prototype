import axiosInstance from "./axiosInstance";

export interface AiTokenUsageSummary {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  estimatedTokens: number;
  requestCount: number;
  successCount: number;
  failedCount: number;
  averageLatencyMs: number;
  topFlowType: string;
  topFlowTypeTokens: number;
  topProviderType: string;
  topProviderTypeTokens: number;
  from: string;
  to: string;
}

export interface AiTokenUsageTimeSeriesPoint {
  timestamp: string;
  flowType: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requestCount: number;
  failedCount: number;
}

export interface AiTokenUsageBreakdownItem {
  key: string;
  label: string;
  totalTokens: number;
  requestCount: number;
  percentage: number;
}

export interface AiTokenUsageBreakdown {
  byFlowType: AiTokenUsageBreakdownItem[];
  byProviderType: AiTokenUsageBreakdownItem[];
  byModel: AiTokenUsageBreakdownItem[];
  byStatus: AiTokenUsageBreakdownItem[];
}

export interface AiTokenUsageLog {
  id: number;
  createdAt: string;
  flowType: string;
  providerType: string;
  modelName: string | null;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimated: boolean;
  status: "SUCCESS" | "FAILED";
  latencyMs: number | null;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
}

export interface AiTokenUsageLogsResponse {
  content: AiTokenUsageLog[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export type AiFlowType =
  | "AI_GRADING"
  | "CHATBOT"
  | "MEOWL_CHAT"
  | "ROADMAP_GENERATION"
  | "ROADMAP_VALIDATION"
  | "STUDY_PLAN"
  | "LEARNING_REPORT"
  | "CV_GENERATION"
  | "PORTFOLIO_AI"
  | "QUESTION_GENERATION"
  | "OTHER";

export type AiProviderType = "LOCAL_AI" | "GEMINI" | "MISTRAL" | "OPENAI_COMPATIBLE" | "UNKNOWN";

export interface AiTokenUsageQueryParams {
  from?: string;
  to?: string;
  flowType?: AiFlowType;
  providerType?: AiProviderType;
  status?: "SUCCESS" | "FAILED";
  modelName?: string;
  page?: number;
  size?: number;
}

const BASE_URL = "/api/admin/ai-token-usage";

export const getAiTokenUsageSummary = async (
  params?: AiTokenUsageQueryParams
): Promise<AiTokenUsageSummary> => {
  const response = await axiosInstance.get<AiTokenUsageSummary>(`${BASE_URL}/summary`, {
    params,
  });
  return response.data;
};

export const getAiTokenUsageTimeSeries = async (
  params?: AiTokenUsageQueryParams
): Promise<AiTokenUsageTimeSeriesPoint[]> => {
  const response = await axiosInstance.get<AiTokenUsageTimeSeriesPoint[]>(`${BASE_URL}/timeseries`, {
    params,
  });
  return response.data;
};

export const getAiTokenUsageBreakdown = async (
  params?: AiTokenUsageQueryParams
): Promise<AiTokenUsageBreakdown> => {
  const response = await axiosInstance.get<AiTokenUsageBreakdown>(`${BASE_URL}/breakdown`, {
    params,
  });
  return response.data;
};

export const getAiTokenUsageLogs = async (
  params?: AiTokenUsageQueryParams
): Promise<AiTokenUsageLogsResponse> => {
  const response = await axiosInstance.get<AiTokenUsageLogsResponse>(`${BASE_URL}/logs`, {
    params,
  });
  return response.data;
};

// Helper to format date as local ISO string (YYYY-MM-DDTHH:mm:ss)
const toLocalISOString = (date: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

// Helper to get default date range (last 7 days)
export const getDefaultDateRange = () => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);
  return {
    from: toLocalISOString(from),
    to: toLocalISOString(to),
  };
};

// Helper to get preset date ranges
export const getPresetDateRanges = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return {
    today: {
      from: toLocalISOString(today),
      to: toLocalISOString(now),
    },
    last7Days: {
      from: toLocalISOString(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)),
      to: toLocalISOString(now),
    },
    last30Days: {
      from: toLocalISOString(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)),
      to: toLocalISOString(now),
    },
  };
};

// Format token count for display
export const formatTokenCount = (count: number): string => {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toLocaleString();
};

// Format flow type for display
export const formatFlowType = (flowType: string): string => {
  const labels: Record<string, string> = {
    AI_GRADING: "Chấm điểm AI",
    CHATBOT: "Chatbot",
    MEOWL_CHAT: "Meowl Chat",
    ROADMAP_GENERATION: "Tạo lộ trình",
    ROADMAP_VALIDATION: "Xác thực lộ trình",
    STUDY_PLAN: "Kế hoạch học tập",
    LEARNING_REPORT: "Báo cáo học tập",
    CV_GENERATION: "Tạo CV",
    PORTFOLIO_AI: "Portfolio AI",
    QUESTION_GENERATION: "Tạo câu hỏi",
    OTHER: "Khác",
  };
  return labels[flowType] || flowType;
};

// Format provider type for display
export const formatProviderType = (providerType: string): string => {
  const labels: Record<string, string> = {
    LOCAL_AI: "Local AI",
    GEMINI: "Gemini",
    MISTRAL: "Mistral",
    OPENAI_COMPATIBLE: "OpenAI Compatible",
    UNKNOWN: "Không xác định",
  };
  return labels[providerType] || providerType;
};
