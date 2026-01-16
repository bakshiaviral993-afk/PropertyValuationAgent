// api/llm.ts

import { GoogleGenAI } from '@google/genai'; // ← your original import

import axios from 'axios';
import * as cheerio from 'cheerio';

// Safe env access
function getEnv(name: string): string | undefined {
  return process.env[name] || process.env[`VITE_${name}`] || process.env[`NEXT_PUBLIC_${name}`];
}

// Keys — no crash if missing
const GEMINI_API_KEY = getEnv('GEMINI_API_KEY') || getEnv('API_KEY');
const PERPLEXITY_API_KEY = getEnv('PERPLEXITY_API_KEY');
const GOOGLE_MAPS_API_KEY = getEnv('GOOGLE_MAPS_API_KEY');

// Cache
const MARKET_CACHE = new Map<
  string,
  { median: number; low: number; high: number; psf: number; timestamp: number }
>();

const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

// ────────────────────────────────────────────────
// Location extraction — fully dynamic
// ────────────────────────────────────────────────
function extractArea(prompt: string): string {
  const match = prompt.match(/in\s+([^,]+?)(?:,|\s*(?:near|by|road|highway|station|pincode|\d{6}|$))/i);
  return match ? match[1].trim() : '';
}

function extractCity(prompt: string): string {
  const match = prompt.match(/,\s*([A-Za-z\s]+?)(?:\s*(?:near|by|road|pincode|\d{6}|$))/i);
  return match ? match[1].trim() : '';
}

function extractBHK(prompt: string): string {
  const match = prompt.match(/(\d+)\s*(?:BHK|bhk)/i);
  return match ? `${match[1]} BHK` : '2 BHK';
}

// ────────────────────────────────────────────────
// Google Geocoding
// ────────────────────────────────────────────────
async function getCoordinatesGoogle(address: string): Promise<{ lat: number; lng: number }> {
  if (!GOOGLE_MAPS_API_KEY) {
    return { lat: 20.5937, lng: 78.9629 };
  }

  try {
    const query = address ? `${address}, India` : 'India';
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await axios.get(url, { timeout: 7000 });

    if (response.data.status === 'OK' && response.data.results?.length > 0) {
      const loc = response.data.results[0].geometry.location;
      return { lat: loc.lat, lng: loc.lng };
    }
  } catch (err: any) {
    console.error('Geocoding error:', err.message);
  }

  return { lat: 20.5937, lng: 78.9629 };
}

// ────────────────────────────────────────────────
// Market fallback with scraping
// ────────────────────────────────────────────────
async function fetchMarketAverages(area: string, city: string, bhk: string): Promise<{ median: number; low: number; high: number; psf: number }> {
  const cacheKey = `${area || 'any'}-${city || 'any'}-${bhk}`.toLowerCase();
  const cached = MARKET_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY_MS) return cached;

  try {
    let url = `https://www.99acres.com/search/property/buy?keyword=${encodeURIComponent(`${bhk} ${area} ${city}`)}`;
    let response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
      timeout: 10000,
    });

    let $ = cheerio.load(response.data);
    let prices: number[] = [];

    $('.srpTuple__tuplePrice, .srpTuple__startPrice').each((i: number, el: cheerio.Element) => {
      const text = $(el).text().trim().replace(/[^0-9.]/g, '');
      const price = parseFloat(text);
      if (!isNaN(price)) prices.push(price * 100000);
    });

    if (prices.length < 3) {
      url = `https://www.magicbricks.com/property-for-sale/residential-real-estate?bedroom=${bhk.split(' ')[0]}&locality=${encodeURIComponent(area)}&cityName=${encodeURIComponent(city)}`;
      response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
        timeout: 10000,
      });

      $ = cheerio.load(response.data);
      prices = [];

      $('.mb-srp__card__price--amount').each((i: number, el: cheerio.Element) => {
        const text = $(el).text().trim().replace(/[^0-9.]/g, '');
        const price = parseFloat(text);
        if (!isNaN(price)) prices.push(price * 100000);
      });
    }

    if (prices.length === 0) throw new Error('No prices');

    prices.sort((a, b) => a - b);
    const low = prices[0];
    const high = prices[prices.length - 1];
    const median = prices[Math.floor(prices.length / 2)];
    const psf = Math.round(median / (parseInt(bhk) * 550 + 450));

    const data = { median, low, high, psf, timestamp: Date.now() };
    MARKET_CACHE.set(cacheKey, data);
    return data;
  } catch (err: any) {
    console.warn('Scraping failed:', err.message);
    const base = parseInt(bhk) * 5000000 + 5000000;
    return { median: base, low: base * 0.8, high: base * 1.2, psf: base / 1000, timestamp: Date.now() };
  }
}

// ────────────────────────────────────────────────
// Handler
// ────────────────────────────────────────────────
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { prompt = '', config = {}, image } = req.body;
  const isRent = /rent|lease/gi.test(prompt);

  const spatialConstraint = `
CRITICAL: Every listing MUST include latitude & longitude (numbers).
${isRent ? "CRITICAL: RENT prices must be MONTHLY. NEVER use Crores." : ""}
`;

  let text = '';
  let source = 'fallback';

  // Gemini (original style)
  if (GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

      for (const modelName of GEMINI_MODELS) {
        try {
          const contents = image ? { parts: [{ text: prompt + spatialConstraint }, { inlineData: { data: image.data, mimeType: image.mimeType } }] } : prompt + spatialConstraint;

          const result = await genAI.models.generateContent({
            model: modelName,
            contents,
            config: { ...config, responseMimeType: 'application/json' }
          });

          text = result.text;
          source = 'gemini';
          if (text) break;
        } catch (err) {
          console.warn(`Gemini ${modelName} failed:`, err);
        }
      }
    } catch (err) {
      console.warn('Gemini init failed:', err);
    }
  }

  // Perplexity
  if (!text && PERPLEXITY_API_KEY) {
    try {
      const res = await fetch(PERPLEXITY_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${PERPLEXITY_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: PERPLEXITY_MODEL,
          messages: [{ role: 'user', content: prompt + spatialConstraint }],
          temperature: 0.1
        })
      });

      if (res.ok) {
        const data = await res.json();
        text = data?.choices?.[0]?.message?.content ?? '';
        const json = text.match(/\{[\s\S]*\}/)?.[0];
        if (json) {
          text = json;
          source = 'perplexity';
        }
      }
    } catch (err) {
      console.warn('Perplexity failed:', err);
    }
  }

  // Fallback
  if (!text) {
    const area = extractArea(prompt);
    const city = extractCity(prompt);
    const bhk = extractBHK(prompt);

    const market = await fetchMarketAverages(area, city, bhk);
    const address = [area, city].filter(Boolean).join(', ') || 'India';
    const coords = await getCoordinatesGoogle(address);

    const fallback = {
      fairValue: isRent ? `₹${Math.round(market.median / 300)}/mo` : `₹${(market.median / 1e7).toFixed(2)} Cr`,
      listings: [{
        title: `${bhk} Reference`,
        price: isRent ? `₹${Math.round(market.median / 300)}/mo` : `₹${(market.median / 1e7).toFixed(2)} Cr`,
        address,
        latitude: coords.lat,
        longitude: coords.lng
      }]
    };

    text = JSON.stringify(fallback);
    source = 'fallback';
  }

  return res.status(200).json({ text, source });
}
