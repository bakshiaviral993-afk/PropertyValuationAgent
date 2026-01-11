import { GoogleGenAI, Type } from "@google/genai";
import { 
  BuyRequest, BuyResult, 
  RentRequest, RentResult, 
  LandRequest, LandResult,
  CommercialRequest, CommercialResult,
  SaleListing, RentalListing, LandListing, CommercialListing,
  GroundingSource, ChatMessage,
  EssentialResult
} from "../types";
import { callLLMWithFallback } from "./llmFallback";
import { getBuyValuation, getRentValuationInternal, getLandValuationInternal, getCommercialValuationInternal } from "./valuationService";

export function parsePrice(p: any): number {
  if (p === null || p === undefined) return 0;
  if (typeof p === 'number') return p;
  const s = typeof p === 'object' ? JSON.stringify(p) : String(p);
  const cleanStr = s.replace(/,/g, '').trim();
  const regex = /([\d.]+)\s*(Cr|L|Lakh|Crore|k|Thousand)?/i;
  const match = cleanStr.match(regex);
  if (!match) return 0;
  let value = parseFloat(match[1]);
  const unit = match[2]?.toLowerCase();
  if (unit === 'cr' || unit === 'crore') value *= 10000000;
  else if (unit === 'l' || unit === 'lakh') value *= 100000;
  else if (unit === 'k' || unit === 'thousand') value *= 1000;
  return value;
}

