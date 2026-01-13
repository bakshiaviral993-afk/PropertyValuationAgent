import { GoogleGenAI } from '@google/genai';

const GEMINI_MODELS = ['gemini-3-flash-preview', 'gemini-flash-lite-latest'];
const PERPLEXITY_MODEL = 'llama-3.1-sonar-large-128k-online';
const PERPLEXITY_URL = 'https://api.perplexity.ai/chat/completions';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { prompt, config, image } = req.body;
  const geminiKey = process.env.API_KEY;

  // Detection logic for property search intent
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

      // Force googleSearch for all property valuation requests to ensure fresh market data
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

      // If we got valid text and it's not a "no data" response, return it
      if (text && !text.includes('"listings": []') && !text.includes('"fairValue": 0')) {
        return res.status(200).json({ 
          text: text, 
          source: 'gemini',
          groundingSources: groundingSources 
        });
      }
      
      console.warn(`Gemini ${modelName} returned insufficient data, falling back to scraper node.`);
    } catch (err: any) {
      if (err.status === 429) continue;
      console.error(`LLM Error with ${modelName}:`, err);
      break;
    }
  }

  // SCRAPER FALLBACK: Use Perplexity to crawl current listings if Gemini search fails
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
              content: 'You are a real-estate web scraper. Find current property listings and prices. Always output valid JSON.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1
        })
      });

      if (ppRes.ok) {
        const ppJson = await ppRes.json();
        const ppText = ppJson.choices[0].message.content;
        return res.status(200).json({ 
          text: ppText, 
          source: 'perplexity_scraper' 
        });
      }
    } catch (ppErr) {
      console.error("Scraper node failed:", ppErr);
    }
  }

  res.status(500).json({ error: 'Intelligence nodes unreachable or incompatible with input.' });
}