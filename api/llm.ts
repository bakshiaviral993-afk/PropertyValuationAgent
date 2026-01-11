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

      const result = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          ...config,
          // Optimization for expert bot: reduce tokens if it's just a diagnostic
          maxOutputTokens: config.maxOutputTokens || 1200,
        }
      });
      return res.status(200).json({ text: result.text, source: 'gemini' });
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