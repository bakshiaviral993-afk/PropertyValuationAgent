import { callLLMWithFallback } from "./llmFallback";

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
  source: 'live_scrape' | 'deep_web_scraper' | 'radius_expansion' | 'neural_calibration';
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

async function performSearchWithRadius(req: ValuationRequestBase, radiusDescription: string, bhk?: string): Promise<any> {
  const prompt = `You are a Real Estate Valuation Expert.
  TASK: Estimate value for ${bhk || req.propertyType} (${req.size} sqft) in ${req.area}, ${req.city} (Pincode: ${req.pincode}).
  SEARCH STRATEGY: ${radiusDescription}.
  
  IMPORTANT: Return at least 10 REAL active listings from the web. If the specific pincode has no data, search adjacent sectors and expansion areas.
  
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
    "valuationJustification": string,
    "listings": [{"title": string, "price": string, "address": string, "sourceUrl": string, "latitude": number, "longitude": number}]
  }`;

  const { text, source } = await callLLMWithFallback(prompt, { 
    temperature: 0.1,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const data = JSON.parse(jsonMatch[0]);
    
    // Sanitize and ensure non-zero valuation
    data.fairValue = cleanNumeric(data.fairValue);
    
    // If fairValue is still 0, try to derive it from listings
    if (data.fairValue === 0 && data.listings && data.listings.length > 0) {
      const prices = data.listings.map((l: any) => cleanNumeric(l.price)).filter((p: number) => p > 0);
      if (prices.length > 0) {
        data.fairValue = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
      }
    }

    data.rangeLow = cleanNumeric(data.rangeLow) || data.fairValue * 0.9;
    data.rangeHigh = cleanNumeric(data.rangeHigh) || data.fairValue * 1.1;
    data.llmSource = source;
    
    return data;
  } catch (e) {
    return null;
  }
}

export async function getBuyValuation(req: ValuationRequestBase & { bhk?: string }): Promise<ValuationResultBase> {
  // STAGE 1: Hyper-Local
  let result = await performSearchWithRadius(req, `STRICT Pincode: ${req.pincode}`, req.bhk);

  // STAGE 2: 5KM Expansion
  if (!result || result.fairValue === 0 || !result.listings || result.listings.length < 3) {
    console.log("Expanding search to 5km radius...");
    result = await performSearchWithRadius(req, `Expanded 5KM Radius around ${req.area}, ${req.city}`, req.bhk);
    if (result) result.isExpanded = true;
  }

  // STAGE 3: 15KM / City expansion
  if (!result || result.fairValue === 0) {
    console.log("Expanding search to 15km City District level...");
    result = await performSearchWithRadius(req, `Macro City Search for ${req.city} metropolitan area`, req.bhk);
    if (result) result.isMacro = true;
  }

  if (!result || result.fairValue === 0) {
    return {
      estimatedValue: 0, rangeLow: 0, rangeHigh: 0, pricePerUnit: 0,
      confidence: 'low', source: 'neural_calibration',
      notes: "System was unable to ground a non-zero valuation after city-wide expansion. Market data may be opaque for this specific configuration."
    };
  }

  const expansionNote = result.isMacro ? "Found properties based on your parameters in the wider City District." : 
                        result.isExpanded ? "Found properties based on your parameters in the 5km surrounding area." : 
                        "Found properties matching your parameters in the hyper-local pincode.";

  return {
    estimatedValue: result.fairValue,
    rangeLow: result.rangeLow,
    rangeHigh: result.rangeHigh,
    pricePerUnit: result.fairValue / req.size,
    confidence: result.confidenceScore > 80 ? 'high' : 'medium',
    source: result.isExpanded || result.isMacro ? 'radius_expansion' : 'live_scrape',
    notes: `${expansionNote} ${result.valuationJustification}`,
    comparables: result.listings,
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
  const result = await performSearchWithRadius(req, `Rental expansion for ${req.area}, ${req.city}`, undefined);
  if (!result || result.fairValue === 0) {
    return { estimatedValue: 0, rangeLow: 0, rangeHigh: 0, pricePerUnit: 0, confidence: 'low', source: 'neural_calibration', notes: "Insufficient rental indices found." };
  }

  return {
    estimatedValue: result.fairValue,
    rangeLow: result.rangeLow,
    rangeHigh: result.rangeHigh,
    pricePerUnit: result.fairValue / req.size,
    confidence: 'medium',
    source: 'live_scrape',
    notes: result.valuationJustification,
    comparables: result.listings,
    yieldPercentage: result.yieldPercentage,
    depositCalc: result.depositCalc,
    tenantDemandScore: result.tenantDemandScore
  };
}

export async function getLandValuationInternal(req: ValuationRequestBase): Promise<ValuationResultBase> {
  const result = await performSearchWithRadius(req, `Plot/Land District search for ${req.city}`, undefined);
  if (!result || result.fairValue === 0) {
    return { estimatedValue: 0, rangeLow: 0, rangeHigh: 0, pricePerUnit: 0, confidence: 'low', source: 'neural_calibration', notes: "Land indices not found." };
  }

  return {
    estimatedValue: result.fairValue,
    rangeLow: result.rangeLow,
    rangeHigh: result.rangeHigh,
    pricePerUnit: result.fairValue / (req.size || 1),
    confidence: 'medium',
    source: 'live_scrape',
    notes: result.valuationJustification,
    comparables: result.listings,
    negotiationScript: result.negotiationScript
  };
}

export async function getCommercialValuationInternal(req: ValuationRequestBase): Promise<ValuationResultBase> {
  const result = await performSearchWithRadius(req, `Central Business District search for ${req.city}`, undefined);
  if (!result || result.fairValue === 0) {
    return { estimatedValue: 0, rangeLow: 0, rangeHigh: 0, pricePerUnit: 0, confidence: 'low', source: 'neural_calibration', notes: "Commercial indices not found." };
  }

  return {
    estimatedValue: result.fairValue,
    rangeLow: result.rangeLow,
    rangeHigh: result.rangeHigh,
    pricePerUnit: result.fairValue / req.size,
    confidence: 'medium',
    source: 'live_scrape',
    notes: result.valuationJustification,
    comparables: result.listings,
    yieldPercentage: result.yieldPercentage,
    learningSignals: result.learningSignals
  };
}

export async function getMoreListings(req: ValuationRequestBase & { mode: 'sale' | 'rent' | 'land' | 'commercial' }): Promise<any[]> {
  const prompt = `EXHAUSTIVE SEARCH for real ${req.mode} listings in ${req.city}.
  Target area: ${req.area} (Pincode: ${req.pincode}).
  Expansion criteria: Search within 15km radius if hyper-local results are sparse.
  OUTPUT FORMAT: {"listings": [{"project": string, "price": any, "size_sqft": number, "latitude": number, "longitude": number}]}`;

  const { text } = await callLLMWithFallback(prompt, { temperature: 0.1, maxOutputTokens: 5000, config: { tools: [{ googleSearch: {} }] } });
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return (data.listings || []).map((l: any) => ({ ...l, price: cleanNumeric(l.price) }));
    }
  } catch {}
  return [];
}