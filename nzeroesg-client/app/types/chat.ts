export interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  isError?: boolean
  metadata?: {
    confidence?: number
    sources?: string
    processingTime?: number
  }
  interactive?: InteractiveMessage
}

export interface InteractiveMessage {
  type: "quick_replies" | "action_buttons" | "card_carousel" | "data_visualization"
  title?: string
  options?: InteractiveOption[]
  cards?: InteractiveCard[]
  actions?: InteractiveAction[]
}

export interface InteractiveOption {
  id: string
  label: string
  value?: string
  style?: "primary" | "secondary"
}

export interface InteractiveCard {
  id: string
  title: string
  description: string
  action?: string
  metrics?: Record<string, string | number>
}

export interface InteractiveAction {
  id: string
  label: string
  value?: string
}


export interface ChatResponse {
  content: string
  metadata?: {
    confidence: number
    sources: string
    processingTime: number
  }
  interactive?: InteractiveMessage
}

export interface ApiError {
  message: string
  code?: string
  details?: any
}
