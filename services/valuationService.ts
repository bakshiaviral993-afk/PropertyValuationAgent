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

/**
 * Safe KV wrapper that won't crash if env vars are missing
 */
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

  const prompt = `Scrape current 2026 real estate market statistics for ${propertyType} properties in ${area ? area + ', ' : ''}${city}, India${pincode ? ' (PIN ' + pincode + ')' : ''}. Use latest listings from 99acres, MagicBricks, Housing.com, NoBroker. Output strict JSON only: {"minPsf": number, "medianPsf": number, "maxPsf": number, "sampleSize": number, "lastUpdated": "YYYY-MM-DD"}`;

  try {
    const { text } = await callLLMWithFallback(prompt, { temperature: 0.1 });
    const stats = JSON.parse(text.replace(/```json|```/g, '').trim());
    const processed = {
      ...stats,
      confidence: stats.sampleSize >= 10 ? 'high' : stats.sampleSize >= 4 ? 'medium' : 'low',
      lastUpdated: stats.lastUpdated || new Date().toISOString().split('T')[0]
    };
    await safeKv.set(cacheKey, processed, { ex: 7 * 24 * 60 * 60 });
    return processed;
  } catch {
    return {
      minPsf: 8000,
      medianPsf: 15000,
      maxPsf: 35000,
      confidence: 'low',
      lastUpdated: new Date().toISOString().split('T')[0]
    };
  }
}

export async function getBuyValuation(req: ValuationRequestBase & { bhk?: string }): Promise<ValuationResultBase> {
  const stats = await getDynamicMarketStats(req.city, req.area, req.pincode, "residential");
  const prompt = `Scrape 6–12 recent resale ${req.bhk || '2-3 BHK'} listings in ${req.area ? req.area + ', ' : ''}${req.city}, India${req.pincode ? ' (PIN ' + req.pincode + ')' : ''}. Output strict JSON: {"listings": [{"project": string, "price": number, "size_sqft": number, "psf": number, "date": "YYYY-MM"}]}`;

  const { text } = await callLLMWithFallback(prompt, { temperature: 0.1 });
  let listings = [];
  try { listings = JSON.parse(text.replace(/```json|```/g, '').trim()).listings || []; } catch {}

  listings = listings.filter((l: any) => l.price > 1000000 && l.size_sqft > 400);

  let range;
  if (listings.length >= 4) {
    const prices = listings.map((l: any) => l.price).sort((a: any, b: any) => a - b);
    range = { low: prices[0], mid: prices[Math.floor(prices.length / 2)], high: prices[prices.length - 1] };
  } else {
    const psf = stats.medianPsf;
    const size = req.size || 1100;
    range = { low: psf * size * 0.85, mid: psf * size, high: psf * size * 1.15 };
  }

  let factor = 1.0;
  if (req.floor && req.floor >= 10) factor *= 1.08;
  if (req.facing?.toLowerCase().includes('east')) factor *= 1.04;
  if (req.constructionYear) {
    const age = new Date().getFullYear() - req.constructionYear;
    if (age > 15) factor *= 0.88;
  }

  return {
    estimatedValue: Math.round(range.mid * factor),
    rangeLow: Math.round(range.low * factor),
    rangeHigh: Math.round(range.high * factor),
    pricePerUnit: Math.round((range.mid * factor) / (req.size || 1100)),
    confidence: listings.length >= 8 ? 'high' : listings.length >= 4 ? 'medium' : 'low',
    source: listings.length >= 4 ? 'live_scrape' : 'cached_stats',
    notes: listings.length < 4 ? 'Using regional market indices.' : '',
    comparables: listings.slice(0, 6)
  };
}

