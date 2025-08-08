import { AvailableAction } from './types';
import { 
  optimizeBettingSplit,
  parseActionCalls,
  generateSystemPrompt 
} from './functions';

// Centralized registry of all available actions
export const availableActions: Record<string, AvailableAction> = {
  optimizeBettingSplit,
  // Add new actions here as you create them:
  // newAction1,
  // newAction2,
  // etc.
};

// Re-export utility functions for backwards compatibility
export { parseActionCalls, generateSystemPrompt }; 