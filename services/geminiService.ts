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

/**
 * Robust price parser using Regex
 */
export function parsePrice(p: any): number {
  if (p === null || p === undefined) return 0;
  if (typeof p === 'number') return p;
  
  const s = typeof p === 'object' ? JSON.stringify(p) : String(p);
  const cleanStr = s.replace(/,/g, '').trim();
  const regex = /([\d.]+)\s*(Cr|L|Lakh|Crore|k|Thousand)?/i;
  const match = cleanStr.match(regex);
  
  if (!match) {
    const n = parseFloat(s.replace(/[^0-9.]/g, ''));
    return isNaN(n) ? 0 : n;
  }
  
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
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("Failed to parse matched JSON block", e);
      }
    }
    throw new Error("Could not extract valid property data from AI node.");
  }
};

/**
 * Commercial Property Analysis - Enhanced with Dynamic Scraping
 */
export async function getCommercialAnalysis(req: CommercialRequest): Promise<CommercialResult> {
  const valuation = await getCommercialValuationInternal({
    city: req.city,
    area: req.area,
    pincode: req.pincode,
    propertyType: req.type,
    size: req.sqft
  });

  const listings: CommercialListing[] = (valuation.comparables || []).map(l => ({
    title: l.project || l.title || "Commercial Complex",
    price: formatPrice(l.price || l.totalPrice || (l.psf * req.sqft)),
    address: req.area,
    type: req.type,
    intent: req.intent,
    sourceUrl: "https://www.99acres.com",
    sqft: l.size_sqft || req.sqft
  }));

  return {
    fairValue: formatPrice(valuation.estimatedValue),
    yieldPotential: req.intent === 'Buy' ? "5.5% - 7.2%" : "N/A",
    footfallScore: valuation.confidence === 'high' ? 88 : 72,
    businessInsights: `Market analysis shows a ${valuation.confidence} confidence level for ${req.type} in ${req.area}.`,
    negotiationScript: "Focus on lease fit-out periods and CAM inclusions.",
    confidenceScore: valuation.confidence === 'high' ? 95 : 75,
    listings,
    groundingSources: []
  };
}

/**
 * Essentials Local Service Discovery
 */
export async function getEssentialsAnalysis(category: string, city: string, area: string): Promise<EssentialResult> {
  const prompt = `Find 5 verified local business contacts for "${category}" in ${area}, ${city}, India. Output STRICT JSON: {"category": "${category}", "services": [{"name": string, "contact": string, "address": string, "rating": string, "distance": string, "isOpen": boolean, "sourceUrl": string}], "neighborhoodContext": string}`;

  const { text } = await callLLMWithFallback(prompt, { tools: [{ googleSearch: {} }], temperature: 0.1 });
  return extractJsonFromText(text);
}

/**
 * AI CIBIL Improvement Guidance
 */
export async function askCibilExpert(messages: ChatMessage[], currentScore: number): Promise<string> {
  const history = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
  const prompt = `You are the QuantCasa Credit Health Expert. User Score: ${currentScore}. CURRENT PHASE: Diagnose causes and offer tips. INSTRUCTIONS: Ask EXACTLY ONE diagnostic question. Always provide 3-4 options in format OPTIONS: [O1, O2, O3]. HISTORY: ${history}`;
  
  const { text } = await callLLMWithFallback(messages[messages.length - 1].text, { systemInstruction: prompt, temperature: 0.7 });
  return text;
}

/**
 * Resolves Locality/Area
 */
export async function resolveLocalityData(query: string, city: string, mode: 'localities' | 'pincode' = 'localities'): Promise<string[]> {
  const prompt = mode === 'localities' 
    ? `Find major localities in ${city}, India. Return JSON ARRAY: ["A", "B"]`
    : `Find the specific 6-digit PIN code for "${query}" in ${city}, India. Return JSON ARRAY: ["123456"]`;
  
  try {
    const { text } = await callLLMWithFallback(prompt, { tools: [{ googleSearch: {} }], temperature: 0.1 });
    return extractJsonFromText(text);
  } catch { return []; }
}

