// llmFallback.ts
// Updated: Added type annotations for TS safety and better error handling
// Date: 16-Jan-2026

export interface LLMResponse {
  text: string;
  source: 'gemini' | 'perplexity_scraper' | 'market_fallback';
  groundingSources?: any[];
}

/**
 * Executes a fetch with exponential backoff retry logic.
 */
async function fetchWithRetry(url: string, options: RequestInit, maxRetries: number = 3): Promise<Response> {
  let lastError: any;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      // If rate limited (429) or server error (5xx), retry
      if (response.status === 429 || response.status >= 500) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.warn(`LLM Node busy (Status ${response.status}). Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      return response;
    } catch (err) {
      lastError = err;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw lastError || new Error("LLM Tunnel Timeout");
}

export async function callLLMWithFallback(prompt: string, config: any = {}): Promise<LLMResponse> {
  try {
    const response = await fetchWithRetry('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, config, image: config.image }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `LLM Node Error: ${response.status}`);
    }

    return await response.json();
  } catch (err: any) {
    console.error('FATAL_LLM_TUNNEL_FAILURE:', err);
    // Return a structured error response that the UI can handle gracefully
    return { 
      text: JSON.stringify({ 
        fairValue: 0, 
        listings: [], 
        notes: "Neural link lost. Please check your network connection and retry." 
      }), 
      source: 'market_fallback' 
    };
  }
}
