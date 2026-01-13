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

function robustParseNumber(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const s = String(val).toLowerCase().replace(/,/g, '').trim();
  const match = s.match(/([\d.]+)\s*(cr|l|lakh|crore|k)?/);
  if (!match) return parseFloat(s) || 0;
  let num = parseFloat(match[1]);
  const unit = match[2];
  if (unit === 'cr' || unit === 'crore') num *= 10000000;
  else if (unit === 'l' || unit === 'lakh') num *= 100000;
  else if (unit === 'k') num *= 1000;
  return num;
}

const CITY_CENTERS: Record<string, {lat: number, lng: number}> = {
  'pune': { lat: 18.5204, lng: 73.8567 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 }
};

async function getLocalityLearningFactor(city: string, area: string): Promise<number> {
  const key = `neural:learn:${city}:${area}`;
  const signals = await safeKv.get(key);
  if (!signals || !Array.isArray(signals)) return 1.0;
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

export async function getMoreListings(req: ValuationRequestBase & { mode: 'sale' | 'rent' | 'land' | 'commercial' }): Promise<any[]> {
  const cityLower = req.city.toLowerCase();
  const baseCoord = CITY_CENTERS[cityLower] || { lat: 18.5204, lng: 73.8567 };
  
  let typeText = 'property';
  if (req.mode === 'sale') typeText = 'apartments for sale';
  else if (req.mode === 'rent') typeText = 'apartments for rent';
  else if (req.mode === 'land') typeText = 'land parcels and plots for sale';
  else if (req.mode === 'commercial') typeText = `commercial ${req.propertyType} properties`;

  const prompt = `Perform an UNRESTRICTED EXHAUSTIVE Deep Scan for REAL active ${typeText} listings in ${req.area || req.city}, ${req.city}. 
  CRITICAL: Return as many unique real-world listings as possible (target 30-50 nodes). 
  Ignore previous limits. For each property, provide project name, price, size, and EXACT latitude/longitude.
  OUTPUT FORMAT: {"listings": [{"project": string, "price": any, "size_sqft": number, "psf": number, "latitude": number, "longitude": number, "monthlyRent": any, "totalPrice": any, "size_sqyd": number}]}`;

  // Using a very high token limit to allow a long JSON list
  const { text } = await callLLMWithFallback(prompt, { temperature: 0.1, maxOutputTokens: 8000 });
  let listings: any[] = [];
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      listings = JSON.parse(jsonMatch[0]).listings || [];
    }
  } catch (e) {
    console.error("Exhaustive Scan Parsing Error:", e);
  }

  return listings.map(l => {
    const price = robustParseNumber(l.price || l.totalPrice || l.monthlyRent);
    const size = robustParseNumber(l.size_sqft || l.size_sqyd) || (req.size || 1100);
    let psf = robustParseNumber(l.psf);
    if (psf === 0 && price > 0) psf = price / size;
    
    return {
      ...l,
      price,
      size_sqft: size,
      psf,
      latitude: l.latitude || (baseCoord.lat + (Math.random() - 0.5) * 0.05),
      longitude: l.longitude || (baseCoord.lng + (Math.random() - 0.5) * 0.05)
    };
  }).filter(l => l.price > 100);
}

