export interface LLMResponse {
  text: string;
  source: 'gemini' | 'perplexity';
  groundingSources?: any[];
}

export async function callLLMWithFallback(prompt: string, config: any = {}): Promise<LLMResponse> {
  try {
    const response = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, config }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'LLM node failure');
    }

    return await response.json();
  } catch (err: any) {
    console.error('LLM client node error:', err);
    return { text: 'Service temporarily unavailable. Please retry shortly.', source: 'gemini' };
  }
}