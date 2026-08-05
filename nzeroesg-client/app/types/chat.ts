export interface Message {
  id: string;
  content: string;
  role: "user" | "agent";
  timestamp: Date;
  isError?: boolean;
  metadata?: {
    processingTime?: number;
  };
}

export interface ChatResponse {
  reply: string;
  processing_time_ms: number;
}

export interface ApiError {
  detail?: string;
}
