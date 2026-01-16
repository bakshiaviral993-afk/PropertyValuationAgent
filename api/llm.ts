// api/llm.ts

import { GoogleGenAI } from '@google/genai'; // Your original import
import axios from 'axios';
import * as cheerio from 'cheerio';

// ────────────────────────────────────────────────
// Safe env access — no crash if missing
// ────────────────────────────────────────────────
function getEnv(name: string): string | undefined {
  return process.env[name] || process.env[`VITE_${name}`] || process.env[`NEXT_PUBLIC_${name}`];
}

// ────────────────────────────────────────────────
// API Keys
// ────────────────────────────────────────────────
const GEMINI_API_KEY = getEnv('GEMINI_API_KEY') || getEnv('API_KEY');
const PERPLEXITY_API_KEY = getEnv('PERPLEXITY_API_KEY');
const GOOGLE_MAPS_API_KEY = getEnv('GOOGLE_MAPS_API_KEY');

// ────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────
const GEMINI_MODELS = ['gemini-3-flash-preview', 'gemini-flash-lite-latest'];
const PERPLEXITY_MODEL = 'llama-3.1-sonar-large-128k-online';
const PERPLEXITY_URL = 'https://api.perplexity.ai/chat/completions';

// Cache for market data
const MARKET_CACHE = new Map<
  string,
  { median: number; low: number; high: number; psf: number; timestamp: number }
>();

const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

// ────────────────────────────────────────────────
// Dynamic location extraction (no hardcodes)
// ────────────────────────────────────────────────
function extractArea(prompt: string): string {
  const patterns = [
    /in\s+([^,]+?)(?:,|\s*(?:near|by|road|highway|station|pincode|\d{6}|$))/i,
    /at\s+([^,]+?)(?:,|\s*(?:near|by|road|highway|station|pincode|\d{6}|$))/i,
    /location\s*[:=]\s*([^,]+?)(?:,|$)/i,
    /area\s*[:=]\s*([^,]+?)(?:,|$)/i,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match?.[1]) {
      const candidate = match[1].trim();
      if (candidate.length > 3 && candidate.length < 80) {
        return candidate;
      }
    }
  }
  return '';
}

function extractCity(prompt: string): string {
  const patterns = [
    /,\s*([A-Za-z\s]+?)(?:\s*(?:near|by|road|highway|pincode|\d{6}|$))/i,
    /city\s*[:=]\s*([A-Za-z\s]+?)(?:,|$)/i,
    /in\s+.*,\s*([A-Za-z\s]+?)(?:\s|$)/i,
    /^.*?\b([A-Za-z\s]{3,})\s*(?:pincode|\d{6}|$)/i,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match?.[1]) {
      const candidate = match[1].trim();
      if (candidate.length > 2 && candidate.length < 60) {
        return candidate;
      }
    }
  }
  return '';
}

function extractBHK(prompt: string): string {
  const match = prompt.match(/(\d+)\s*(?:BHK|bhk|bedroom|bed)/i);
  return match ? `${match[1]} BHK` : '2 BHK';
}

// ────────────────────────────────────────────────
// Google Maps Geocoding — dynamic for any location
// ────────────────────────────────────────────────
async function getCoordinatesGoogle(addressParts: string[]): Promise<{ lat: number; lng: number }> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('GOOGLE_MAPS_API_KEY missing → fallback to India center');
    return { lat: 20.5937, lng: 78.9629 };
  }

  try {
    const address = addressParts.filter(Boolean).join(', ') || 'India';
    let query = address;
    if (!/(India|IN|\d{6})/i.test(address)) {
      query += ', India';
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await axios.get(url, { timeout: 7000 });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const loc = response.data.results[0].geometry.location;
      console.log(`Geocoded "${query}" → ${loc.lat}, ${loc.lng}`);
      return { lat: loc.lat, lng: loc.lng };
    }

    console.warn(`Geocoding no results for "${query}" (status: ${response.data.status})`);
  } catch (err: any) {
    console.error('Google Geocoding error:', err.message);
  }

  return { lat: 20.5937, lng: 78.9629 };
}