export async function getBuyValuation(req: ValuationRequestBase & { bhk?: string }): Promise<ValuationResultBase> {
  const stats = await getDynamicMarketStats(req.city, req.area, req.pincode, "residential");
  const userBudget = req.budget || 0;
  const learningFactor = await getLocalityLearningFactor(req.city, req.area || '');
  
  const calibratedMedianPsf = stats.medianPsf * learningFactor;
  const calibratedMinPsf = stats.minPsf * learningFactor;

  const prompt = `Search for REAL active sale listings of ${req.bhk || '2-3 BHK'} apartments in ${req.area || req.city}, ${req.city}. 
  IMPORTANT: Retrieve 5-10 REAL listings from major sites. 
  CRITICAL: include "latitude" and "longitude" for map visualization. 
  OUTPUT FORMAT: {"listings": [{"project": string, "price": number, "size_sqft": number, "psf": number, "latitude": number, "longitude": number}]}`;
  
  const { text, groundingSources } = await callLLMWithFallback(prompt, { temperature: 0.1 });
  let listings: any[] = [];
  try { 
    const cleanedText = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanedText);
    listings = parsed.listings || []; 
  } catch (e) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { 
        const parsed = JSON.parse(jsonMatch[0]);
        listings = parsed.listings || []; 
      } catch {}
    }
  }

  const cityLower = req.city.toLowerCase();
  const baseCoord = CITY_CENTERS[cityLower] || { lat: 18.5204, lng: 73.8567 };

  listings = listings.map((l) => {
    const price = robustParseNumber(l.price);
    const size = robustParseNumber(l.size_sqft) || (req.size || 1100);
    let psf = robustParseNumber(l.psf);
    if (psf > 0 && psf < 1000) psf *= 1000; 
    if (psf === 0 && price > 0) psf = price / size;

    let latitude = l.latitude;
    let longitude = l.longitude;
    if (!latitude || !longitude || latitude === 0) {
      latitude = baseCoord.lat + (Math.random() - 0.5) * 0.02;
      longitude = baseCoord.lng + (Math.random() - 0.5) * 0.02;
    }

    return { ...l, price, size_sqft: size, psf, latitude, longitude };
  }).filter(l => l.price > 100000 && l.psf > 1500);

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
      notes = `Market Entry Barrier: Direct listings in ${req.area || req.city} start significantly above budget. Entry identified at ₹${(finalValue/10000000).toFixed(2)} Cr.`;
      await logMarketFriction(req.city, req.area || '', userBudget);
    }
  } else {
    finalValue = calibratedMedianPsf * (req.size || 1100);
    
    if (userBudget > 0 && userBudget < finalValue * 0.85) {
      isBudgetAlignmentFailure = true;
      notes = `System Alert: Insufficient verified listings found for target. Rate derived via neural calibration: ~₹${Math.round(calibratedMedianPsf).toLocaleString()}/sqft.`;
      await logMarketFriction(req.city, req.area || '', userBudget);
    }
  }

  return {
    estimatedValue: Math.round(finalValue),
    rangeLow: Math.round(finalValue * 0.94),
    rangeHigh: Math.round(finalValue * 1.06),
    pricePerUnit: Math.round(finalValue / (req.size || 1100)),
    confidence: listings.length >= 3 ? 'high' : 'medium',
    source: listings.length > 0 ? 'live_scrape' : 'cached_stats',
    notes,
    comparables: listings.slice(0, 12),
    groundingSources: groundingSources || [],
    isBudgetAlignmentFailure,
    suggestedMinimum: Math.round(suggestedMinimum),
    learningSignals: learningFactor > 1.0 ? 1 : 0
  };
}

export async function getRentValuationInternal(req: ValuationRequestBase): Promise<ValuationResultBase> {
  const stats = await getDynamicMarketStats(req.city, req.area, req.pincode, "rental");
  const userBudget = req.budget || 0;
  const cityLower = req.city.toLowerCase();
  const baseCoord = CITY_CENTERS[cityLower] || { lat: 18.5204, lng: 73.8567 };
  
  const prompt = `Search for active verified rental listings for ${req.propertyType} in ${req.area || req.city}, ${req.city}. 
  Include "latitude" and "longitude" for markers.
  OUTPUT FORMAT: {"listings": [{"project": string, "monthlyRent": number, "size_sqft": number, "latitude": number, "longitude": number}]}`;
  
  const { text, groundingSources } = await callLLMWithFallback(prompt);
  let listings: any[] = [];
  try { 
    listings = JSON.parse(text.replace(/```json|```/g, '').trim()).listings || []; 
  } catch (e) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) try { listings = JSON.parse(jsonMatch[0]).listings || []; } catch {}
  }

  listings = listings.map(l => ({
    ...l,
    monthlyRent: robustParseNumber(l.monthlyRent),
    size_sqft: robustParseNumber(l.size_sqft) || 1000,
    latitude: l.latitude || (baseCoord.lat + (Math.random() - 0.5) * 0.02),
    longitude: l.longitude || (baseCoord.lng + (Math.random() - 0.5) * 0.02)
  })).filter((l: any) => l.monthlyRent > 1000);

  const rentPsf = (listings.length > 0) 
    ? listings.reduce((acc: number, curr: any) => acc + (curr.monthlyRent / (curr.size_sqft || req.size || 1000)), 0) / listings.length
    : stats.medianPsf * 0.0025; 

  const finalValue = rentPsf * (req.size || 1100);
  let isBudgetAlignmentFailure = userBudget > 0 && finalValue > userBudget * 1.15;

  return {
    estimatedValue: Math.round(finalValue),
    rangeLow: Math.round(finalValue * 0.9),
    rangeHigh: Math.round(finalValue * 1.1),
    pricePerUnit: Math.round(rentPsf),
    confidence: listings.length >= 2 ? 'high' : 'medium',
    source: listings.length >= 2 ? 'live_scrape' : 'cached_stats',
    notes: isBudgetAlignmentFailure ? `Regional rent demand in ${req.area || req.city} exceeds budget.` : '',
    comparables: listings.slice(0, 12),
    groundingSources: groundingSources || [],
    isBudgetAlignmentFailure,
    suggestedMinimum: Math.round(finalValue * 0.9)
  };
}

