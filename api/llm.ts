import { GoogleGenAI } from '@google/genai';

const GEMINI_MODELS = ['gemini-3-flash-preview', 'gemini-flash-lite-latest'];
const PERPLEXITY_MODEL = 'llama-3.1-sonar-large-128k-online';
const PERPLEXITY_URL = 'https://api.perplexity.ai/chat/completions';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { prompt, config, image } = req.body;
  const geminiKey = process.env.API_KEY;

  const isSearchQuery = prompt.toLowerCase().includes('listing') || 
                       prompt.toLowerCase().includes('price') ||
                       prompt.toLowerCase().includes('for sale') ||
                       prompt.toLowerCase().includes('pincode');

  for (const modelName of GEMINI_MODELS) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      
      const contents = image 
        ? { parts: [{ text: prompt }, { inlineData: { data: image.data, mimeType: image.mimeType } }] }
        : prompt;

      const tools = isSearchQuery ? [{ googleSearch: {} }] : undefined;

      const result = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          ...config,
          maxOutputTokens: config.maxOutputTokens || 3000,
          tools: tools,
          responseMimeType: config.responseMimeType || (prompt.toLowerCase().includes('json') ? 'application/json' : undefined),
        }
      });

      const text = result.text;
      const groundingSources = result.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        uri: chunk.web?.uri,
        title: chunk.web?.title
      })).filter((s: any) => s.uri) || [];

      // CRITICAL: Detect "No Data" or "Zero Valuation" signals
      const isLowQuality = !text || text.includes('"listings": []') || text.includes('"fairValue": 0') || text.length < 100;

      if (!isLowQuality) {
        return res.status(200).json({ 
          text: text, 
          source: 'gemini',
          groundingSources: groundingSources 
        });
      }
      
      console.warn(`Gemini ${modelName} returned empty or 0 data. Transitioning to Deep Scraper.`);
    } catch (err: any) {
      if (err.status === 429) continue;
      console.error(`LLM Error with ${modelName}:`, err);
      break;
    }
  }

  // SCRAPER FALLBACK: High-compute web crawl if standard LLM grounding fails
  if (!image) {
    try {
      const ppRes = await fetch(PERPLEXITY_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: PERPLEXITY_MODEL,
          messages: [
            { 
              role: 'system', 
              content: 'You are a professional Real Estate Scraper. Search 99acres, MagicBricks, and Housing.com. Find REAL current listings. If data is missing for a specific pincode, expand your search to the 10km surrounding area. Always output valid JSON.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1
        })
      });

      if (ppRes.ok) {
        const ppJson = await ppRes.json();
        return res.status(200).json({ 
          text: ppJson.choices[0].message.content, 
          source: 'deep_web_scraper' 
        });
      }
    } catch (ppErr) {
      console.error("Deep scraper node failed:", ppErr);
    }
  }

  res.status(500).json({ error: 'All intelligence nodes returned 0. Market data currently opaque.' });
}