
import { GoogleGenAI } from "@google/genai";

/**
 * Senior Dev Note: 
 * Primary intelligence pool: Gemini 3 series.
 * Fallback/Resilience layer: Perplexity AI (Sonar Online) for real-time web scraping without Puppeteer.
 */
const GEMINI_MODELS = [
  'gemini-3-flash-preview',
  'gemini-flash-lite-latest'
];

// Perplexity 'online' models act as a managed scraper/search engine
const PERPLEXITY_MODEL = 'llama-3.1-sonar-large-128k-online';
const PERPLEXITY_URL = 'https://api.perplexity.ai/chat/completions';

export interface LLMResponse {
  text: string;
  source: 'gemini' | 'perplexity';
  groundingSources?: any[];
}

/**
 * Resilient LLM caller that rotates through Gemini models and falls back to Perplexity.
 * The Perplexity layer handles real-time property searching when standard grounding nodes are congested.
 */
export async function callLLMWithFallback(prompt: string, config: any = {}): Promise<LLMResponse> {
  const geminiKey = process.env.API_KEY;
  const perplexityKey = process.env.PERPLEXITY_API_KEY;

  if (!geminiKey) {
    throw new Error("CRITICAL_AUTH_ERROR: GEMINI_API_KEY_MISSING");
  }

  let lastError = null;

  // 1. Try Gemini primary intelligence pool
  for (const modelName of GEMINI_MODELS) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          ...config,
          // Ensure we don't accidentally use cached responses at the model level if supported
        }
      });

      const text = response.text;
      if (text) {
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = groundingChunks
          .filter((chunk: any) => chunk.web)
          .map((chunk: any) => ({ 
            uri: chunk.web.uri, 
            title: chunk.web.title 
          }));

        return { 
          text, 
          source: 'gemini', 
          groundingSources: sources 
        };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`QuantCasa [${modelName}] node bypass initiated...`, err.message);
      
      const isRetriable = err.message?.includes('429') || 
                          err.message?.includes('500') || 
                          err.message?.includes('404');
      
      if (isRetriable) continue;
      break; 
    }
  }

  // 2. Failover to Perplexity AI Scraper (Sonar)
  if (perplexityKey) {
    console.info("Switching to Perplexity AI Scraper Node for resilient property search...");
    try {
      const ppRes = await fetch(PERPLEXITY_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityKey}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          model: PERPLEXITY_MODEL,
          messages: [{ 
            role: 'system', 
            content: 'You are a professional real estate data scraper. Return accurate, current property listings for India. Provide price, location, and BHK configuration.' 
          }, { 
            role: 'user', 
            content: prompt 
          }],
          temperature: 0.1,
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
      console.error("Perplexity scraper node failed:", ppErr);
    }
  }

  throw lastError || new Error("NEURAL_BLACKOUT: All search nodes are unreachable.");
}
