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
  // New Genkit-aligned fields
  registrationEstimate?: string;
  appreciationPotential?: string;
  negotiationScript?: string;
  marketSentiment?: string;
  sentimentScore?: number;
  valuationJustification?: string;
  tenantDemandScore?: number;
  yieldPercentage?: string;
  depositCalc?: string;
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

export async function getMoreListings(req: ValuationRequestBase & { mode: 'sale' | 'rent' | 'land' | 'commercial' }): Promise<any[]> {
  let typeText = 'property';
  if (req.mode === 'sale') typeText = 'apartments for sale';
  else if (req.mode === 'rent') typeText = 'apartments for rent';
  else if (req.mode === 'land') typeText = 'land parcels and plots for sale';
  else if (req.mode === 'commercial') typeText = `commercial ${req.propertyType} properties`;

  const prompt = `Perform an UNRESTRICTED EXHAUSTIVE Deep Scan for REAL active ${typeText} listings in ${req.area || req.city}, ${req.city}. 
  CRITICAL: Return as many unique real-world listings as possible (target 30-50 nodes). 
  Ignore previous limits. For each property, provide project name, price, size, and EXACT latitude/longitude.
  OUTPUT FORMAT: {"listings": [{"project": string, "price": any, "size_sqft": number, "psf": number, "latitude": number, "longitude": number, "monthlyRent": any, "totalPrice": any, "size_sqyd": number}]}`;

  const { text } = await callLLMWithFallback(prompt, { temperature: 0.1, maxOutputTokens: 8000 });
  let listings: any[] = [];
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) listings = JSON.parse(jsonMatch[0]).listings || [];
  } catch (e) { console.error("Deep Scan Error:", e); }

  return listings.map(l => ({
    ...l,
    price: robustParseNumber(l.price || l.totalPrice || l.monthlyRent),
    latitude: l.latitude || (18.52 + (Math.random() - 0.5) * 0.1),
    longitude: l.longitude || (73.85 + (Math.random() - 0.5) * 0.1)
  })).filter(l => l.price > 100);
}

export async function getBuyValuation(req: ValuationRequestBase & { bhk?: string }): Promise<ValuationResultBase> {
  const prompt = `You are a professional real estate analyst specializing in Indian cities.
  Analyze the following property requirement:
  City: ${req.city}
  Pincode: ${req.pincode}
  Area: ${req.area}
  Config: ${req.propertyType} (${req.size} sqft)
  Budget: ${req.budget}

  OUTPUT STRICT JSON ONLY:
  {
    "fairValue": number,
    "rangeLow": number,
    "rangeHigh": number,
    "recommendation": "Good Buy" | "Fair Price" | "Overpriced" | "Check Details",
    "negotiationScript": string,
    "marketSentiment": string,
    "sentimentScore": number,
    "registrationEstimate": string,
    "appreciationPotential": string,
    "confidenceScore": number,
    "valuationJustification": string,
    "listings": [{"title": string, "price": string, "priceValue": number, "address": string, "pincode": string, "sourceUrl": string, "latitude": number, "longitude": number}]
  }`;

  const { text, groundingSources } = await callLLMWithFallback(prompt, { temperature: 0.1 });
  try {
    const res = JSON.parse(text);
    return {
      estimatedValue: res.fairValue,
      rangeLow: res.rangeLow,
      rangeHigh: res.rangeHigh,
      pricePerUnit: res.fairValue / req.size,
      confidence: res.confidenceScore > 80 ? 'high' : 'medium',
      source: 'live_scrape',
      notes: res.valuationJustification,
      comparables: res.listings,
      groundingSources,
      registrationEstimate: res.registrationEstimate,
      appreciationPotential: res.appreciationPotential,
      negotiationScript: res.negotiationScript,
      marketSentiment: res.marketSentiment,
      sentimentScore: res.sentimentScore,
      isBudgetAlignmentFailure: req.budget ? res.fairValue > req.budget * 1.15 : false,
      suggestedMinimum: res.rangeLow
    };
  } catch (e) {
    return { estimatedValue: 0, rangeLow: 0, rangeHigh: 0, pricePerUnit: 0, confidence: 'low', source: 'neural_calibration', notes: "Failed to parse high-fidelity node." };
  }
}

