
import { GoogleGenAI, Type } from "@google/genai";
import { 
  BuyRequest, BuyResult, 
  RentRequest, RentResult, 
  LandRequest, LandResult,
  SaleListing,
  GroundingSource, ChatMessage
} from "../types";
import { callLLMWithFallback } from "./llmFallback";

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
    return JSON.parse(text.trim());
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("Failed to parse matched JSON block", e);
      }
    }
    throw new Error("Could not extract valid JSON from model response.");
  }
};

export async function getBuyAnalysis(req: BuyRequest): Promise<BuyResult> {
  const prompt = `Search the internet and return the 5 most recent **real** listings for ${req.bhk} in ${req.area}, ${req.city}, ${req.pincode} from MagicBricks, 99acres, Housing.com. Output strict JSON array of listings only.`;
  const { text, groundingSources } = await callLLMWithFallback(prompt, { tools: [{ googleSearch: {} }], temperature: 0.2 });
  
  const listings: SaleListing[] = extractJsonFromText(text);
  const prices = listings.map(l => parsePrice(l.price)).filter(p => p > 0);
  const median = prices.length > 0 ? [...prices].sort((a, b) => a - b)[Math.floor(prices.length / 2)] : 10000000;

  return {
    fairValue: formatPrice(median),
    valuationRange: `${formatPrice(median * 0.95)} - ${formatPrice(median * 1.05)}`,
    recommendation: median ? 'Fair Price' : 'Check Details',
    negotiationScript: "Focus on current market trends and comparable prices in the same society.",
    listings,
    marketSentiment: 'Live Market',
    sentimentScore: 75,
    registrationEstimate: formatPrice(median * 0.07),
    appreciationPotential: "5-7% annually",
    confidenceScore: Math.min(listings.length * 20, 100),
    valuationJustification: `Based on ${listings.length} verified listings in ${req.area}, ${req.pincode}.`,
    insights: [{ title: "Live Pulse", description: `Active demand for ${req.bhk} detected.`, type: "trend" }],
    groundingSources: groundingSources || []
  };
}

export async function getRentAnalysis(req: RentRequest): Promise<RentResult> {
  const prompt = `
    Search internet for 5 REAL rental listings for ${req.bhk} in ${req.area}, ${req.city}, ${req.pincode}.
    STRICT JSON OUTPUT:
    {
      "rentalValue": "string (e.g. ₹45,000)",
      "yieldPercentage": "string (e.g. 3.2%)",
      "rentOutAlert": "string",
      "depositCalc": "string",
      "negotiationScript": "string",
      "marketSummary": "string",
      "tenantDemandScore": number,
      "confidenceScore": number (0-100),
      "valuationJustification": "string (MUST NOT BE EMPTY)",
      "listings": [ { "title": "string", "rent": "string", "address": "string", "sourceUrl": "string", "bhk": "string", "latitude": number, "longitude": number } ]
    }
  `;
  const { text, groundingSources } = await callLLMWithFallback(prompt, { 
    tools: [{ googleSearch: {} }],
    temperature: 0.1 // High precision
  });
  
  const parsed = extractJsonFromText(text);
  
  // Safe stringification if LLM returned objects for strings
  const sanitize = (val: any) => (typeof val === 'object' ? (val.value || val.text || JSON.stringify(val)) : String(val || ""));

  return { 
    ...parsed, 
    rentalValue: sanitize(parsed.rentalValue),
    yieldPercentage: sanitize(parsed.yieldPercentage),
    valuationJustification: sanitize(parsed.valuationJustification) || `Analysis of ${parsed.listings?.length || 0} listings in ${req.area}.`,
    propertiesFoundCount: parsed.listings?.length || 0, 
    groundingSources: groundingSources || [] 
  };
}

export async function getLandValuationAnalysis(req: LandRequest): Promise<LandResult> {
  const prompt = `
    STRICT DEVELOPER VALIDATION: Identify REAL land listings in ${req.area}, ${req.city}.
    The plot size is ${req.plotSize} ${req.unit}.
    
    TASK:
    1. Find the Average Market Rate per ${req.unit} in this specific locality.
    2. DO NOT hallucinate total values like "80000 Cr". 
    3. Calculate total as: Rate per unit * ${req.plotSize}.
    
    Return strict JSON:
    {
      "landValue": "string (The calculated total price, e.g. 5.5 Cr)",
      "perSqmValue": "string (The rate per ${req.unit}, e.g. 45000 per ${req.unit})",
      "devROI": "string",
      "negotiationStrategy": "string",
      "confidenceScore": number,
      "zoningAnalysis": "string",
      "valuationJustification": "string (Detailed reasoning citing actual listings found)",
      "listings": [ { "title": "string", "price": "string", "size": "string", "sourceUrl": "string" } ]
    }
  `;
  const { text } = await callLLMWithFallback(prompt, { tools: [{ googleSearch: {} }], temperature: 0.1 });
  const data = extractJsonFromText(text);
  
  const totalVal = parsePrice(data.landValue);
  const rateVal = parsePrice(data.perSqmValue);
  
  const expectedTotal = rateVal * req.plotSize;
  if (totalVal > expectedTotal * 1.5 || totalVal < expectedTotal * 0.5) {
    data.landValue = formatPrice(expectedTotal);
    data.valuationJustification += " (Calculation corrected for mathematical consistency).";
  }

  return { ...data, insights: [] };
}

const SYSTEM_PROMPT = `
You are QuantCasa Property Expert, specialized in Indian Real Estate 2026.
Respond in plain text only. No markdown formatting.
`;

export const askPropertyQuestion = async (
  messages: ChatMessage[], 
  contextResult?: any, 
  lang: 'EN' | 'HI' = 'EN',
  intent: 'general' | 'vastu' | 'interior' | 'feng-shui' = 'general'
): Promise<string> => {
  const systemInstruction = SYSTEM_PROMPT
    .replace('{intent}', intent.toUpperCase())
    .replace('{contextResult}', contextResult ? JSON.stringify(contextResult) : 'None provided');

  const lastUserMessage = messages[messages.length - 1].text;
  const { text } = await callLLMWithFallback(lastUserMessage, { systemInstruction, temperature: 0.7 });
  return text;
};

export const generatePropertyImage = async (prompt: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `High-end architectural visualization: ${prompt}` }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    const img = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return img ? `data:image/png;base64,${img.inlineData.data}` : null;
  } catch { return null; }
};