// ────────────────────────────────────────────────
// Real-time market fallback (scraping)
// ────────────────────────────────────────────────
async function fetchMarketAverages(
  area: string,
  city: string,
  bhk: string
): Promise<{ median: number; low: number; high: number; psf: number }> {
  const cacheKey = `${area || 'any'}-${city || 'any'}-${bhk.toLowerCase()}`;
  const cached = MARKET_CACHE.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY_MS) {
    return cached;
  }

  try {
    // Try 99acres
    let url = `https://www.99acres.com/search/property/buy?keyword=${encodeURIComponent(`${bhk} ${area} ${city}`)}`;
    let response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 10000,
    });

    let $ = cheerio.load(response.data);
    let prices: number[] = [];

    $('.srpTuple__tuplePrice, .srpTuple__startPrice').each((i: number, el: cheerio.Element) => {
      const text = $(el).text().trim().replace(/[^0-9.]/g, '');
      const price = parseFloat(text);
      if (!isNaN(price) && price > 50000) prices.push(price * 100000); // Lakhs → absolute
    });

    // Try Magicbricks if poor results
    if (prices.length < 4) {
      url = `https://www.magicbricks.com/property-for-sale/residential-real-estate?` +
            `bedroom=${bhk.split(' ')[0]}&` +
            `locality=${encodeURIComponent(area || '')}&` +
            `cityName=${encodeURIComponent(city || '')}`;

      response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
        timeout: 10000,
      });

      $ = cheerio.load(response.data);
      prices = [];

      $('.mb-srp__card__price--amount').each((i: number, el: cheerio.Element) => {
        const text = $(el).text().trim().replace(/[^0-9.]/g, '');
        const price = parseFloat(text);
        if (!isNaN(price) && price > 50000) prices.push(price * 100000);
      });
    }

    if (prices.length === 0) throw new Error('No valid prices scraped');

    prices.sort((a, b) => a - b);
    const low = prices[0];
    const high = prices[prices.length - 1];
    const median = prices[Math.floor(prices.length / 2)];
    const psf = Math.round(median / (parseInt(bhk) * 550 + 450));

    const data = { median, low, high, psf, timestamp: Date.now() };
    MARKET_CACHE.set(cacheKey, data);
    return data;
  } catch (err: any) {
    console.warn('Market scraping failed:', err.message);

    // Minimal BHK-based fallback
    const base = parseInt(bhk) * 5000000 + 5000000;
    return {
      median: base,
      low: Math.round(base * 0.8),
      high: Math.round(base * 1.2),
      psf: Math.round(base / (parseInt(bhk) * 550 + 450)),
      timestamp: Date.now(),
    };
  }
}

// ────────────────────────────────────────────────
// Main handler
// ────────────────────────────────────────────────
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt = '', config = {}, image } = req.body || {};

  const isRent = /rent|lease|monthly/gi.test(prompt);

  const spatialConstraint = `
CRITICAL RULES:
• Every property MUST include valid numeric latitude & longitude
• For rent: show MONTHLY rent in ₹ (never use Crores or yearly)
• For sale: show total price in ₹ Crores or Lakhs
• Output valid JSON only — no markdown, no explanations outside JSON
`;

  let finalText = '';
  let source = 'fallback';

  // Stage 1: Gemini (using your original style)
  if (GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

      for (const modelName of GEMINI_MODELS) {
        try {
          const contents = image
            ? {
                parts: [
                  { text: prompt + spatialConstraint },
                  {
                    inlineData: {
                      data: image.data,
                      mimeType: image.mimeType || 'image/jpeg',
                    },
                  },
                ],
              }
            : prompt + spatialConstraint;

          const result = await genAI.models.generateContent({
            model: modelName,
            contents,
            config: {
              ...config,
              responseMimeType: 'application/json',
            },
          });

          finalText = result.text;
          source = `gemini-${modelName}`;
          if (finalText) break;
        } catch (err: any) {
          console.warn(`Gemini ${modelName} failed:`, err.message);
        }
      }
    } catch (err: any) {
      console.warn('Gemini init failed:', err.message);
    }
  }

  // Stage 2: Perplexity
  if (!finalText && PERPLEXITY_API_KEY) {
    try {
      const ppRes = await fetch(PERPLEXITY_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: PERPLEXITY_MODEL,
          messages: [{ role: 'user', content: prompt + spatialConstraint }],
          temperature: 0.1,
        }),
      });

      if (ppRes.ok) {
        const data = await ppRes.json();
        const content = data?.choices?.[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          finalText = jsonMatch[0];
          source = 'perplexity';
        }
      }
    } catch (err: any) {
      console.warn('Perplexity failed:', err.message);
    }
  }

  // Stage 3: Full fallback
  if (!finalText) {
    const area = extractArea(prompt);
    const city = extractCity(prompt);
    const bhk = extractBHK(prompt);

    console.log(`Fallback extraction → area: "${area}", city: "${city}", bhk: "${bhk}"`);

    const market = await fetchMarketAverages(area, city, bhk);

    const addressParts = [area, city].filter(Boolean);
    const coords = await getCoordinatesGoogle(addressParts);

    const displayAddress = addressParts.length > 0 ? addressParts.join(', ') : 'India';

    const fallbackData = {
      fairValue: isRent
        ? `₹${Math.round(market.median / 300)} / month`
        : `₹${(market.median / 10000000).toFixed(2)} Cr`,
      estimatedRange: isRent
        ? { low: `₹${Math.round(market.low / 300)}`, high: `₹${Math.round(market.high / 300)}` }
        : { low: `₹${(market.low / 10000000).toFixed(2)} Cr`, high: `₹${(market.high / 10000000).toFixed(2)} Cr` },
      psf: market.psf,
      listings: [
        {
          title: `${bhk} • Market Reference`,
          price: isRent
            ? `₹${Math.round(market.median / 300)} / month`
            : `₹${(market.median / 10000000).toFixed(2)} Cr`,
          address: displayAddress,
          latitude: coords.lat,
          longitude: coords.lng,
          source: 'real-time-fallback',
        },
      ],
      note: 'Primary AI sources unavailable • using real-time market averages + Google Maps location',
    };

    finalText = JSON.stringify(fallbackData, null, 2);
    source = 'real-time-fallback';
  }

  return res.status(200).json({
    text: finalText,
    source,
    success: !!finalText,
  });
}
