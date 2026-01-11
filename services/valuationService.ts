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
  groundingSources?: any[];
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

  const prompt = `Search for current 2026 real estate market statistics and unit rates for ${propertyType} properties in ${area ? area + ', ' : ''}${city}, India. Output strict JSON only: {"minPsf": number, "medianPsf": number, "maxPsf": number, "sampleSize": number, "lastUpdated": "YYYY-MM-DD"}`;

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
  
  // Explicitly ask for REAL listings from the web
  const prompt = `Perform a web search for real, active property listings of ${req.bhk || '2-3 BHK'} apartments currently for sale in ${req.area}, ${req.city}. 
  Provide a JSON list of 6-12 verified projects with their actual prices and sizes.
  OUTPUT FORMAT: {"listings": [{"project": string, "price": number, "size_sqft": number, "psf": number}]}`;
  
  const { text, groundingSources } = await callLLMWithFallback(prompt, { temperature: 0.1 });
  let listings = [];
  try { 
    listings = JSON.parse(text.replace(/```json|```/g, '').trim()).listings || []; 
  } catch (e) {
    console.warn("Listing parse failed, attempting regex extraction");
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { listings = JSON.parse(jsonMatch[0]).listings || []; } catch {}
    }
  }

  // Filter for realistic values to prevent bad data
  listings = listings.filter((l: any) => l.price > 100000 && l.size_sqft > 100);

  let range;
  if (listings.length >= 3) {
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
    source: listings.length >= 3 ? 'live_scrape' : 'cached_stats',
    notes: listings.length < 3 ? 'Grounded via regional market trends due to low listing density.' : '',
    comparables: listings.slice(0, 8),
    groundingSources
  };
}

export async function getRentValuationInternal(req: ValuationRequestBase): Promise<ValuationResultBase> {
  const stats = await getDynamicMarketStats(req.city, req.area, req.pincode, "rental");
  
  const prompt = `Search for active rental listings for ${req.propertyType} in ${req.area}, ${req.city}. 
  Provide a JSON list of verified rental properties.
  OUTPUT FORMAT: {"listings": [{"project": string, "monthlyRent": number, "size_sqft": number}]}`;
  
  const { text, groundingSources } = await callLLMWithFallback(prompt);
  let listings = [];
  try { listings = JSON.parse(text.replace(/```json|```/g, '').trim()).listings || []; } catch {}

  const rentPsf = (listings.length > 0) 
    ? listings.reduce((acc: number, curr: any) => acc + (curr.monthlyRent / curr.size_sqft), 0) / listings.length
    : stats.medianPsf * 0.0025; // Fallback rule of thumb

  const size = req.size || 1100;

  return {
    estimatedValue: Math.round(rentPsf * size),
    rangeLow: Math.round(rentPsf * size * 0.9),
    rangeHigh: Math.round(rentPsf * size * 1.1),
    pricePerUnit: Math.round(rentPsf),
    confidence: listings.length >= 3 ? 'high' : 'medium',
    source: listings.length >= 3 ? 'live_scrape' : 'cached_stats',
    notes: '',
    comparables: listings.slice(0, 8),
    groundingSources
  };
}

export async function getLandValuationInternal(req: ValuationRequestBase): Promise<ValuationResultBase> {
  const stats = await getDynamicMarketStats(req.city, req.area, req.pincode, "land");
  
  const prompt = `Search for recent land/plot sales or active listings in ${req.area}, ${req.city}. 
  Provide a JSON list of results.
  OUTPUT FORMAT: {"listings": [{"project": string, "totalPrice": number, "size_sqyd": number}]}`;
  
  const { text, groundingSources } = await callLLMWithFallback(prompt);
  let listings = [];
  try { listings = JSON.parse(text.replace(/```json|```/g, '').trim()).listings || []; } catch {}

  const size = req.size || 1000;
  // Convert psf stats to sqyd (9x)
  const psy = (listings.length > 0)
    ? listings.reduce((acc: number, curr: any) => acc + (curr.totalPrice / curr.size_sqyd), 0) / listings.length
    : stats.medianPsf * 9 * 0.4; // Conservative land-to-built ratio

  return {
    estimatedValue: Math.round(psy * size),
    rangeLow: Math.round(psy * size * 0.85),
    rangeHigh: Math.round(psy * size * 1.15),
    pricePerUnit: Math.round(psy),
    confidence: listings.length > 0 ? 'medium' : 'low',
    source: listings.length > 0 ? 'live_scrape' : 'cached_stats',
    notes: 'Unit: sqyd',
    comparables: listings,
    groundingSources
  };
}

export async function getCommercialValuationInternal(req: ValuationRequestBase): Promise<ValuationResultBase> {
  const stats = await getDynamicMarketStats(req.city, req.area, req.pincode, "commercial");
  
  const prompt = `Search for commercial ${req.propertyType} listings for sale or lease in ${req.area}, ${req.city}. 
  Provide JSON results.
  OUTPUT FORMAT: {"listings": [{"project": string, "price": number, "psf": number, "size_sqft": number}]}`;
  
  const { text, groundingSources } = await callLLMWithFallback(prompt);
  let listings = [];
  try { listings = JSON.parse(text.replace(/```json|```/g, '').trim()).listings || []; } catch {}

  const psf = (listings.length > 0)
    ? listings.reduce((acc: number, curr: any) => acc + curr.psf, 0) / listings.length
    : stats.medianPsf * 1.5; // Commercial premium

  const size = req.size || 500;

  return {
    estimatedValue: Math.round(psf * size),
    rangeLow: Math.round(psf * size * 0.9),
    rangeHigh: Math.round(psf * size * 1.1),
    pricePerUnit: Math.round(psf),
    confidence: listings.length > 0 ? 'medium' : 'low',
    source: listings.length > 0 ? 'live_scrape' : 'cached_stats',
    notes: '',
    comparables: listings,
    groundingSources
  };
}