export async function getLandValuationInternal(req: ValuationRequestBase): Promise<ValuationResultBase> {
  const stats = await getDynamicMarketStats(req.city, req.area, req.pincode, "land");
  const userBudget = req.budget || 0;
  const cityLower = req.city.toLowerCase();
  const baseCoord = CITY_CENTERS[cityLower] || { lat: 18.5204, lng: 73.8567 };

  const prompt = `Search for real land/plot listings in ${req.area || req.city}, ${req.city}. include lat/lng.
  OUTPUT FORMAT: {"listings": [{"project": string, "totalPrice": number, "size_sqyd": number, "latitude": number, "longitude": number}]}`;
  
  const { text, groundingSources } = await callLLMWithFallback(prompt);
  let listings: any[] = [];
  try { 
    listings = JSON.parse(text.replace(/```json|```/g, '').trim()).listings || []; 
  } catch (e) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) try { listings = JSON.parse(jsonMatch[0]).listings || []; } catch {}
  }

  listings = listings.map(l => ({
    ...l,
    totalPrice: robustParseNumber(l.totalPrice),
    size_sqyd: robustParseNumber(l.size_sqyd) || 1000,
    latitude: l.latitude || (baseCoord.lat + (Math.random() - 0.5) * 0.03),
    longitude: l.longitude || (baseCoord.lng + (Math.random() - 0.5) * 0.03)
  })).filter(l => l.totalPrice > 100000);

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
    notes: isBudgetAlignmentFailure ? `High entry cost in ${req.area || req.city} detected.` : 'Unit: sqyd',
    comparables: listings,
    groundingSources: groundingSources || [],
    isBudgetAlignmentFailure,
    suggestedMinimum: Math.round(finalValue * 0.95)
  };
}

export async function getCommercialValuationInternal(req: ValuationRequestBase): Promise<ValuationResultBase> {
  const stats = await getDynamicMarketStats(req.city, req.area, req.pincode, "commercial");
  const cityLower = req.city.toLowerCase();
  const baseCoord = CITY_CENTERS[cityLower] || { lat: 18.5204, lng: 73.8567 };

  const prompt = `Commercial ${req.propertyType} listings in ${req.area || req.city}, ${req.city}. include lat/lng.
  OUTPUT FORMAT: {"listings": [{"project": string, "price": number, "psf": number, "size_sqft": number, "latitude": number, "longitude": number}]}`;
  
  const { text, groundingSources } = await callLLMWithFallback(prompt);
  let listings: any[] = [];
  try { 
    listings = JSON.parse(text.replace(/```json|```/g, '').trim()).listings || []; 
  } catch (e) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) try { listings = JSON.parse(jsonMatch[0]).listings || []; } catch {}
  }

  listings = listings.map(l => ({
    ...l,
    price: robustParseNumber(l.price),
    psf: robustParseNumber(l.psf) || (robustParseNumber(l.price) / (robustParseNumber(l.size_sqft) || 500)),
    latitude: l.latitude || (baseCoord.lat + (Math.random() - 0.5) * 0.02),
    longitude: l.longitude || (baseCoord.lng + (Math.random() - 0.5) * 0.02)
  })).filter(l => l.price > 100000);

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
    groundingSources: groundingSources || [],
    isBudgetAlignmentFailure: false,
    suggestedMinimum: Math.round(finalValue)
  };
}