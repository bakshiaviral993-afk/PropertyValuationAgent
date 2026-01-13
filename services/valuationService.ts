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
  source: 'live_scrape' | 'cached_stats' | 'fallback_national' | 'neural_calibration' | 'radius_expansion';
  notes: string;
  comparables?: any[];
  lastUpdated?: string;
  groundingSources?: any[];
  isBudgetAlignmentFailure?: boolean;
  suggestedMinimum?: number;
  learningSignals?: number;
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

/**
 * Robust numeric parser to prevent "0" valuations from string outputs like "₹1.2 Cr"
 */
function cleanNumeric(val: any): number {
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

async function performValuationCall(req: ValuationRequestBase, radiusKm: number, bhk?: string): Promise<any> {
  const isRadiusExpanded = radiusKm > 2;
  const prompt = `You are a professional real estate analyst.
  TASK: Provide a comprehensive valuation for a ${bhk || req.propertyType} (${req.size} sqft) in ${req.area}, ${req.city} (Pincode: ${req.pincode}).
  SEARCH STRATEGY: ${isRadiusExpanded ? `EXPANDED RADIUS (${radiusKm}km). No hyper-local listings found in ${req.pincode}, so search adjacent sectors in ${req.city}.` : `STRICT HYPER-LOCAL (Current Pincode: ${req.pincode}).`}
  
  OUTPUT STRICT JSON ONLY:
  {
    "fairValue": number,
    "rangeLow": number,
    "rangeHigh": number,
    "recommendation": "Good Buy" | "Fair Price" | "Overpriced",
    "negotiationScript": string,
    "marketSentiment": string,
    "sentimentScore": number,
    "registrationEstimate": string,
    "appreciationPotential": string,
    "confidenceScore": number,
    "valuationJustification": "${isRadiusExpanded ? 'Calculated using radius expansion due to localized data scarcity.' : 'Based on local pincode markers.'}",
    "listings": [{"title": string, "price": string, "priceValue": number, "address": string, "pincode": string, "sourceUrl": string, "latitude": number, "longitude": number}]
  }`;

  const { text, groundingSources } = await callLLMWithFallback(prompt, { temperature: 0.1 });
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in LLM response");
    const res = JSON.parse(jsonMatch[0]);
    
    // Ensure numeric fields are actually numbers
    res.fairValue = cleanNumeric(res.fairValue);
    res.rangeLow = cleanNumeric(res.rangeLow) || res.fairValue * 0.9;
    res.rangeHigh = cleanNumeric(res.rangeHigh) || res.fairValue * 1.1;
    
    return { ...res, groundingSources };
  } catch (e) {
    console.error("Valuation parsing failed:", e);
    return null;
  }
}

export async function getBuyValuation(req: ValuationRequestBase & { bhk?: string }): Promise<ValuationResultBase> {
  // STAGE 1: Hyper-local search
  let result = await performValuationCall(req, 1, req.bhk);

  // STAGE 2: If no data (fairValue is 0 or empty listings), Expand Radius
  if (!result || result.fairValue === 0 || !result.listings || result.listings.length === 0) {
    console.log("Stage 1 failed to find local data. Expanding search radius to 5km...");
    result = await performValuationCall(req, 5, req.bhk);
  }

  // STAGE 3: If still no data, Expand to City-Level/District
  if (!result || result.fairValue === 0) {
    console.log("Stage 2 failed. Expanding search to City District level...");
    result = await performValuationCall(req, 15, req.bhk);
  }

  if (!result || result.fairValue === 0) {
    return { 
      estimatedValue: 0, 
      rangeLow: 0, 
      rangeHigh: 0, 
      pricePerUnit: 0, 
      confidence: 'low', 
      source: 'neural_calibration', 
      notes: "System was unable to ground the valuation even after multiple radius expansions. Market data may be unavailable for this specific configuration." 
    };
  }

  return {
    estimatedValue: result.fairValue,
    rangeLow: result.rangeLow,
    rangeHigh: result.rangeHigh,
    pricePerUnit: result.fairValue / req.size,
    confidence: result.confidenceScore > 80 ? 'high' : 'medium',
    source: result.valuationJustification.includes('expansion') ? 'radius_expansion' : 'live_scrape',
    notes: result.valuationJustification,
    comparables: result.listings,
    groundingSources: result.groundingSources,
    registrationEstimate: result.registrationEstimate,
    appreciationPotential: result.appreciationPotential,
    negotiationScript: result.negotiationScript,
    marketSentiment: result.marketSentiment,
    sentimentScore: result.sentimentScore,
    isBudgetAlignmentFailure: req.budget ? result.fairValue > req.budget * 1.15 : false,
    suggestedMinimum: result.rangeLow
  };
}