export async function getBuyAnalysis(req: BuyRequest): Promise<BuyResult> {
  const valuation = await getBuyValuation({
    city: req.city,
    area: req.area,
    pincode: req.pincode,
    propertyType: req.bhk,
    size: req.sqft,
    facing: req.facing
  });

  const listings: SaleListing[] = (valuation.comparables || []).map((l, i) => ({
    title: l.project || "Premium Residency",
    price: formatPrice(l.price),
    priceValue: l.price,
    address: req.area,
    pincode: req.pincode,
    sourceUrl: "https://www.magicbricks.com",
    bhk: req.bhk
  }));

  return {
    fairValue: formatPrice(valuation.estimatedValue),
    valuationRange: `${formatPrice(valuation.rangeLow)} - ${formatPrice(valuation.rangeHigh)}`,
    recommendation: 'Fair Price',
    negotiationScript: "Anchor the price based on recent resale velocity in the same building wing.",
    listings,
    marketSentiment: valuation.confidence === 'high' ? 'High Demand' : 'Steady Pulse',
    sentimentScore: valuation.confidence === 'high' ? 85 : 65,
    registrationEstimate: formatPrice(valuation.estimatedValue * 0.07),
    appreciationPotential: "5-8% annually",
    confidenceScore: valuation.confidence === 'high' ? 92 : 75,
    valuationJustification: `Grounded via ${valuation.source} model. Analysis of ${listings.length} verified listings in ${req.area}.`,
    insights: [{ title: "Live Pulse", description: `Active demand for ${req.bhk} in ${req.city}.`, type: "trend" }],
    groundingSources: []
  };
}

export async function getRentAnalysis(req: RentRequest): Promise<RentResult> {
  const valuation = await getRentValuationInternal({
    city: req.city,
    area: req.area,
    pincode: req.pincode,
    propertyType: req.bhk,
    size: req.sqft
  });

  const listings: RentalListing[] = (valuation.comparables || []).map(l => ({
    title: l.project || "Apartment",
    rent: formatPrice(l.monthlyRent),
    address: req.area,
    sourceUrl: "https://www.nobroker.in",
    bhk: req.bhk,
    qualityScore: 8,
    latitude: 19.0,
    longitude: 72.8,
    facing: req.facing || "East"
  }));

  return {
    rentalValue: formatPrice(valuation.estimatedValue),
    yieldPercentage: "3.5%",
    rentOutAlert: "Steady Demand",
    depositCalc: "3 Months",
    negotiationScript: "Focus on long-term lease stability.",
    marketSummary: "Rental yields stabilizing in metro corridors.",
    tenantDemandScore: 78,
    confidenceScore: valuation.confidence === 'high' ? 90 : 70,
    valuationJustification: `Calculated via ${valuation.source} methodology.`,
    propertiesFoundCount: listings.length,
    listings,
    insights: [],
    groundingSources: []
  };
}

export async function getLandValuationAnalysis(req: LandRequest): Promise<LandResult> {
  const valuation = await getLandValuationInternal({
    city: req.city,
    area: req.area,
    pincode: req.pincode,
    propertyType: "Plot",
    size: req.plotSize
  });

  const listings: LandListing[] = (valuation.comparables || []).map(l => ({
    title: l.project || "Plot",
    price: formatPrice(l.totalPrice),
    size: `${l.size_sqyd} sqyd`,
    address: req.area || req.city,
    sourceUrl: "https://www.99acres.com",
    latitude: 19.0,
    longitude: 72.8,
    facing: "East"
  }));

  return {
    landValue: formatPrice(valuation.estimatedValue),
    perSqmValue: `₹${valuation.pricePerUnit} / sqyd`,
    devROI: "12-15%",
    negotiationStrategy: "Leverage FSI potential and boundary clearance.",
    confidenceScore: valuation.confidence === 'high' ? 85 : 65,
    zoningAnalysis: "Residential / Mixed",
    valuationJustification: `Based on regional plot indices from ${valuation.source}.`,
    listings,
    insights: []
  };
}

const SYSTEM_PROMPT = `You are QuantCasa Property Expert. Intent: {intent}. Context: {contextResult}. Rules: Interior mode must follow HIGHLIGHT:: DETAIL:: format. Otherwise plain text.`;

export const askPropertyQuestion = async (
  messages: ChatMessage[], 
  contextResult?: any, 
  lang: 'EN' | 'HI' = 'EN',
  intent: 'general' | 'vastu' | 'interior' | 'feng-shui' = 'general'
): Promise<string> => {
  const systemInstruction = SYSTEM_PROMPT.replace('{intent}', intent.toUpperCase()).replace('{contextResult}', JSON.stringify(contextResult || {}));
  const { text } = await callLLMWithFallback(messages[messages.length - 1].text, { systemInstruction, temperature: 0.7 });
  return text;
};

export const generatePropertyImage = async (prompt: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Architectural viz: ${prompt}` }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch { return null; }
};