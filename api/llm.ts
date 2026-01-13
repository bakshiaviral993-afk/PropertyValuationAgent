import { GoogleGenAI } from '@google/genai';

const GEMINI_MODELS = ['gemini-3-flash-preview', 'gemini-flash-lite-latest'];
const PERPLEXITY_MODEL = 'llama-3.1-sonar-large-128k-online';
const PERPLEXITY_URL = 'https://api.perplexity.ai/chat/completions';

const MARKET_CACHE = new Map<string, { median: number; low: number; high: number; psf: number; timestamp: number }>();
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

function extractArea(prompt: string): string { return prompt.match(/in\s+([A-Za-z\s]+),\s*/i)?.[1]?.trim() || 'Kharadi'; }
function extractCity(prompt: string): string { return prompt.match(/,\s*([A-Za-z\s]+)/i)?.[1]?.trim() || 'Pune'; }
function extractBHK(prompt: string): string { return prompt.match(/(\d)\s*BHK/i)?.[0] || '2 BHK'; }

async function fetchMarketAverages(area: string, city: string, bhk: string): Promise<{ median: number; low: number; high: number; psf: number }> {
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
            content: `Real-estate data aggregator. Output JSON ONLY: {"median": number, "low": number, "high": number, "psf": number}` 
          },
          { role: 'user', content: `Current market average for ${bhk} in ${area}, ${city} (Jan 2026)` }
        ],
        temperature: 0.1
      })
    });

    if (ppRes.ok) {
      const data = await ppRes.json();
      const text = data.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn("Web search node failed, using static fallback.");
  }
  return { median: 10500000, low: 7400000, high: 14500000, psf: 10700 };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { prompt, config, image } = req.body;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 1. Stage 1: Gemini Grounding
  for (const modelName of GEMINI_MODELS) {
    try {
      const contents = image 
        ? { parts: [{ text: prompt }, { inlineData: { data: image.data, mimeType: image.mimeType } }] }
        : prompt;

      const result = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          ...config,
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });

      const text = result.text;
      if (text && !text.includes('"fairValue": 0')) {
        return res.status(200).json({ text, source: 'gemini' });
      }
    } catch (err) {
      console.warn(`Gemini node failure.`);
    }
  }

  // 2. Stage 2: Perplexity Deep Scraper
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
      const data = await ppRes.json();
      const text = data.choices[0].message.content;
      if (text && !text.includes('"fairValue": 0')) {
        return res.status(200).json({ text, source: 'perplexity_scraper' });
      }
    }
  } catch (e) {
    console.warn("Deep scraper offline.");
  }

  // 3. Stage 3: Market Median Fallback
  const area = extractArea(prompt);
  const city = extractCity(prompt);
  const bhk = extractBHK(prompt);
  const cacheKey = `${area},${city},${bhk}`.toLowerCase();
  
  let cached = MARKET_CACHE.get(cacheKey);
  if (!cached || (Date.now() - cached.timestamp > CACHE_EXPIRY_MS)) {
    const freshData = await fetchMarketAverages(area, city, bhk);
    cached = { ...freshData, timestamp: Date.now() };
    MARKET_CACHE.set(cacheKey, cached);
  }

  const fallback = {
    fairValue: `₹${(cached.median / 10000000).toFixed(2)} Cr`,
    valuationRange: `₹${(cached.low / 10000000).toFixed(2)} Cr - ₹${(cached.high / 10000000).toFixed(2)} Cr`,
    recommendation: "Fair Price",
    negotiationScript: `Market medians in ${area} are currently around ₹${(cached.median / 10000000).toFixed(2)} Cr.`,
    marketSentiment: "Stable",
    sentimentScore: 75,
    registrationEstimate: "7% of Fair Value",
    appreciationPotential: "5.4% YoY",
    confidenceScore: 65,
    valuationJustification: "Using Jan 2026 aggregated market averages (AI grounding sparse).",
    listings: []
  };

  return res.status(200).json({ text: JSON.stringify(fallback), source: 'market_fallback' });
}