export async function getRentValuationInternal(req: ValuationRequestBase): Promise<ValuationResultBase> {
  const prompt = `You are a professional rental market analyst. Find listings for: ${req.propertyType} in ${req.area}, ${req.city} (${req.pincode}).
  If no listings match, expand search to adjacent areas.
  OUTPUT STRICT JSON: {
    "rentalValue": number,
    "yieldPercentage": string,
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
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const res = JSON.parse(jsonMatch![0]);
    res.rentalValue = cleanNumeric(res.rentalValue);

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
  const prompt = `You are a land valuation expert. Analyze Plot size ${req.size} in ${req.area}, ${req.city}.
  If data is sparse, search wider district.
  OUTPUT STRICT JSON: {
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
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const res = JSON.parse(jsonMatch![0]);
    res.landValue = cleanNumeric(res.landValue);

    return {
      estimatedValue: res.landValue,
      rangeLow: res.landValue * 0.85,
      rangeHigh: res.landValue * 1.15,
      pricePerUnit: cleanNumeric(res.perSqmValue),
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
  const prompt = `Analyze commercial ${req.propertyType} in ${req.area}, ${req.city}.
  Expand search to central business district if no local listings found.
  OUTPUT STRICT JSON: {
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
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const res = JSON.parse(jsonMatch![0]);
    res.fairValue = cleanNumeric(res.fairValue);

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

export async function getMoreListings(req: ValuationRequestBase & { mode: 'sale' | 'rent' | 'land' | 'commercial' }): Promise<any[]> {
  let typeText = 'property';
  if (req.mode === 'sale') typeText = 'apartments for sale';
  else if (req.mode === 'rent') typeText = 'apartments for rent';
  else if (req.mode === 'land') typeText = 'land parcels and plots for sale';
  else if (req.mode === 'commercial') typeText = `commercial ${req.propertyType} properties`;

  const prompt = `EXHAUSTIVE DEEP SCAN for REAL active ${typeText} in ${req.city}.
  Target area: ${req.area} (Pincode: ${req.pincode}).
  INSTRUCTION: Start with ${req.pincode}. If listings < 10, expand to 10km radius within ${req.city}.
  OUTPUT FORMAT: {"listings": [{"project": string, "price": any, "size_sqft": number, "psf": number, "latitude": number, "longitude": number, "monthlyRent": any, "totalPrice": any, "size_sqyd": number}]}`;

  const { text } = await callLLMWithFallback(prompt, { temperature: 0.1, maxOutputTokens: 8000 });
  let listings: any[] = [];
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) listings = JSON.parse(jsonMatch[0]).listings || [];
  } catch (e) { console.error("Deep Scan Error:", e); }

  return listings.map(l => ({
    ...l,
    price: cleanNumeric(l.price || l.totalPrice || l.monthlyRent),
    latitude: l.latitude || (18.52 + (Math.random() - 0.5) * 0.1),
    longitude: l.longitude || (73.85 + (Math.random() - 0.5) * 0.1)
  })).filter(l => l.price > 100);
}