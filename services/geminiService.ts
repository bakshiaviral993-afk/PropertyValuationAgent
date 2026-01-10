
import { GoogleGenAI, Type } from "@google/genai";
import { 
  BuyRequest, BuyResult, 
  RentRequest, RentResult, 
  LandRequest, LandResult,
  CommercialRequest, CommercialResult,
  SaleListing,
  GroundingSource, ChatMessage,
  EssentialResult
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
 * Commercial Property Analysis
 */
export async function getCommercialAnalysis(req: CommercialRequest): Promise<CommercialResult> {
  const prompt = `Find 5 verified REAL commercial listings for ${req.intent} of ${req.type} in ${req.area}, ${req.city}, ${req.pincode}, India. 
  Sqft: ${req.sqft}. 
  Return STRICT JSON:
  {
    "fairValue": "Estimated Market Rate",
    "yieldPotential": "5.5%",
    "footfallScore": 85,
    "businessInsights": "Regional commercial summary for this category.",
    "negotiationScript": "Lease/Purchase strategy script.",
    "confidenceScore": 90,
    "listings": [
      {
        "title": "Complex Name",
        "price": "₹2.5 Cr or ₹45,000/mo",
        "address": "Street Detail",
        "type": "${req.type}",
        "intent": "${req.intent}",
        "sourceUrl": "verified link",
        "sqft": ${req.sqft}
      }
    ]
  }`;

  const { text, groundingSources } = await callLLMWithFallback(prompt, { 
    tools: [{ googleSearch: {} }], 
    temperature: 0.1 
  });
  
  const parsed = extractJsonFromText(text);
  return { ...parsed, groundingSources: groundingSources || [] };
}

/**
 * Essentials Local Service Discovery
 */
export async function getEssentialsAnalysis(category: string, city: string, area: string): Promise<EssentialResult> {
  const prompt = `Find 5 verified local business contacts for "${category}" in ${area}, ${city}, India. 
  Include their Name, Phone/Contact, Full Address, Rating, and approximate Distance if possible.
  STRICT JSON OUTPUT ONLY: 
  {
    "category": "${category}",
    "services": [
      {
        "name": "Store Name",
        "contact": "Phone Number",
        "address": "Full Street Address",
        "rating": "4.5",
        "distance": "1.2 km",
        "isOpen": true,
        "sourceUrl": "link to maps or listing"
      }
    ],
    "neighborhoodContext": "Brief summary of service availability in this specific area."
  }`;

  const { text } = await callLLMWithFallback(prompt, { 
    tools: [{ googleSearch: {} }], 
    temperature: 0.1 
  });
  
  return extractJsonFromText(text);
}

/**
 * AI CIBIL Improvement Guidance
 */
export async function askCibilExpert(messages: ChatMessage[], currentScore: number): Promise<string> {
  const history = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
  const prompt = `You are the QuantCasa Credit Health Expert. User Score: ${currentScore}.
  
  CURRENT PHASE: Diagnose causes of low credit score and offer recovery tips.
  
  INSTRUCTIONS:
  - DO NOT REPEAT YOUR GREETING.
  - Analyze the chat history and identify if the user is struggling with: late payments, high utilization, new credit hunger, or lack of history.
  - Ask EXACTLY ONE short, professional diagnostic question.
  - ALWAYS provide 3-4 choice options at the very end in the format OPTIONS: [Opt1, Opt2, Opt3].
  
  FORMAT:
  [Your brief insight/response]
  [Next specific question]
  OPTIONS: [Yes, No, I don't know]

  HISTORY:
  ${history}`;
  
  const { text } = await callLLMWithFallback(messages[messages.length - 1].text, {
    systemInstruction: prompt,
    temperature: 0.7
  });
  
  return text;
}

/**
 * Resolves Locality/Area based on City or vice versa using Web Search
 */
export async function resolveLocalityData(query: string, city: string, mode: 'localities' | 'pincode' = 'localities'): Promise<string[]> {
  const prompt = mode === 'localities' 
    ? `Find all major residential and commercial localities/areas in ${city}, India. Return STRICT JSON ARRAY: ["Area 1", "Area 2"]`
    : `Find the specific 6-digit PIN code for the locality "${query}" in ${city}, India. Return STRICT JSON ARRAY containing only the 6-digit strings found.`;
  
  try {
    const { text } = await callLLMWithFallback(prompt, { 
      tools: [{ googleSearch: {} }], 
      temperature: 0.1 
    });
    return extractJsonFromText(text);
  } catch (e) {
    console.warn(`Locality resolution failed for ${mode}`, e);
    return [];
  }
}

export async function getBuyAnalysis(req: BuyRequest): Promise<BuyResult> {
  const prompt = `List 5-10 current residential properties for sale in ${req.area}, ${req.city}, ${req.pincode}, India for ${req.bhk} configuration. 
  STRICT JSON ARRAY OUTPUT ONLY: 
  [{"title": "Project Name", "price": "₹65L", "address": "Detailed Area", "sourceUrl": "verified link", "bhk": "${req.bhk}", "pincode": "${req.pincode}"}]`;
  
  const { text, groundingSources } = await callLLMWithFallback(prompt, { 
    tools: [{ googleSearch: {} }], 
    temperature: 0.1 
  });
  
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
    valuationJustification: `Based on ${listings.length} verified listings in ${req.area}, ${req.pincode} scraped via resilient AI nodes.`,
    insights: [{ title: "Live Pulse", description: `Active demand for ${req.bhk} detected in ${req.area}.`, type: "trend" }],
    groundingSources: groundingSources || []
  };
}

