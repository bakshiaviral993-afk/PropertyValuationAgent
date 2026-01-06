
import { GoogleGenAI } from "@google/genai";

const GEMINI_MODELS = [
  'gemini-3-flash-preview',
  'gemini-flash-lite-latest'
];

const PERPLEXITY_MODEL = 'sonar-reasoning';
const PERPLEXITY_URL = 'https://api.perplexity.ai/chat/completions';

export interface LLMResponse {
  text: string;
  source: 'gemini' | 'perplexity';
  groundingSources?: any[];
}

/**
 * Resilient LLM caller that handles quota rotation and provider failover.
 */
export async function callLLMWithFallback(prompt: string, config: any = {}): Promise<LLMResponse> {
  const geminiKey = process.env.API_KEY;
  const perplexityKey = process.env.PERPLEXITY_API_KEY;

  if (!geminiKey) throw new Error("CRITICAL_AUTH_ERROR: API_KEY_MISSING");

  let lastError = null;

  // 1. Try Gemini model pool via official SDK
  for (const modelName of GEMINI_MODELS) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: config
      });

      const text = response.text;
      if (text) {
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = groundingChunks
          .filter((chunk: any) => chunk.web)
          .map((chunk: any) => ({ uri: chunk.web.uri, title: chunk.web.title }));

        return { text, source: 'gemini', groundingSources: sources };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`QuantCasa [${modelName}] link failed, rotating...`, err.message);
      // Rotate on quota (429), server errors (5xx), or model not found (404)
      if (err.message?.includes('429') || err.message?.includes('500') || err.message?.includes('404') || err.message?.includes('not found')) {
        continue;
      }
      break; 
    }
  }

  // 2. Fall back to Perplexity if enabled
  if (perplexityKey) {
    console.info("Gemini pool exhausted. Initializing Perplexity fallback...");
    try {
      const ppRes = await fetch(PERPLEXITY_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: PERPLEXITY_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (ppRes.ok) {
        const ppJson = await ppRes.json();
        return { 
          text: ppJson.choices[0].message.content, 
          source: 'perplexity',
          groundingSources: [] 
        };
      }
    } catch (ppErr) {
      console.error("Perplexity fallback failed:", ppErr);
    }
  }

  throw lastError || new Error("SYSTEM_HALT: All neural nodes reached quota or are unreachable.");
}