export async function getRentValuationInternal(req: ValuationRequestBase): Promise<ValuationResultBase> {
  const prompt = `You are a professional real estate rental market analyst.
  Analyze the rental market for: ${req.propertyType} in ${req.area}, ${req.city}.
  
  OUTPUT STRICT JSON ONLY:
  {
    "rentalValue": number,
    "yieldPercentage": string,
    "rentOutAlert": string,
    "depositCalc": string,
    "negotiationScript": string,
    "marketSummary": string,
    "tenantDemandScore": number,
    "confidenceScore": number,
    "valuationJustification": string,
    "listings": [{"title": string, "rent": string, "address": string, "sourceUrl": string, "latitude": number, "longitude": number, "qualityScore": number}]
  }`;

  const { text, groundingSources } = await callLLMWithFallback(prompt);
  try {
    const res = JSON.parse(text);
    return {
      estimatedValue: res.rentalValue,
      rangeLow: res.rentalValue * 0.9,
      rangeHigh: res.rentalValue * 1.1,
      pricePerUnit: res.rentalValue / req.size,
      confidence: res.confidenceScore > 80 ? 'high' : 'medium',
      source: 'live_scrape',
      notes: res.marketSummary,
      comparables: res.listings,
      groundingSources,
      yieldPercentage: res.yieldPercentage,
      depositCalc: res.depositCalc,
      negotiationScript: res.negotiationScript,
      tenantDemandScore: res.tenantDemandScore,
      valuationJustification: res.valuationJustification
    };
  } catch (e) {
    return { estimatedValue: 0, rangeLow: 0, rangeHigh: 0, pricePerUnit: 0, confidence: 'low', source: 'neural_calibration', notes: "Error in rental node." };
  }
}

export async function getLandValuationInternal(req: ValuationRequestBase): Promise<ValuationResultBase> {
  const prompt = `You are a professional land valuation expert.
  Analyze the land parcel: ${req.size} ${req.sizeUnit} in ${req.area}, ${req.city}.
  
  OUTPUT STRICT JSON ONLY:
  {
    "landValue": number,
    "perSqmValue": string,
    "devROI": string,
    "negotiationStrategy": string,
    "confidenceScore": number,
    "zoningAnalysis": string,
    "valuationJustification": string,
    "listings": [{"title": string, "price": string, "size": string, "address": string, "sourceUrl": string, "latitude": number, "longitude": number}]
  }`;

  const { text, groundingSources } = await callLLMWithFallback(prompt);
  try {
    const res = JSON.parse(text);
    return {
      estimatedValue: res.landValue,
      rangeLow: res.landValue * 0.85,
      rangeHigh: res.landValue * 1.15,
      pricePerUnit: robustParseNumber(res.perSqmValue),
      confidence: res.confidenceScore > 80 ? 'high' : 'medium',
      source: 'live_scrape',
      notes: res.zoningAnalysis,
      comparables: res.listings,
      groundingSources,
      negotiationScript: res.negotiationStrategy,
      valuationJustification: res.valuationJustification
    };
  } catch (e) {
    return { estimatedValue: 0, rangeLow: 0, rangeHigh: 0, pricePerUnit: 0, confidence: 'low', source: 'neural_calibration', notes: "Error in land node." };
  }
}

export async function getCommercialValuationInternal(req: ValuationRequestBase): Promise<ValuationResultBase> {
  const prompt = `You are a commercial real estate expert.
  Analyze: ${req.propertyType} (${req.size} sqft) in ${req.area}, ${req.city}.
  
  OUTPUT STRICT JSON ONLY:
  {
    "fairValue": number,
    "yieldPotential": string,
    "footfallScore": number,
    "negotiationScript": string,
    "businessInsights": string,
    "confidenceScore": number,
    "listings": [{"title": string, "price": string, "address": string, "sourceUrl": string, "latitude": number, "longitude": number, "sqft": number}]
  }`;

  const { text, groundingSources } = await callLLMWithFallback(prompt);
  try {
    const res = JSON.parse(text);
    return {
      estimatedValue: res.fairValue,
      rangeLow: res.fairValue * 0.9,
      rangeHigh: res.fairValue * 1.1,
      pricePerUnit: res.fairValue / req.size,
      confidence: res.confidenceScore > 80 ? 'high' : 'medium',
      source: 'live_scrape',
      notes: res.businessInsights,
      comparables: res.listings,
      groundingSources,
      yieldPercentage: res.yieldPotential,
      negotiationScript: res.negotiationScript,
      learningSignals: res.footfallScore
    };
  } catch (e) {
    return { estimatedValue: 0, rangeLow: 0, rangeHigh: 0, pricePerUnit: 0, confidence: 'low', source: 'neural_calibration', notes: "Error in commercial node." };
  }
}