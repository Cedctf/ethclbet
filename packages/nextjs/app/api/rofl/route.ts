import { NextResponse } from 'next/server';
import { ApiRequest, ApiResponse, Message, ActionCall, ActionResult } from './types';
import { availableActions, parseActionCalls, generateSystemPrompt } from './actions';

const RED_PILL_API_URL = 'https://api.red-pill.ai/v1/chat/completions';

// Function to execute a single action
async function executeAction(actionCall: ActionCall): Promise<ActionResult> {
  const startTime = Date.now();
  
  try {
    const action = availableActions[actionCall.name];
    if (!action) {
      return {
        actionName: actionCall.name,
        success: false,
        error: `Action '${actionCall.name}' not found`,
        executionTime: Date.now() - startTime,
      };
    }

    // Validate required parameters
    for (const [paramName, paramConfig] of Object.entries(action.parameters)) {
      if (typeof paramConfig === 'object' && paramConfig !== null && 'required' in paramConfig && paramConfig.required && !(paramName in actionCall.parameters)) {
        return {
          actionName: actionCall.name,
          success: false,
          error: `Required parameter '${paramName}' is missing`,
          executionTime: Date.now() - startTime,
        };
      }
    }

    const result = await action.handler(actionCall.parameters);
    
    return {
      actionName: actionCall.name,
      success: true,
      result,
      executionTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      actionName: actionCall.name,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: Date.now() - startTime,
    };
  }
}

export async function POST(request: Request) {
  try {
    // Verify API key exists
    if (!process.env.RED_PILL_API_KEY) {
      return NextResponse.json(
        { error: 'Red Pill API key not configured' },
        { status: 500 }
      );
    }

    // Parse the request body
    const body: ApiRequest = await request.json();
    const { messages, options } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages are required and must be an array' },
        { status: 400 }
      );
    }

    // Add system prompt if action execution is enabled
    let processedMessages = [...messages];
    if (options?.executeActions) {
      const systemPrompt = generateSystemPrompt();
      processedMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.filter(msg => msg.role !== 'system'),
      ];
    }

    // Prepare the request payload for Red Pill API with Llama 3.3 70B
    const redPillPayload = {
      messages: processedMessages,
      model: options?.model || "meta-llama/llama-3.3-70b-instruct", // Updated to Llama 3.3 70B
      stream: false,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 1000,
    };

    // Call Red Pill API with timeout and retry logic
    let response: Response | undefined;
    let lastError: unknown;
    const maxRetries = 2;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        response = await fetch(RED_PILL_API_URL, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RED_PILL_API_KEY}`,
          },
          body: JSON.stringify(redPillPayload),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        break; // Success, exit retry loop
        
      } catch (error) {
        lastError = error;
        console.warn(`Red Pill API attempt ${attempt + 1} failed:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    if (!response) {
      console.error('Red Pill API failed after all retries:', lastError);
      return NextResponse.json(
        { error: `Red Pill API unavailable. Please try again later. ${lastError instanceof Error ? lastError.message : ''}` },
        { status: 503 }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Red Pill API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Red Pill API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const redPillResponse = await response.json();
    
    // Extract the message from Red Pill response
    const assistantMessage: Message = {
      role: 'assistant',
      content: redPillResponse.choices[0]?.message?.content || 'No response from AI',
    };

    // Initialize response
    const apiResponse: ApiResponse = {
      message: assistantMessage,
      executedActions: false,
    };

    // If action execution is enabled, parse and execute actions
    if (options?.executeActions) {
      const actionCalls = parseActionCalls(assistantMessage.content);
      
      if (actionCalls.length > 0) {
        apiResponse.actions = actionCalls.map((call: { name: string; parameters: Record<string, any> }) => ({
          name: call.name,
          parameters: call.parameters,
        }));

        // Execute all actions
        const actionResults: ActionResult[] = [];
        for (const actionCall of actionCalls) {
          const result = await executeAction(actionCall);
          actionResults.push(result);
        }

        apiResponse.actionResults = actionResults;
        apiResponse.executedActions = true;

        // Update the assistant message to include action results
        const actionResultsText = actionResults
          .map(result => {
            if (result.success) {
              return `✅ ${result.actionName}: ${JSON.stringify(result.result)}`;
            } else {
              return `❌ ${result.actionName}: ${result.error}`;
            }
          })
          .join('\n');

        apiResponse.message.content = `${assistantMessage.content}\n\n**Action Results:**\n${actionResultsText}`;
      }
    }

    return NextResponse.json(apiResponse);

  } catch (error) {
    console.error('Red Pill API error:', error);
    return NextResponse.json(
      { error: 'An error occurred during your request.' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to send messages.' },
    { status: 405 }
  );
} 