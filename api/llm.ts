import { GoogleGenAI } from '@google/genai';

const GEMINI_MODELS = ['gemini-3-flash-preview', 'gemini-flash-lite-latest'];
const PERPLEXITY_MODEL = 'llama-3.1-sonar-large-128k-online';
const PERPLEXITY_URL = 'https://api.perplexity.ai/chat/completions';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { prompt, config, image } = req.body;
  const geminiKey = process.env.API_KEY;

  for (const modelName of GEMINI_MODELS) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      
      const contents = image 
        ? { parts: [{ text: prompt }, { inlineData: { data: image.data, mimeType: image.mimeType } }] }
        : prompt;

      // Detect if search grounding is likely needed (e.g. for listings or pincodes)
      const needsSearch = prompt.toLowerCase().includes('listing') || 
                         prompt.toLowerCase().includes('pincode') || 
                         prompt.toLowerCase().includes('pin code') ||
                         prompt.toLowerCase().includes('price') ||
                         prompt.toLowerCase().includes('for sale');

      const tools = needsSearch ? [{ googleSearch: {} }] : undefined;

      const result = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          ...config,
          maxOutputTokens: config.maxOutputTokens || 1200,
          tools: tools,
        }
      });

      // Extract grounding sources if available
      const groundingSources = result.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        uri: chunk.web?.uri,
        title: chunk.web?.title
      })).filter((s: any) => s.uri) || [];

      return res.status(200).json({ 
        text: result.text, 
        source: 'gemini',
        groundingSources: groundingSources 
      });
    } catch (err: any) {
      if (err.status === 429) continue;
      console.error(`LLM Error with ${modelName}:`, err);
      break;
    }
  }

  // Perplexity Failover (Text-only)
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
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1
        })
      });

      if (ppRes.ok) {
        const ppJson = await ppRes.json();
        return res.status(200).json({ text: ppJson.choices[0].message.content, source: 'perplexity' });
      }
    } catch (ppErr) {
      console.error("Scraper node failed:", ppErr);
    }
  }

  res.status(500).json({ error: 'Intelligence nodes unreachable or incompatible with input.' });
}