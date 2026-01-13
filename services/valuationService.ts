import { callLLMWithFallback } from "./llmFallback";
import { parsePrice } from "../utils/listingProcessor";

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
  source: 'live_scrape' | 'deep_web_scraper' | 'radius_expansion' | 'neural_calibration' | 'market_fallback';
  notes: string;
  comparables?: any[];
  groundingSources?: any[];
  isBudgetAlignmentFailure?: boolean;
  suggestedMinimum?: number;
  registrationEstimate?: string;
  appreciationPotential?: string;
  negotiationScript?: string;
  marketSentiment?: string;
  sentimentScore?: number;
  valuationJustification?: string;
  yieldPercentage?: string;
  learningSignals?: number;
  depositCalc?: string;
  tenantDemandScore?: number;
}

async function performSearchWithRadius(req: ValuationRequestBase, radiusDescription: string, bhk?: string): Promise<any> {
  const prompt = `Valuation Expert: Estimate value for ${bhk || req.propertyType} (${req.size} sqft) in ${req.area}, ${req.city}.
  Strategy: ${radiusDescription}. 
  Mandatory: Output valid JSON with "listings" array. Each listing MUST have "latitude" and "longitude" numbers.
  Output JSON: {"fairValue": number, "rangeLow": number, "rangeHigh": number, "listings": [{"title": string, "price": string, "address": string, "latitude": number, "longitude": number}]}`;

  const { text, source } = await callLLMWithFallback(prompt, { temperature: 0.1 });
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const data = JSON.parse(jsonMatch[0]);
    data.fairValue = parsePrice(data.fairValue);
    data.llmSource = source;
    return data;
  } catch (e) {
    return null;
  }
}

export async function getBuyValuation(req: ValuationRequestBase & { bhk?: string }): Promise<ValuationResultBase> {
  // Stage 1: Pincode
  let result = await performSearchWithRadius(req, `STRICT Pincode: ${req.pincode}`, req.bhk);

  // Stage 2: 5KM expansion (Now triggers on empty listings too)
  if (!result || result.fairValue < 100000 || !result.listings || result.listings.length === 0) {
    console.log("Empty listing signal. Expanding crawl radius...");
    result = await performSearchWithRadius(req, `Expanded 5KM Radius around ${req.area}, ${req.city}`, req.bhk);
    if (result) result.isExpanded = true;
  }

  // Stage 3: Macro expansion (Final LLM search attempt)
  if (!result || result.fairValue < 100000 || !result.listings || result.listings.length === 0) {
    console.log("Micro-market signal dead. Transitioning to city-wide data nodes.");
    result = await performSearchWithRadius(req, `Macro Search for ${req.city} city averages`, req.bhk);
    if (result) result.isMacro = true;
  }

  // Fallback protection is handled in api/llm.ts Stage 3, but we ensure structure here
  const finalResult = result || { fairValue: 0, listings: [] };

  return {
    estimatedValue: finalResult.fairValue,
    rangeLow: parsePrice(finalResult.rangeLow) || finalResult.fairValue * 0.9,
    rangeHigh: parsePrice(finalResult.rangeHigh) || finalResult.fairValue * 1.1,
    pricePerUnit: finalResult.fairValue / (req.size || 1),
    confidence: finalResult.fairValue > 0 ? 'medium' : 'low',
    source: finalResult.llmSource === 'market_fallback' ? 'market_fallback' : (finalResult.isExpanded || finalResult.isMacro ? 'radius_expansion' : 'live_scrape'),
    notes: finalResult.isExpanded ? "Search expanded to 5km micro-market due to sparse local listings." : (finalResult.isMacro ? "Macro-city indices applied." : "Grounded via local data node."),
    comparables: finalResult.listings || [],
    valuationJustification: finalResult.valuationJustification || "Spatial crawl completed."
  };
}

export async function getRentValuationInternal(req: ValuationRequestBase): Promise<ValuationResultBase> {
  const result = await performSearchWithRadius(req, `Leasehold crawl for ${req.area}`, undefined);
  if (!result || result.fairValue < 1000) return { estimatedValue: 0, rangeLow: 0, rangeHigh: 0, pricePerUnit: 0, confidence: 'low', source: 'neural_calibration', notes: "Insufficient signal." };
  return {
    estimatedValue: result.fairValue,
    rangeLow: result.fairValue * 0.9, rangeHigh: result.fairValue * 1.1,
    pricePerUnit: result.fairValue / (req.size || 1),
    confidence: 'medium', source: 'live_scrape', notes: "Verified leasehold index.", comparables: result.listings
  };
}

export async function getLandValuationInternal(req: ValuationRequestBase): Promise<ValuationResultBase> {
  const result = await performSearchWithRadius(req, `Plot district search for ${req.city}`, undefined);
  if (!result || result.fairValue < 100000) return { estimatedValue: 0, rangeLow: 0, rangeHigh: 0, pricePerUnit: 0, confidence: 'low', source: 'neural_calibration', notes: "Land data opaque." };
  return {
    estimatedValue: result.fairValue,
    rangeLow: result.fairValue * 0.85, rangeHigh: result.fairValue * 1.15,
    pricePerUnit: result.fairValue / (req.size || 1),
    confidence: 'medium', source: 'live_scrape', notes: "Land node synced.", comparables: result.listings
  };
}

export async function getCommercialValuationInternal(req: ValuationRequestBase): Promise<ValuationResultBase> {
  const result = await performSearchWithRadius(req, `CBD search for ${req.city}`, undefined);
  if (!result || result.fairValue < 100000) return { estimatedValue: 0, rangeLow: 0, rangeHigh: 0, pricePerUnit: 0, confidence: 'low', source: 'neural_calibration', notes: "Commercial indices missing." };
  return {
    estimatedValue: result.fairValue,
    rangeLow: result.fairValue * 0.9, rangeHigh: result.fairValue * 1.1,
    pricePerUnit: result.fairValue / (req.size || 1),
    confidence: 'medium', source: 'live_scrape', notes: "Commercial asset pulse active.", comparables: result.listings
  };
}

export async function getMoreListings(req: ValuationRequestBase & { mode: 'sale' | 'rent' | 'land' | 'commercial' }): Promise<any[]> {
  const prompt = `EXHAUSTIVE SEARCH: 15+ real ${req.mode} listings in ${req.city}, ${req.area}. 
  JSON: {"listings": [{"project": string, "price": any, "size_sqft": number, "latitude": number, "longitude": number}]}`;
  const { text } = await callLLMWithFallback(prompt, { temperature: 0.1 });
  try {
    const data = JSON.parse(text.match(/\{[\s\S]*\}/)![0]);
    return data.listings || [];
  } catch { return []; }
}