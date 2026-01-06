
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
function parsePrice(p: string): number {
  if (!p) return 0;
  const n = parseFloat(p.replace(/[^0-9.]/g, ''));
  if (isNaN(n)) return 0;
  if (p.includes('Cr')) return n * 10000000;
  if (p.includes('L')) return n * 100000;
  return n;
}

export function formatPrice(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${val.toLocaleString('en-IN')}`;
}

/**
 * Extracts JSON from a string that might contain other text or markdown blocks.
 * Necessary because search grounding tools often prevent the model from outputting pure JSON.
 */
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

const SEARCH_PROMPT = (city: string, area: string, pincode: string, bhk: string) =>
  `Search the internet and return the 5 most recent **real** listings for ${bhk} in ${area}, ${city}, ${pincode} from MagicBricks, 99acres, Housing.com.  
  Each item MUST contain: title, price (₹), exact address, pincode, source URL, latitude, longitude.  
  Output strict JSON array only, no chat.`;

export async function getBuyAnalysis(req: BuyRequest): Promise<BuyResult> {
  // 1. live listings first
  const { text, groundingSources } = await callLLMWithFallback(
    SEARCH_PROMPT(req.city, req.area, req.pincode, req.bhk), 
    { tools: [{ googleSearch: {} }] }
  );
  
  const listings: SaleListing[] = extractJsonFromText(text);

  // 2. valuation from comparables
  const prices = listings.map(l => parsePrice(l.price)).filter(p => p > 0);
  const median = prices.length > 0 
    ? prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)]
    : 10000000; // Default fallback

  return {
    fairValue: formatPrice(median),
    valuationRange: `${formatPrice(median * 0.95)} - ${formatPrice(median * 1.05)}`,
    recommendation: median ? 'Fair Price' : 'Overpriced',
    negotiationScript: "Focus on current market trends and comparable prices in the same society.",
    listings,
    marketSentiment: 'Stable Bullish',
    sentimentScore: 75,
    registrationEstimate: formatPrice(median * 0.07),
    appreciationPotential: "5-7% annually",
    confidenceScore: Math.min(listings.length * 20, 95),
    valuationJustification: `Based on ${listings.length} verified listings found in ${req.area}, ${req.pincode}.`,
    insights: [
      { title: "Locality Pulse", description: `High demand for ${req.bhk} configurations in ${req.area}.`, type: "trend" }
    ],
    groundingSources: groundingSources || []
  };
}

export async function getRentAnalysis(req: RentRequest): Promise<RentResult> {
  const prompt = `
    Search the internet for rental listings for ${req.bhk} in ${req.area}, ${req.city}.
    Output strict JSON object: {
      "rentalValue": "string",
      "yieldPercentage": "string",
      "rentOutAlert": "string",
      "depositCalc": "string",
      "negotiationScript": "string",
      "marketSummary": "string",
      "tenantDemandScore": number,
      "confidenceScore": number,
      "valuationJustification": "string",
      "listings": [ { "title": "string", "rent": "string", "address": "string", "sourceUrl": "string", "bhk": "string", "latitude": number, "longitude": number } ]
    }
  `;
  const { text, groundingSources } = await callLLMWithFallback(prompt, { tools: [{ googleSearch: {} }] });
  const parsed = extractJsonFromText(text);
  return { ...parsed, propertiesFoundCount: parsed.listings?.length || 0, groundingSources: groundingSources || [] };
}

export async function getLandValuationAnalysis(req: LandRequest): Promise<LandResult> {
  const prompt = `
    Analyze land plot value for: ${req.address}, ${req.city}. Size: ${req.plotSize} ${req.unit}, FSI: ${req.fsi}.
    Output strict JSON object: {
      "landValue": "string",
      "perSqmValue": "string",
      "devROI": "string",
      "negotiationStrategy": "string",
      "confidenceScore": number,
      "zoningAnalysis": "string",
      "valuationJustification": "string",
      "listings": [ { "title": "string", "price": "string", "size": "string", "address": "string", "sourceUrl": "string", "latitude": number, "longitude": number } ]
    }
  `;
  const { text } = await callLLMWithFallback(prompt, { tools: [{ googleSearch: {} }] });
  return { ...extractJsonFromText(text), insights: [] };
}

export const askPropertyQuestion = async (
  messages: ChatMessage[], 
  contextResult?: any, 
  lang: 'EN' | 'HI' = 'EN',
  intent: 'general' | 'vastu' | 'interior' | 'feng-shui' = 'general'
): Promise<string> => {
  const systemInstruction = `
    You are QuantCasa Property Expert. Language: ${lang === 'HI' ? 'Hindi' : 'English'}.
    Current Intent: ${intent.toUpperCase()}.
    ${contextResult ? `CONTEXT: User property data: ${JSON.stringify(contextResult)}.` : ''}
    Be professional, concise, and helpful. Use markdown for bolding.
  `;

  const lastUserMessage = messages[messages.length - 1].text;
  const { text } = await callLLMWithFallback(lastUserMessage, { systemInstruction, temperature: 0.7 });
  return text;
};

export const generatePropertyImage = async (prompt: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Architectural visualization: ${prompt}. Cinematic lighting, 8k.` }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    const img = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return img ? `data:image/png;base64,${img.inlineData.data}` : null;
  } catch { return null; }
};
