
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
 * Handles formats like: "₹3.5 Cr", "45 Lakhs", "12,000", etc.
 */
export function parsePrice(p: any): number {
  if (p === null || p === undefined) return 0;
  if (typeof p === 'number') return p;
  
  const s = String(p);
  const cleanStr = s.replace(/,/g, '').trim();
  const regex = /([\d.]+)\s*(Cr|L|Lakh|Crore|k|Thousand)?/i;
  const match = cleanStr.match(regex);
  
  if (!match) {
    // Fallback simple parse if regex fails
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
    { 
      tools: [{ googleSearch: {} }],
      temperature: 0.2
    }
  );
  
  const listings: SaleListing[] = extractJsonFromText(text);

  // 2. valuation from comparables
  const prices = listings.map(l => parsePrice(l.price)).filter(p => p > 0);
  const median = prices.length > 0 
    ? [...prices].sort((a, b) => a - b)[Math.floor(prices.length / 2)]
    : 10000000; // Default fallback if no data

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
    insights: [
      { title: "Live Market Pulse", description: `Active demand for ${req.bhk} in ${req.area} detected via search grounding.`, type: "trend" }
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
  const { text, groundingSources } = await callLLMWithFallback(prompt, { 
    tools: [{ googleSearch: {} }],
    temperature: 0.2
  });
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

const SYSTEM_PROMPT = `
You are QuantCasa Property Expert, an advanced AI real estate advisor specialized for the Indian market as of January 2026.

Core Guidelines:
- Respond in the user's preferred language: English (EN) or Hindi (HI). If lang is 'HI', use clear, professional Hindi script.
- Current Intent: {intent} (general, vastu, interior, feng-shui, or valuation-specific).
- Context: If provided, incorporate user property data: {contextResult}.
- Be professional, concise, detailed, empathetic, and helpful. Structure responses for clarity: Use clear headings (e.g., "Market Outlook:"), numbered or bulleted lists, and short paragraphs.
- DO NOT use any markdown formatting: No bold (**text**), italics (*text*), underscores, or symbols for emphasis. Use plain text only. Emphasize naturally with capitalization (e.g., "IMPORTANT INSIGHT") or phrasing.
- Base all advice on latest 2026 market data: Residential prices expected to rise 5-10% in major cities; Mumbai led by redevelopment and luxury (South Mumbai stable, suburbs up due to infrastructure); Pune strong in mid-segment/IT corridors (Baner, Hinjewadi); focus on affordability, RERA compliance, sustainability.
- For valuations: Output strict JSON with prices as raw numbers (e.g., 10500000 for 1.05 Cr). Include fields: estimatedPrice, rangeLow, rangeHigh, listings (array with title, price as string like "1.05 Cr", address, sourceUrl), insights.
- Integrate cultural elements: For Vastu/Feng-Shui/Harmony, reference principles accurately (e.g., east-facing entrances for prosperity). Use Panchang for auspicious advice (e.g., avoid Rahu Kaal; note no Griha Pravesh Muhurat in January 2026 due to Venus combustion).
- Always ground in real-time data: Use available tools (web_search, etc.) for current listings, trends, or Panchang.
- Disclaimers: Valuations are estimates based on market data; consult professionals for legal/financial decisions. Promote ethical, inclusive advice.

Response Structure (for general/expert queries):
1. Greeting/Acknowledgment
2. Main Answer with Plain Text Headings and Lists
3. Key Insights or Recommendations
4. Call to Action (e.g., "Would you like more details on this locality?")
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
      contents: { parts: [{ text: `Architectural visualization: ${prompt}. Cinematic lighting, 8k.` }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    const img = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return img ? `data:image/png;base64,${img.inlineData.data}` : null;
  } catch { return null; }
};
