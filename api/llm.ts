import { GoogleGenAI } from '@google/genai';

/* =========================
   ENV SAFETY (MANDATORY)
========================= */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

/* =========================
   CONSTANTS
========================= */
const GEMINI_MODELS = ['gemini-3-flash-preview', 'gemini-flash-lite-latest'];
const PERPLEXITY_MODEL = 'llama-3.1-sonar-large-128k-online';
const PERPLEXITY_URL = 'https://api.perplexity.ai/chat/completions';

const GEMINI_API_KEY = requireEnv('API_KEY');
const PERPLEXITY_API_KEY = requireEnv('PERPLEXITY_API_KEY');

/* =========================
   CACHE
========================= */
const MARKET_CACHE = new Map<
  string,
  { median: number; low: number; high: number; psf: number; timestamp: number }
>();

const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

/* =========================
   HELPERS
========================= */
function extractArea(prompt: string): string {
  return prompt.match(/in\s+([A-Za-z\s]+),\s*/i)?.[1]?.trim() || 'Kharadi';
}

function extractCity(prompt: string): string {
  return prompt.match(/,\s*([A-Za-z\s]+)/i)?.[1]?.trim() || 'Pune';
}

function extractBHK(prompt: string): string {
  return prompt.match(/(\d)\s*BHK/i)?.[0] || '2 BHK';
}

/* =========================
   MARKET FETCH (PERPLEXITY)
========================= */
async function fetchMarketAverages(
  area: string,
  city: string,
  bhk: string
): Promise<{ median: number; low: number; high: number; psf: number }> {
  try {
    const ppRes = await fetch(PERPLEXITY_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: PERPLEXITY_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'Real-estate data aggregator. Output JSON ONLY: {"median": number, "low": number, "high": number, "psf": number}'
          },
          {
            role: 'user',
            content: `Current market average for ${bhk} in ${area}, ${city} (Jan 2026)`
          }
        ],
        temperature: 0.1
      })
    });

    if (ppRes.ok) {
      const data = await ppRes.json();
      const text: string = data?.choices?.[0]?.message?.content ?? '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    }
  } catch {
    console.warn('Perplexity market fetch failed, using fallback.');
  }

  return { median: 10500000, low: 7400000, high: 14500000, psf: 10700 };
}

/* =========================
   API HANDLER
========================= */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt = '', config = {}, image } = req.body;
  const isRentSearch =
    prompt.toLowerCase().includes('rent') ||
    prompt.toLowerCase().includes('lease');

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const spatialConstraint = `
CRITICAL: Every listing MUST include latitude & longitude (numbers).
${isRentSearch
  ? "CRITICAL: RENT prices must be MONTHLY. NEVER use Crores."
  : ""}
`;

  /* =========================
     STAGE 1 — GEMINI
  ========================= */
  for (const modelName of GEMINI_MODELS) {
    try {
      const contents = image
        ? {
            parts: [
              { text: prompt + spatialConstraint },
              {
                inlineData: {
                  data: image.data,
                  mimeType: image.mimeType
                }
              }
            ]
          }
        : prompt + spatialConstraint;

      const result = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          ...config,
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json'
        }
      });

      const text = result.text;
      const parsed = JSON.parse(text);

      if (
        parsed?.fairValue &&
        Array.isArray(parsed?.listings) &&
        parsed.listings.length > 0
      ) {
        return res.status(200).json({ text, source: 'gemini' });
      }
    } catch {
      console.warn('Gemini model failed, trying next.');
    }
  }

  /* =========================
     STAGE 2 — PERPLEXITY
  ========================= */
  try {
    const ppRes = await fetch(PERPLEXITY_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: PERPLEXITY_MODEL,
        messages: [{ role: 'user', content: prompt + spatialConstraint }],
        temperature: 0.1
      })
    });

    if (ppRes.ok) {
      const data = await ppRes.json();
      const text: string = data?.choices?.[0]?.message?.content ?? '';
      const json = text.match(/\{[\s\S]*\}/)?.[0];

      if (json) {
        const parsed = JSON.parse(json);
        if (parsed?.fairValue && parsed?.listings?.length > 0) {
          return res.status(200).json({ text, source: 'perplexity_scraper' });
        }
      }
    }
  } catch {
    console.warn('Perplexity scraper failed.');
  }

  /* =========================
     STAGE 3 — FALLBACK
  ========================= */
  const area = extractArea(prompt);
  const city = extractCity(prompt);
  const bhk = extractBHK(prompt);

  const cacheKey = `${area},${city},${bhk}`.toLowerCase();
  let cached = MARKET_CACHE.get(cacheKey);

  if (!cached || Date.now() - cached.timestamp > CACHE_EXPIRY_MS) {
    const fresh = await fetchMarketAverages(area, city, bhk);
    cached = { ...fresh, timestamp: Date.now() };
    MARKET_CACHE.set(cacheKey, cached);
  }

  const coords: Record<string, { lat: number; lng: number }> = {
    pune: { lat: 18.5204, lng: 73.8567 },
    mumbai: { lat: 19.076, lng: 72.8777 },
    bangalore: { lat: 12.9716, lng: 77.5946 }
  };

  const base = coords[city.toLowerCase()] ?? { lat: 20.5937, lng: 78.9629 };

  const fallback = {
    fairValue: isRentSearch
      ? '₹35,000'
      : `₹${(cached.median / 1e7).toFixed(2)} Cr`,
    listings: [
      {
        title: `${bhk} Market Reference`,
        price: isRentSearch
          ? '₹38,000'
          : `₹${(cached.median / 1e7).toFixed(2)} Cr`,
        address: `${area}, ${city}`,
        latitude: base.lat + 0.002,
        longitude: base.lng + 0.002
      }
    ]
  };

  return res
    .status(200)
    .json({ text: JSON.stringify(fallback), source: 'market_fallback' });
}
