import { callLLMWithFallback } from "./llmFallback";
// @ts-ignore
import kv from '@vercel/kv';

export interface ValuationRequestBase {
  city: string;
  area?: string;
  pincode?: string;
  propertyType: string;
  size: number;
  sizeUnit?: 'sqft' | 'sqyd' | 'sqm';
  facing?: string;
  floor?: number;
  constructionYear?: number;
  budget?: number;
}

export interface ValuationResultBase {
  estimatedValue: number;
  rangeLow: number;
  rangeHigh: number;
  pricePerUnit: number;
  confidence: 'high' | 'medium' | 'low';
  source: 'live_scrape' | 'cached_stats' | 'fallback_national';
  notes: string;
  comparables?: any[];
  lastUpdated?: string;
}

const safeKv = {
  async get(key: string) {
    try { return await kv.get(key); } catch { return null; }
  },
  async set(key: string, val: any, opts: any) {
    try { await kv.set(key, val, opts); } catch {}
  }
};

async function getDynamicMarketStats(
  city: string,
  area?: string,
  pincode?: string,
  propertyType: string = "residential"
): Promise<{
  minPsf: number;
  medianPsf: number;
  maxPsf: number;
  confidence: 'high' | 'medium' | 'low';
  lastUpdated: string;
}> {
  const cacheKey = `market-stats:${city}:${area || 'all'}:${pincode || 'any'}:${propertyType}`;
  let cached = await safeKv.get(cacheKey);
  if (cached) return cached as any;

  const prompt = `Scrape current 2026 real estate market statistics for ${propertyType} properties in ${area ? area + ', ' : ''}${city}, India. Calculate min, median, max price per unit. Output strict JSON only: {"minPsf": number, "medianPsf": number, "maxPsf": number, "sampleSize": number, "lastUpdated": "YYYY-MM-DD"}`;

  try {
    const { text } = await callLLMWithFallback(prompt, { temperature: 0.1 });
    const stats = JSON.parse(text.replace(/```json|```/g, '').trim());
    const processed = {
      ...stats,
      confidence: stats.sampleSize >= 10 ? 'high' : 'medium',
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    await safeKv.set(cacheKey, processed, { ex: 7 * 24 * 60 * 60 });
    return processed;
  } catch {
    return { minPsf: 8000, medianPsf: 15000, maxPsf: 35000, confidence: 'low', lastUpdated: new Date().toISOString().split('T')[0] };
  }
}

export async function getBuyValuation(req: ValuationRequestBase & { bhk?: string }): Promise<ValuationResultBase> {
  const stats = await getDynamicMarketStats(req.city, req.area, req.pincode, "residential");
  const prompt = `Scrape 6-12 recent resale ${req.bhk || '2-3 BHK'} listings in ${req.area}, ${req.city}. JSON only: {"listings": [{"project": string, "price": number, "size_sqft": number, "psf": number}]}`;
  
  const { text } = await callLLMWithFallback(prompt, { temperature: 0.1 });
  let listings = [];
  try { listings = JSON.parse(text.replace(/```json|```/g, '').trim()).listings || []; } catch {}
  listings = listings.filter((l: any) => l.price > 1000000 && l.psf > 4000);

  let range;
  if (listings.length >= 4) {
    const prices = listings.map((l: any) => l.price).sort((a: any, b: any) => a - b);
    range = { low: prices[0], mid: prices[Math.floor(prices.length / 2)], high: prices[prices.length - 1] };
  } else {
    const psf = stats.medianPsf;
    const size = req.size || 1100;
    range = { low: psf * size * 0.85, mid: psf * size, high: psf * size * 1.15 };
  }

  return {
    estimatedValue: Math.round(range.mid),
    rangeLow: Math.round(range.low),
    rangeHigh: Math.round(range.high),
    pricePerUnit: Math.round(range.mid / (req.size || 1100)),
    confidence: listings.length >= 4 ? 'high' : 'medium',
    source: listings.length >= 4 ? 'live_scrape' : 'cached_stats',
    notes: listings.length < 4 ? 'Using regional market averages.' : '',
    comparables: listings.slice(0, 6)
  };
}

export async function getRentValuationInternal(req: ValuationRequestBase): Promise<ValuationResultBase> {
  const stats = await getDynamicMarketStats(req.city, req.area, req.pincode, "rental");
  const prompt = `Scrape rental listings for ${req.propertyType} in ${req.area}, ${req.city}. JSON: {"listings": [{"project": string, "monthlyRent": number, "size_sqft": number}]}`;
  const { text } = await callLLMWithFallback(prompt);
  let listings = [];
  try { listings = JSON.parse(text.replace(/```json|```/g, '').trim()).listings || []; } catch {}

  const rentPsf = listings.length >= 3 ? (listings[0].monthlyRent / listings[0].size_sqft) : 25;
  const size = req.size || 1100;

  return {
    estimatedValue: Math.round(rentPsf * size),
    rangeLow: Math.round(rentPsf * size * 0.9),
    rangeHigh: Math.round(rentPsf * size * 1.1),
    pricePerUnit: Math.round(rentPsf),
    confidence: listings.length >= 3 ? 'high' : 'medium',
    source: listings.length >= 3 ? 'live_scrape' : 'cached_stats',
    notes: '',
    comparables: listings
  };
}

export async function getLandValuationInternal(req: ValuationRequestBase): Promise<ValuationResultBase> {
  const stats = await getDynamicMarketStats(req.city, req.area, req.pincode, "land");
  const size = req.size || 1000;
  const psy = stats.medianPsf * 9; // Approx sqft to sqyd conversion logic if needed

  return {
    estimatedValue: Math.round(psy * size),
    rangeLow: Math.round(psy * size * 0.85),
    rangeHigh: Math.round(psy * size * 1.15),
    pricePerUnit: Math.round(psy),
    confidence: 'medium',
    source: 'cached_stats',
    notes: 'Unit: sqyd',
    comparables: []
  };
}

export async function getCommercialValuationInternal(req: ValuationRequestBase): Promise<ValuationResultBase> {
  const stats = await getDynamicMarketStats(req.city, req.area, req.pincode, "commercial");
  const psf = stats.medianPsf * 1.5; // Commercial premium
  const size = req.size || 500;

  return {
    estimatedValue: Math.round(psf * size),
    rangeLow: Math.round(psf * size * 0.9),
    rangeHigh: Math.round(psf * size * 1.1),
    pricePerUnit: Math.round(psf),
    confidence: 'medium',
    source: 'cached_stats',
    notes: '',
    comparables: []
  };
}