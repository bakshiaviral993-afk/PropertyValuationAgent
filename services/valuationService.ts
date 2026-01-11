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
  const userBudget = req.budget || 0;
  
  const budgetText = userBudget > 0 ? `Targeting a purchase budget of ₹${(userBudget / 10000000).toFixed(2)} Cr.` : "";
  const prompt = `Search for real active sale listings of ${req.bhk || '2-3 BHK'} apartments in ${req.area}, ${req.city}. 
  ${budgetText} Provide active verified listings. If no direct budget match, provide the most relevant available market comparables.
  OUTPUT FORMAT: {"listings": [{"project": string, "price": number, "size_sqft": number, "psf": number}]}`;
  
  const { text, groundingSources } = await callLLMWithFallback(prompt, { temperature: 0.1 });
  let listings = [];
  try { 
    listings = JSON.parse(text.replace(/```json|```/g, '').trim()).listings || []; 
  } catch (e) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) try { listings = JSON.parse(jsonMatch[0]).listings || []; } catch {}
  }

  // Precision Filtering: Remove invalid or empty signals
  listings = listings.filter((l: any) => l.price > 100000 && l.psf > 2000);

  let finalValue: number;
  let notes = "";

  if (listings.length >= 2) {
    const sortedPsfs = listings.map((l: any) => l.psf).sort((a: any, b: any) => a - b);
    const medianPsf = sortedPsfs[Math.floor(sortedPsfs.length / 2)];
    const derivedValue = medianPsf * (req.size || 1100);
    
    if (userBudget > 0 && derivedValue > userBudget * 1.1) {
      notes = `Note: Current area listings suggest a fair value slightly above your target budget. Secondary location pivot or area downsizing recommended.`;
    }
    finalValue = derivedValue;
  } else {
    finalValue = stats.medianPsf * (req.size || 1100);
    notes = "Valuation grounded via regional market indices due to limited active live listings.";
  }

  return {
    estimatedValue: Math.round(finalValue),
    rangeLow: Math.round(finalValue * 0.94),
    rangeHigh: Math.round(finalValue * 1.06),
    pricePerUnit: Math.round(finalValue / (req.size || 1100)),
    confidence: listings.length >= 3 ? 'high' : 'medium',
    source: listings.length >= 2 ? 'live_scrape' : 'cached_stats',
    notes,
    comparables: listings.slice(0, 8),
    groundingSources
  };
}

export async function getRentValuationInternal(req: ValuationRequestBase): Promise<ValuationResultBase> {
  const stats = await getDynamicMarketStats(req.city, req.area, req.pincode, "rental");
  const userBudget = req.budget || 0;
  
  const budgetText = userBudget > 0 ? `Targeting a monthly rent of ₹${userBudget.toLocaleString()}.` : "";
  const prompt = `Search for active verified rental listings for ${req.propertyType} in ${req.area}, ${req.city}. 
  ${budgetText} Output real results near this price point.
  OUTPUT FORMAT: {"listings": [{"project": string, "monthlyRent": number, "size_sqft": number}]}`;
  
  const { text, groundingSources } = await callLLMWithFallback(prompt);
  let listings = [];
  try { 
    listings = JSON.parse(text.replace(/```json|```/g, '').trim()).listings || []; 
  } catch (e) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) try { listings = JSON.parse(jsonMatch[0]).listings || []; } catch {}
  }

  listings = listings.filter((l: any) => l.monthlyRent > 1000);

  const rentPsf = (listings.length > 0) 
    ? listings.reduce((acc: number, curr: any) => acc + (curr.monthlyRent / (curr.size_sqft || req.size || 1000)), 0) / listings.length
    : stats.medianPsf * 0.0025; 

  const finalValue = rentPsf * (req.size || 1100);
  let notes = "";
  if (userBudget > 0 && finalValue > userBudget * 1.15) {
    notes = `Note: Current rental demand in ${req.area} is resulting in higher asks. Recommended to check immediate outskirts.`;
  }

  return {
    estimatedValue: Math.round(finalValue),
    rangeLow: Math.round(finalValue * 0.9),
    rangeHigh: Math.round(finalValue * 1.1),
    pricePerUnit: Math.round(rentPsf),
    confidence: listings.length >= 2 ? 'high' : 'medium',
    source: listings.length >= 2 ? 'live_scrape' : 'cached_stats',
    notes,
    comparables: listings.slice(0, 8),
    groundingSources
  };
}

export async function getLandValuationInternal(req: ValuationRequestBase): Promise<ValuationResultBase> {
  const stats = await getDynamicMarketStats(req.city, req.area, req.pincode, "land");
  const userBudget = req.budget || 0;

  const budgetText = userBudget > 0 ? `Targeting a plot cost of ₹${(userBudget/10000000).toFixed(2)} Cr.` : "";
  const prompt = `Search for real land/plot listings for sale in ${req.area}, ${req.city}. 
  ${budgetText} Priority for listings within ±15% of budget.
  OUTPUT FORMAT: {"listings": [{"project": string, "totalPrice": number, "size_sqyd": number}]}`;
  
  const { text, groundingSources } = await callLLMWithFallback(prompt);
  let listings = [];
  try { 
    listings = JSON.parse(text.replace(/```json|```/g, '').trim()).listings || []; 
  } catch (e) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) try { listings = JSON.parse(jsonMatch[0]).listings || []; } catch {}
  }

  const psy = (listings.length > 0)
    ? listings.reduce((acc: number, curr: any) => acc + (curr.totalPrice / (curr.size_sqyd || req.size || 1000)), 0) / listings.length
    : stats.medianPsf * 9 * 0.4; 

  const finalValue = psy * (req.size || 1000);

  return {
    estimatedValue: Math.round(finalValue),
    rangeLow: Math.round(finalValue * 0.85),
    rangeHigh: Math.round(finalValue * 1.15),
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
  const userBudget = req.budget || 0;

  const budgetText = userBudget > 0 ? `Budget: ₹${(userBudget/10000000).toFixed(2)} Cr.` : "";
  const prompt = `Search for commercial ${req.propertyType} listings in ${req.area}, ${req.city}. 
  ${budgetText} Include only real verified assets.
  OUTPUT FORMAT: {"listings": [{"project": string, "price": number, "psf": number, "size_sqft": number}]}`;
  
  const { text, groundingSources } = await callLLMWithFallback(prompt);
  let listings = [];
  try { 
    listings = JSON.parse(text.replace(/```json|```/g, '').trim()).listings || []; 
  } catch (e) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) try { listings = JSON.parse(jsonMatch[0]).listings || []; } catch {}
  }

  const psf = (listings.length > 0)
    ? listings.reduce((acc: number, curr: any) => acc + (curr.price / (curr.size_sqft || req.size || 500)), 0) / listings.length
    : stats.medianPsf * 1.5; 

  const finalValue = psf * (req.size || 500);

  return {
    estimatedValue: Math.round(finalValue),
    rangeLow: Math.round(finalValue * 0.9),
    rangeHigh: Math.round(finalValue * 1.1),
    pricePerUnit: Math.round(psf),
    confidence: listings.length > 0 ? 'medium' : 'low',
    source: listings.length > 0 ? 'live_scrape' : 'cached_stats',
    notes: '',
    comparables: listings,
    groundingSources
  };
}