export function formatPrice(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${val.toLocaleString('en-IN')}`;
}

const extractJsonFromText = (text: string): any => {
  try {
    const cleanedText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error("Could not extract valid property data.");
  }
};

export async function getCommercialAnalysis(req: CommercialRequest): Promise<CommercialResult> {
  const valuation = await getCommercialValuationInternal({
    city: req.city, area: req.area, pincode: req.pincode, propertyType: req.type, size: req.sqft
  });
  const listings: CommercialListing[] = (valuation.comparables || []).map(l => ({
    title: l.project || "Commercial Hub",
    price: formatPrice(l.price || (l.psf * req.sqft)),
    address: req.area, type: req.type, intent: req.intent, sourceUrl: "https://www.99acres.com", sqft: l.size_sqft || req.sqft
  }));
  return {
    fairValue: formatPrice(valuation.estimatedValue),
    yieldPotential: req.intent === 'Buy' ? "5.5% - 7.2%" : "N/A",
    footfallScore: valuation.confidence === 'high' ? 88 : 72,
    businessInsights: `Market analysis shows a ${valuation.confidence} confidence level.`,
    negotiationScript: "Focus on lease fit-out periods and CAM inclusions.",
    confidenceScore: valuation.confidence === 'high' ? 95 : 75,
    listings, groundingSources: []
  };
}

export async function getEssentialsAnalysis(category: string, city: string, area: string): Promise<EssentialResult> {
  const prompt = `Find 5 local business contacts for "${category}" in ${area}, ${city}. Output STRICT JSON: {"category": "${category}", "services": [{"name": string, "contact": string, "address": string, "rating": string, "distance": string, "isOpen": boolean, "sourceUrl": string}], "neighborhoodContext": string}`;
  const { text } = await callLLMWithFallback(prompt, { temperature: 0.1 });
  return extractJsonFromText(text);
}

export async function askCibilExpert(messages: ChatMessage[], currentScore: number): Promise<string> {
  const history = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
  const prompt = `QuantCasa Credit Health Expert. Score: ${currentScore}. History: ${history}. Ask one diagnostic question with OPTIONS: [O1, O2].`;
  const { text } = await callLLMWithFallback(messages[messages.length - 1].text, { systemInstruction: prompt, temperature: 0.7 });
  return text;
}

export async function resolveLocalityData(query: string, city: string, mode: 'localities' | 'pincode' = 'localities'): Promise<string[]> {
  const prompt = mode === 'localities' ? `Major localities in ${city}. JSON ARRAY: ["A", "B"]` : `PIN code for "${query}" in ${city}. JSON ARRAY: ["123456"]`;
  try {
    const { text } = await callLLMWithFallback(prompt, { temperature: 0.1 });
    return extractJsonFromText(text);
  } catch { return []; }
}

export async function getBuyAnalysis(req: BuyRequest): Promise<BuyResult> {
  const valuation = await getBuyValuation({ city: req.city, area: req.area, pincode: req.pincode, propertyType: req.bhk, size: req.sqft, facing: req.facing });
  const listings: SaleListing[] = (valuation.comparables || []).map(l => ({
    title: l.project || "Premium Residency", price: formatPrice(l.price), priceValue: l.price, address: req.area, pincode: req.pincode, sourceUrl: "https://www.magicbricks.com", bhk: req.bhk
  }));
  return {
    fairValue: formatPrice(valuation.estimatedValue), valuationRange: `${formatPrice(valuation.rangeLow)} - ${formatPrice(valuation.rangeHigh)}`,
    recommendation: 'Fair Price', negotiationScript: "Anchor based on recent velocity.",
    listings, marketSentiment: 'High Demand', sentimentScore: 85,
    registrationEstimate: formatPrice(valuation.estimatedValue * 0.07), appreciationPotential: "5-8% annually",
    confidenceScore: 92, valuationJustification: `Grounded via ${valuation.source}.`,
    insights: [{ title: "Live Pulse", description: `Active demand for ${req.bhk} in ${req.city}.`, type: "trend" }], groundingSources: []
  };
}

export async function getRentAnalysis(req: RentRequest): Promise<RentResult> {
  const valuation = await getRentValuationInternal({ city: req.city, area: req.area, pincode: req.pincode, propertyType: req.bhk, size: req.sqft });
  const listings: RentalListing[] = (valuation.comparables || []).map(l => ({
    title: l.project || "Apartment", rent: formatPrice(l.monthlyRent), address: req.area, sourceUrl: "https://www.nobroker.in", bhk: req.bhk, qualityScore: 8, latitude: 19.0, longitude: 72.8, facing: req.facing || "East"
  }));
  return {
    rentalValue: formatPrice(valuation.estimatedValue), yieldPercentage: "3.5%", rentOutAlert: "Steady Demand",
    depositCalc: "3 Months", negotiationScript: "Focus on stability.", marketSummary: "Yields stabilizing.",
    tenantDemandScore: 78, confidenceScore: 90, valuationJustification: `Calculated via ${valuation.source}.`,
    propertiesFoundCount: listings.length, listings, insights: [], groundingSources: []
  };
}

export async function getLandValuationAnalysis(req: LandRequest): Promise<LandResult> {
  const valuation = await getLandValuationInternal({ city: req.city, area: req.area, pincode: req.pincode, propertyType: "Plot", size: req.plotSize });
  return {
    landValue: formatPrice(valuation.estimatedValue), perSqmValue: `₹${valuation.pricePerUnit} / sqyd`,
    devROI: "12-15%", negotiationStrategy: "Leverage FSI potential.", confidenceScore: 85,
    zoningAnalysis: "Residential / Mixed", valuationJustification: `Based on ${valuation.source}.`,
    listings: (valuation.comparables || []).map(l => ({ title: l.project || "Plot", price: formatPrice(l.totalPrice), size: `${l.size_sqyd} sqyd`, address: req.area || req.city, sourceUrl: "https://www.99acres.com", latitude: 19.0, longitude: 72.8, facing: "East" })),
    insights: []
  };
}

export async function analyzeImageForHarmony(base64Data: string, type: string): Promise<string> {
  const prompt = `Analyze this property image for 2026 trendy ${type} compliance. Detect spatial zones, energy flow, and architectural defects. Suggest trendy Biophilic improvements. Output must follow DeepSeek expert structure:
- Tip: [Short summary]
- Details:
  - Step 1: [Observation]
  - Step 2: [Remedy]
- Suggestions:
  - [Follow-up 1]
  - [Follow-up 2]`;
  
  const { text } = await callLLMWithFallback(prompt, { 
    image: { data: base64Data.split(',')[1], mimeType: 'image/jpeg' },
    model: 'gemini-3-flash-preview'
  });
  return text;
}

export const askPropertyQuestion = async (
  messages: ChatMessage[], 
  contextResult?: any, 
  lang: 'EN' | 'HI' = 'EN',
  intent: 'general' | 'vastu' | 'interior' | 'feng-shui' = 'general'
): Promise<string> => {
  const sysPrompt = `You are the QuantCasa Expert AI. Intent: ${intent.toUpperCase()}. Respond in a structured, DeepSeek-style logical breakdown. DO NOT use paragraphs. Always use:
- Tip: [One-line expert advice]
- Details:
  - Step 1: [Technical analysis]
  - Step 2: [Logical reasoning or remedy]
- Suggestions:
  - [Interactive follow-up question A]
  - [Interactive follow-up question B]

Context: ${JSON.stringify(contextResult || {})}. 2026 Trends: Biophilic sustainability, ancient spatial wisdom fusion.`;
  
  const { text } = await callLLMWithFallback(messages[messages.length - 1].text, { systemInstruction: sysPrompt, temperature: 0.7 });
  return text;
};

export const generatePropertyImage = async (prompt: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `High-res architectural 2026 render: ${prompt}. Biophilic style, sustainable materials, natural lighting, energy flow. Cinematic realism.` }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch { return null; }
};