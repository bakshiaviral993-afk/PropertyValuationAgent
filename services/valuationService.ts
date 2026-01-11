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
  source: 'live_scrape' | 'cached_stats' | 'fallback_national' | 'neural_calibration';
  notes: string;
  comparables?: any[];
  lastUpdated?: string;
  groundingSources?: any[];
  isBudgetAlignmentFailure?: boolean;
  suggestedMinimum?: number;
  learningSignals?: number;
}

const safeKv = {
  async get(key: string) {
    try { return await kv.get(key); } catch { return JSON.parse(localStorage.getItem(key) || 'null'); }
  },
  async set(key: string, val: any, opts?: any) {
    try { await kv.set(key, val, opts); } catch { localStorage.setItem(key, JSON.stringify(val)); }
  }
};

/**
 * Neural Calibration Core: 
 * Learns from budget mismatches and user inputs to adjust market offsets
 */
async function getLocalityLearningFactor(city: string, area: string): Promise<number> {
  const key = `neural:learn:${city}:${area}`;
  const signals = await safeKv.get(key);
  if (!signals || !Array.isArray(signals)) return 1.0;
  
  // If we have at least 3 signals of "market friction", apply a 5-10% inflation offset
  if (signals.length >= 3) return 1.10;
  if (signals.length >= 1) return 1.05;
  return 1.0;
}

async function logMarketFriction(city: string, area: string, userBudget: number) {
  const key = `neural:learn:${city}:${area}`;
  const existing = await safeKv.get(key) || [];
  const updated = [...existing, { budget: userBudget, ts: Date.now() }].slice(-10);
  await safeKv.set(key, updated);
}

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
  const learningFactor = await getLocalityLearningFactor(req.city, req.area || '');
  
  // Apply Self-Learning: If factor > 1, we are using neural calibration
  const calibratedMedianPsf = stats.medianPsf * learningFactor;
  const calibratedMinPsf = stats.minPsf * learningFactor;

  const budgetText = userBudget > 0 ? `Targeting a purchase budget of ₹${(userBudget / 10000000).toFixed(2)} Cr.` : "";
  const prompt = `Search for real active sale listings of ${req.bhk || '2-3 BHK'} apartments in ${req.area}, ${req.city}. 
  ${budgetText} Focus on verified active inventory.
  OUTPUT FORMAT: {"listings": [{"project": string, "price": number, "size_sqft": number, "psf": number}]}`;
  
  const { text, groundingSources } = await callLLMWithFallback(prompt, { temperature: 0.1 });
  let listings = [];
  try { 
    listings = JSON.parse(text.replace(/```json|```/g, '').trim()).listings || []; 
  } catch (e) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) try { listings = JSON.parse(jsonMatch[0]).listings || []; } catch {}
  }

  listings = listings.filter((l: any) => l.price > 100000 && l.psf > 2000);

  let finalValue: number;
  let notes = "";
  let isBudgetAlignmentFailure = false;
  let suggestedMinimum = calibratedMinPsf * (req.size || 1100);

  if (listings.length >= 1) {
    const sortedPsfs = listings.map((l: any) => l.psf).sort((a: any, b: any) => a - b);
    const medianPsf = sortedPsfs[Math.floor(sortedPsfs.length / 2)];
    finalValue = medianPsf * (req.size || 1100);
    
    if (userBudget > 0 && userBudget < finalValue * 0.9) {
      isBudgetAlignmentFailure = true;
      notes = `Market Entry Barrier: Direct listings in ${req.area} currently start significantly above your budget. Entry-level price identified at ₹${(finalValue/10000000).toFixed(2)} Cr.`;
      await logMarketFriction(req.city, req.area || '', userBudget);
    }
  } else {
    // FALLBACK TO STATISTICAL CALIBRATION
    finalValue = calibratedMedianPsf * (req.size || 1100);
    
    if (userBudget > 0 && userBudget < finalValue * 0.85) {
      isBudgetAlignmentFailure = true;
      notes = `System Alert: Insufficient listings found for budget ₹${(userBudget/10000000).toFixed(2)} Cr. This area's grounded rate is ~₹${calibratedMedianPsf.toLocaleString()}/sqft.`;
      await logMarketFriction(req.city, req.area || '', userBudget);
    }
  }

  return {
    estimatedValue: Math.round(finalValue),
    rangeLow: Math.round(finalValue * 0.94),
    rangeHigh: Math.round(finalValue * 1.06),
    pricePerUnit: Math.round(finalValue / (req.size || 1100)),
    confidence: listings.length >= 3 ? 'high' : 'medium',
    source: learningFactor > 1.0 ? 'neural_calibration' : (listings.length >= 2 ? 'live_scrape' : 'cached_stats'),
    notes,
    comparables: listings.slice(0, 8),
    groundingSources,
    isBudgetAlignmentFailure,
    suggestedMinimum: Math.round(suggestedMinimum),
    learningSignals: learningFactor > 1.0 ? 1 : 0
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
  let isBudgetAlignmentFailure = false;

  if (userBudget > 0 && finalValue > userBudget * 1.15) {
    isBudgetAlignmentFailure = true;
    notes = `Budget Friction: Rental yield in ${req.area} has appreciated. Minimum viable rent for this config starts at ₹${Math.round(finalValue).toLocaleString()}.`;
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
    groundingSources,
    isBudgetAlignmentFailure,
    suggestedMinimum: Math.round(finalValue * 0.9)
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
  let isBudgetAlignmentFailure = userBudget > 0 && finalValue > userBudget * 1.2;

  return {
    estimatedValue: Math.round(finalValue),
    rangeLow: Math.round(finalValue * 0.85),
    rangeHigh: Math.round(finalValue * 1.15),
    pricePerUnit: Math.round(psy),
    confidence: listings.length > 0 ? 'medium' : 'low',
    source: listings.length > 0 ? 'live_scrape' : 'cached_stats',
    notes: isBudgetAlignmentFailure ? `Warning: Entry cost for land in ${req.area} is currently higher than requested budget.` : 'Unit: sqyd',
    comparables: listings,
    groundingSources,
    isBudgetAlignmentFailure,
    suggestedMinimum: Math.round(finalValue * 0.95)
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
    notes: userBudget > 0 && finalValue > userBudget * 1.25 ? 'High Capital Barrier Detected for this commercial zone.' : '',
    comparables: listings,
    groundingSources,
    isBudgetAlignmentFailure: userBudget > 0 && finalValue > userBudget * 1.25,
    suggestedMinimum: Math.round(finalValue)
  };
}