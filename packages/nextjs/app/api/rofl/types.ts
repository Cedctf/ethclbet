export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ApiRequest {
  messages: Message[];
  options?: {
    model?: string; // Red Pill model name (e.g., "phala/deepseek-r1-70b")
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    executeActions?: boolean; // Enable action execution
  };
}

// Action execution types
export interface ActionCall {
  name: string;
  parameters: Record<string, any>;
  description?: string;
}

export interface ActionResult {
  actionName: string;
  success: boolean;
  result?: any;
  error?: string;
  executionTime?: number;
}

export interface ApiResponse {
  message: Message;
  actions?: ActionCall[];
  actionResults?: ActionResult[];
  executedActions?: boolean;
}

// Available actions that can be executed
export interface AvailableAction {
  name: string;
  description: string;
  parameters: {
    [key: string]: {
      type: string;
      description: string;
      required?: boolean;
    };
  };
  handler: (params: Record<string, any>) => Promise<any>;
}

// Red Pill API specific types (for internal use)
export interface RedPillRequest {
  messages: Message[];
  model: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface RedPillChoice {
  message: Message;
  finish_reason?: string;
  index?: number;
}

export interface RedPillResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices: RedPillChoice[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
} 