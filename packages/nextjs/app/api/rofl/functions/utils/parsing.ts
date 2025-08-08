// Function to parse AI response and extract action calls
export function parseActionCalls(aiResponse: string): Array<{ name: string; parameters: Record<string, any> }> {
  const actions: Array<{ name: string; parameters: Record<string, any> }> = [];
  
  // Look for action patterns in the AI response
  // Updated pattern to handle complex JSON-like parameters
  const actionPattern = /\[ACTION:(\w+)(?:\{([^}]*)\})?\]/g;
  let match;
  
  while ((match = actionPattern.exec(aiResponse)) !== null) {
    const actionName = match[1];
    const paramString = match[2] || '';
    
    let parameters: Record<string, any> = {};
    if (paramString) {
      try {
        // Try to parse as JSON first
        try {
          parameters = JSON.parse(`{${paramString}}`);
        } catch {
          // Fallback to simple parameter parsing
          const pairs = paramString.split(',');
          for (const pair of pairs) {
            const [key, value] = pair.split(':').map(s => s.trim());
            if (key && value) {
              // Try to parse as number, boolean, or keep as string
              if (value === 'true') parameters[key] = true;
              else if (value === 'false') parameters[key] = false;
              else if (!isNaN(Number(value))) parameters[key] = Number(value);
              else parameters[key] = value.replace(/['"]/g, ''); // Remove quotes
            }
          }
        }
      } catch (error) {
        console.warn('Failed to parse action parameters:', paramString);
      }
    }
    
    actions.push({ name: actionName, parameters });
  }
  
  return actions;
} 