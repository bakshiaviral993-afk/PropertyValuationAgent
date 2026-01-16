// geminiService.ts
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
// Price parsing helpers (unchanged)
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

export function formatRent(val: number): string {
  if (val >= 10000000) return `₹${(val / 100000).toFixed(2)} L`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)} K`;
  return `₹${val.toLocaleString('en-IN')}`;
}

// Critical fix: Parse the LLM response properly
async function parseLLMResponse(raw: any): Promise<any> {
  try {
    if (raw.text && typeof raw.text === 'string') {
      const cleaned = raw.text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    }
    return raw;
  } catch (e) {
    console.error('LLM response parse failed:', e, raw);
    return { listings: [], fairValue: '₹0', note: 'Parse failed' };
  }
}

export async function getBuyAnalysis(req: BuyRequest): Promise<BuyResult> {
  const valuation = await getBuyValuation({
    city: req.city,
    area: req.area,
    pincode: req.pincode,
    propertyType: req.bhk,
    size: req.sqft,
    facing: req.facing,
    budget: (req as any).budget
  });
  const parsed = await parseLLMResponse(valuation);
  return {
    fairValue: formatPrice(valuation.estimatedValue || parsed.fairValue),
    valuationRange: `${formatPrice(valuation.rangeLow || 0)} - ${formatPrice(valuation.rangeHigh || 0)}`,
    recommendation: (valuation as any).recommendation || parsed.recommendation || 'Fair Price',
    negotiationScript: valuation.negotiationScript || parsed.negotiationScript || "Leverage market comps.",
    listings: parsed.listings || valuation.comparables || [],
    marketSentiment: (valuation as any).marketSentiment || 'Stable',
    sentimentScore: (valuation as any).sentimentScore || 80,
    registrationEstimate: valuation.registrationEstimate || formatPrice((valuation.estimatedValue || 0) * 0.07),
    appreciationPotential: valuation.appreciationPotential || parsed.appreciationPotential || "5-7% annually",
    confidenceScore: valuation.confidence === 'high' ? 92 : 75,
    valuationJustification: valuation.notes || parsed.note || "Grounded via intelligence layer.",
    insights: [{ title: "Area Pulse", description: `Detected active market activity in ${req.area}.`, type: "trend" }],
    groundingSources: valuation.groundingSources || [],
    source: valuation.source || parsed.source || 'unknown',
    isBudgetAlignmentFailure: valuation.isBudgetAlignmentFailure,
    suggestedMinimum: valuation.suggestedMinimum,
    learningSignals: valuation.learningSignals,
    notes: valuation.notes
  };
}

export async function getRentAnalysis(req: RentRequest): Promise<RentResult> {
  const valuation = await getRentValuationInternal({
    city: req.city,
    area: req.area,
    pincode: req.pincode,
    propertyType: req.bhk,
    size: req.sqft,
    budget: (req as any).budget
  });
  const parsed = await parseLLMResponse(valuation);
  return {
    rentalValue: formatRent(valuation.estimatedValue || parsed.fairValue),
    yieldPercentage: valuation.yieldPercentage || parsed.yieldPercentage || "3-4%",
    rentOutAlert: valuation.depositCalc || "Standard Deposit Apply",
    depositCalc: valuation.depositCalc || "3-6 Months",
    negotiationScript: valuation.negotiationScript || parsed.negotiationScript || "Focus on tenure stability.",
    marketSummary: valuation.notes || parsed.note || "Rental indices are stable.",
    tenantDemandScore: valuation.tenantDemandScore || 75,
    confidenceScore: valuation.confidence === 'high' ? 90 : 70,
    valuationJustification: valuation.valuationJustification || "Leasehold analysis complete.",
    propertiesFoundCount: valuation.comparables?.length || parsed.listings?.length || 0,
    listings: parsed.listings || valuation.comparables || [],
    insights: [],
    groundingSources: valuation.groundingSources || [],
    isBudgetAlignmentFailure: valuation.isBudgetAlignmentFailure,
    suggestedMinimum: valuation.suggestedMinimum,
    notes: valuation.notes
  };
}

export async function getLandValuationAnalysis(req: LandRequest): Promise<LandResult> {
  const valuation = await getLandValuationInternal({
    city: req.city,
    area: req.area,
    pincode: req.pincode,
    propertyType: "Plot",
    size: req.plotSize,
    budget: (req as any).budget
  });
  const parsed = await parseLLMResponse(valuation);
  return {
    landValue: formatPrice(valuation.estimatedValue || parsed.fairValue),
    perSqmValue: `₹${(valuation.pricePerUnit || 0).toLocaleString()} / sqyd`,
    devROI: (valuation as any).devROI || "15-20%",
    negotiationStrategy: valuation.negotiationScript || "Verify FSI utilization.",
    confidenceScore: valuation.confidence === 'high' ? 85 : 65,
    zoningAnalysis: valuation.notes || "Residential Use",
    valuationJustification: valuation.valuationJustification || "Plot node synced.",
    listings: parsed.listings || (valuation.comparables || []),
    insights: [],
    isBudgetAlignmentFailure: valuation.isBudgetAlignmentFailure,
    suggestedMinimum: valuation.suggestedMinimum
  };
}

export async function getCommercialAnalysis(req: CommercialRequest): Promise<CommercialResult> {
  const valuation = await getCommercialValuationInternal({
    city: req.city,
    area: req.area,
    pincode: req.pincode,
    propertyType: req.type,
    size: req.sqft
  });
  const parsed = await parseLLMResponse(valuation);
  const listings: CommercialListing[] = (parsed.listings || valuation.comparables || []).map((l: any) => ({
    title: l.title || "Commercial Hub",
    price: l.price,
    address: req.area,
    type: req.type,
    intent: req.intent,
    sourceUrl: l.sourceUrl || "https://www.99acres.com",
    sqft: l.sqft || req.sqft,
    latitude: l.latitude,
    longitude: l.longitude
  }));
  return {
    fairValue: req.intent === 'Buy' ? formatPrice(valuation.estimatedValue || parsed.fairValue) : formatRent(valuation.estimatedValue || parsed.fairValue),
    yieldPotential: valuation.yieldPercentage || parsed.yieldPercentage || "N/A",
    footfallScore: valuation.learningSignals || 70,
    businessInsights: valuation.notes || parsed.note || "Analyzed via commercial market node.",
    negotiationScript: valuation.negotiationScript || "Focus on lease fit-out periods.",
    confidenceScore: valuation.confidence === 'high' ? 95 : 75,
    listings,
    groundingSources: valuation.groundingSources || []
  };
}

// ────────────────────────────────────────────────
 // The missing function that caused the previous build failure — kept here
 // ────────────────────────────────────────────────
export async function resolveLocalityData(
  query: string,
  city: string,
  mode: 'localities' | 'pincode' = 'localities'
): Promise<string[]> {
  const prompt = mode === 'localities'
    ? `List 6 major residential localities/areas in ${city}, India. Output STRICT JSON ARRAY: ["Area 1", "Area 2"]`
    : `Search for the correct 6-digit PIN code of "${query}" in ${city}, India. Output STRICT JSON ARRAY of strings: ["411057"]`;

  try {
    const { text } = await callLLMWithFallback(prompt, { temperature: 0.1 });
    const cleanedText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error('resolveLocalityData failed:', e);
    return [];
  }
}

// ────────────────────────────────────────────────
 // Added missing functions for App.tsx and EssentialsDashboard (getEssentialsAnalysis, etc.)
 // ────────────────────────────────────────────────
export async function getEssentialsAnalysis(category: string, city: string, area: string): Promise<EssentialResult> {
  const prompt = `Find 5 real local business contacts for "${category}" in ${area}, ${city}. Output STRICT JSON: {"category": "${category}", "services": [{"name": string, "contact": string, "address": string, "rating": string, "distance": string, "isOpen": boolean, "sourceUrl": string}], "neighborhoodContext": string}`;
  const { text } = await callLLMWithFallback(prompt, { temperature: 0.1 });
  try {
    const cleanedText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { category, services: [], neighborhoodContext: "Search failed." };
  }
}

// ────────────────────────────────────────────────
 // Added missing functions from PropertyChat.tsx (askPropertyQuestion, generatePropertyImage, analyzeImageForHarmony)
 // ────────────────────────────────────────────────
export async function askPropertyQuestion(
  messages: ChatMessage[],
  contextResult?: any,
  lang: 'EN' | 'HI' = 'EN',
  intent: 'general' | 'vastu' | 'interior' | 'feng-shui' = 'general'
): Promise<string> {
  const sysPrompt = `You are the QuantCasa Expert AI. Intent: ${intent.toUpperCase()}. Respond in a structured, logical breakdown.
  - Tip: [Summary]
  - Details: [Bullet points]
  - Suggestions: [Interactive buttons]`;

  const lastMessage = messages[messages.length - 1]?.text || '';

  const { text } = await callLLMWithFallback(lastMessage, {
    systemInstruction: sysPrompt,
    temperature: 0.7,
    ...(contextResult && { context: contextResult })
  });

  return text;
}

export async function generatePropertyImage(prompt: string): Promise<string | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `High-res architectural render: ${prompt}. Cinematic realism.` }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (err) {
    console.error('Image generation failed:', err);
    return null;
  }
}

export async function analyzeImageForHarmony(base64Data: string, type: string): Promise<string> {
  const prompt = `Analyze this property image for 2026 trendy ${type} compliance. Detect spatial zones, energy flow, and architectural defects. Suggest trendy Biophilic improvements.
MANDATORY OUTPUT FORMAT:
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

// ────────────────────────────────────────────────
 // Added missing askCibilExpert (for CibilCoach.tsx)
 // ────────────────────────────────────────────────
export async function askCibilExpert(messages: ChatMessage[], currentScore: number): Promise<string> {
  const history = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
  const prompt = `QuantCasa Credit Health Expert. Score: ${currentScore}. History: ${history}. Ask one diagnostic question with OPTIONS: [O1, O2].`;

  const { text } = await callLLMWithFallback(messages[messages.length - 1]?.text || '', {
    systemInstruction: prompt,
    temperature: 0.7
  });

  return text;
}

// ────────────────────────────────────────────────
 // No duplicate export block — individual exports are sufficient
 // ────────────────────────────────────────────────