export async function getRentAnalysis(req: RentRequest): Promise<RentResult> {
  const prompt = `
    Search for 5 REAL rental listings for ${req.bhk} in ${req.area}, ${req.city}, ${req.pincode}.
    STRICT JSON OUTPUT:
    {
      "rentalValue": "₹45,000",
      "yieldPercentage": "3.2%",
      "rentOutAlert": "High Demand",
      "depositCalc": "3 Months",
      "negotiationScript": "Focus on long-term stability",
      "marketSummary": "Steady growth in IT corridors",
      "tenantDemandScore": 85,
      "confidenceScore": 90,
      "valuationJustification": "Analysis of current live listings",
      "listings": [ { "title": "Building Name", "rent": "₹35,000", "address": "Street Name", "sourceUrl": "link", "bhk": "2 BHK", "latitude": 19.0, "longitude": 72.8 } ]
    }
  `;
  const { text, groundingSources } = await callLLMWithFallback(prompt, { 
    tools: [{ googleSearch: {} }],
    temperature: 0.1 
  });
  
  const parsed = extractJsonFromText(text);
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
    Scrape and identify REAL land listings in ${req.area}, ${req.city}. Plot size: ${req.plotSize} ${req.unit}.
    Return strict JSON:
    {
      "landValue": "5.5 Cr",
      "perSqmValue": "45000 per ${req.unit}",
      "devROI": "15%",
      "negotiationStrategy": "Focus on FSI potential",
      "confidenceScore": 80,
      "zoningAnalysis": "Residential/Commercial Mixed",
      "valuationJustification": "Reasoning based on nearby transactions",
      "listings": [ { "title": "Plot in Sector 4", "price": "4 Cr", "size": "2000 sqft", "sourceUrl": "link" } ]
    }
  `;
  const { text } = await callLLMWithFallback(prompt, { tools: [{ googleSearch: {} }], temperature: 0.1 });
  const data = extractJsonFromText(text);
  
  const totalVal = parsePrice(data.landValue);
  const rateVal = parsePrice(data.perSqmValue);
  
  const expectedTotal = rateVal * req.plotSize;
  if (totalVal > expectedTotal * 1.5 || totalVal < expectedTotal * 0.5) {
    data.landValue = formatPrice(expectedTotal);
  }

  return { ...data, insights: [] };
}

const SYSTEM_PROMPT = `
You are QuantCasa Property Expert, specialized in Indian Real Estate 2026.
You are currently operating in {intent} mode.
Asset Context: {contextResult}

IMPORTANT FORMATTING RULES:
1. If intent is INTERIOR, you MUST PROVIDE response in EXACTLY THIS FORMAT:
   HIGHLIGHT:: [A single, bold design summary or concept tip]
   DETAIL:: [A thorough, professional explanation of the design choices, materials, and aesthetic impact]

2. Otherwise, respond in plain text only. No markdown formatting.
3. Be concise and professional.
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
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch { return null; }
};