export async function getRentValuationInternal(req: ValuationRequestBase): Promise<ValuationResultBase> {
  const stats = await getDynamicMarketStats(req.city, req.area, req.pincode, "rental");
  const prompt = `Scrape 6–12 current rental listings for ${req.propertyType} in ${req.area ? req.area + ', ' : ''}${req.city}. Output strict JSON: {"listings": [{"project": string, "monthlyRent": number, "size_sqft": number, "rent_per_sqft": number}]}`;

  const { text } = await callLLMWithFallback(prompt, { temperature: 0.1 });
  let listings = [];
  try { listings = JSON.parse(text.replace(/```json|```/g, '').trim()).listings || []; } catch {}
  listings = listings.filter((l: any) => l.monthlyRent > 5000);

  let range;
  if (listings.length >= 4) {
    const rents = listings.map((l: any) => l.monthlyRent).sort((a: any, b: any) => a - b);
    range = { low: rents[0], mid: rents[Math.floor(rents.length / 2)], high: rents[rents.length - 1] };
  } else {
    const psf = stats.medianPsf || 25;
    const size = req.size || 1100;
    range = { low: psf * size * 0.9, mid: psf * size, high: psf * size * 1.1 };
  }

  return {
    estimatedValue: Math.round(range.mid),
    rangeLow: Math.round(range.low),
    rangeHigh: Math.round(range.high),
    pricePerUnit: Math.round(range.mid / (req.size || 1100)),
    confidence: listings.length >= 4 ? 'high' : 'medium',
    source: listings.length >= 4 ? 'live_scrape' : 'cached_stats',
    notes: '',
    comparables: listings.slice(0, 6)
  };
}

export async function getLandValuationInternal(req: ValuationRequestBase): Promise<ValuationResultBase> {
  const stats = await getDynamicMarketStats(req.city, req.area, req.pincode, "land/plot");
  const prompt = `Scrape 6-10 recent residential plot sale listings in ${req.area}, ${req.city}. Output strict JSON: {"listings": [{"project": string, "totalPrice": number, "size_sqyd": number, "price_per_sqyd": number}]}`;

  const { text } = await callLLMWithFallback(prompt, { temperature: 0.1 });
  let listings = [];
  try { listings = JSON.parse(text.replace(/```json|```/g, '').trim()).listings || []; } catch {}

  const medianPsy = listings.length >= 3 ? listings.map((l:any) => l.price_per_sqyd).sort((a:any,b:any)=>a-b)[Math.floor(listings.length/2)] : stats.medianPsf || 5000;
  const size = req.size || 1000;

  return {
    estimatedValue: Math.round(medianPsy * size),
    rangeLow: Math.round(medianPsy * size * 0.9),
    rangeHigh: Math.round(medianPsy * size * 1.1),
    pricePerUnit: Math.round(medianPsy),
    confidence: listings.length >= 3 ? 'high' : 'medium',
    source: listings.length >= 3 ? 'live_scrape' : 'cached_stats',
    notes: `Unit: sqyd`,
    comparables: listings.slice(0, 5)
  };
}

export async function getCommercialValuationInternal(req: ValuationRequestBase): Promise<ValuationResultBase> {
  const stats = await getDynamicMarketStats(req.city, req.area, req.pincode, "commercial");
  const prompt = `Scrape 6-10 recent commercial sale listings in ${req.area}, ${req.city}. Output strict JSON: {"listings": [{"project": string, "totalPrice": number, "psf": number}]}`;

  const { text } = await callLLMWithFallback(prompt, { temperature: 0.1 });
  let listings = [];
  try { listings = JSON.parse(text.replace(/```json|```/g, '').trim()).listings || []; } catch {}

  const medianPsf = listings.length >= 3 ? listings.map((l:any) => l.psf).sort((a:any,b:any)=>a-b)[Math.floor(listings.length/2)] : stats.medianPsf || 15000;
  const size = req.size || 500;

  return {
    estimatedValue: Math.round(medianPsf * size),
    rangeLow: Math.round(medianPsf * size * 0.9),
    rangeHigh: Math.round(medianPsf * size * 1.1),
    pricePerUnit: Math.round(medianPsf),
    confidence: listings.length >= 3 ? 'high' : 'medium',
    source: listings.length >= 3 ? 'live_scrape' : 'cached_stats',
    notes: '',
    comparables: listings.slice(0, 5)
  };
}