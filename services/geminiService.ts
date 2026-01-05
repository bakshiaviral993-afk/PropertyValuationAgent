
import { GoogleGenAI, Type } from "@google/genai";
import { 
  BuyRequest, BuyResult, 
  RentRequest, RentResult, 
  LandRequest, LandResult,
  GroundingSource
} from "../types";

const getApiKey = (): string | null => {
  const key = process.env.API_KEY;
  return (!key || key === 'undefined' || key.trim() === '') ? null : key;
};

/**
 * Enhanced analysis with deeper search grounding for builder and complex names.
 * Uses gemini-3-pro-preview for high-quality search processing.
 */
export const getBuyAnalysis = async (data: BuyRequest): Promise<BuyResult> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key required for live valuation.");

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Step 1: Broad search for specific project intelligence
    const searchQuery = `Current real estate transactions and listings for ${data.bhk} in ${data.area}, ${data.city} (Pincode: ${data.pincode}). 
    Find actual building names, society complexes, and prominent builders active in this locality. 
    Analyze market sentiment (bullish, stable, or bearish) based on recent news and price trends in ${data.area}.
    Need precise latitude/longitude coordinates for these projects.`;

    const searchResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: searchQuery,
      config: { tools: [{ googleSearch: {} }] }
    });

    const groundingChunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({ uri: chunk.web.uri, title: chunk.web.title }));

    // Step 2: Structured generation using Flash for low latency extraction
    const struct = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on this intelligence data: ${searchResponse.text}. 
      Generate a comprehensive JSON valuation for ${data.bhk} (${data.sqft} sqft) in ${data.area}, ${data.city}.
      
      Requirements:
      - fairValue: String (e.g. ₹1.5 Cr)
      - valuationRange: String (e.g. ₹1.4 - 1.7 Cr)
      - listings: Minimum 5 REAL examples from search. Strictly include "societyName" and "builderName" for each.
      - insights: 4 objects {title, description, type: positive/development/trend}
      - neighborhoodScore: overall, walkability, grocery, parks, safety, connectivity (0-100)
      - marketSentiment: Descriptive text (e.g. "Bullish due to Metro expansion")
      - sentimentScore: Number between 0 (Very Bearish) to 100 (Very Bullish)
      - negotiationScript: 2-3 sentences of tactical advice for the user to negotiate this specific area.
      - appreciationPotential: (e.g. "5-8% annual")
      - valuationJustification: Deep analysis of why this specific price point is identified.
      
      Response MUST be strictly valid JSON matching BuyResult interface.`,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 } // Faster processing for structured gen
      }
    });

    const parsed = JSON.parse(struct.text?.trim() || '{}');
    return { ...parsed, groundingSources: sources };
  } catch (err) {
    console.error("Buy Analysis Error:", err);
    throw err;
  }
};

export const getRentAnalysis = async (data: RentRequest): Promise<RentResult> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key required.");
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const searchRes = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Monthly rental market in ${data.area}, ${data.city} for ${data.bhk}. Find specific society names and builder developments with active rent listings. Pincode: ${data.pincode}.`,
      config: { tools: [{ googleSearch: {} }] }
    });

    const groundingChunks = searchRes.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({ uri: chunk.web.uri, title: chunk.web.title }));

    const structRes = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate RentResult JSON based on: ${searchRes.text}. Target: ${data.bhk} in ${data.area}.`,
      config: { responseMimeType: "application/json" }
    });
    
    const parsed = JSON.parse(structRes.text?.trim() || '{}');
    return { ...parsed, groundingSources: sources };
  } catch (err) {
    console.error("Rent Analysis Error:", err);
    throw err;
  }
};

export const getLandValuationAnalysis = async (data: LandRequest): Promise<LandResult> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key required.");
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const searchRes = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Land plot sales and valuations in ${data.address}, ${data.city}. Plot size: ${data.plotSize} ${data.unit}. Check FSI: ${data.fsi} development potential.`,
      config: { tools: [{ googleSearch: {} }] }
    });

    const structRes = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate LandResult JSON based on: ${searchRes.text}. Address: ${data.address}, ${data.city}.`,
      config: { responseMimeType: "application/json" }
    });
    
    return JSON.parse(structRes.text?.trim() || '{}');
  } catch (err) {
    console.error("Land Analysis Error:", err);
    throw err;
  }
};

export const generatePropertyImage = async (prompt: string): Promise<string | null> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `A high-end professional real estate exterior shot of ${prompt}. Sunny day, cinematic architectural photography, wide angle, 8k resolution.` }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    return null;
  } catch (err) {
    console.error("Image Gen Error:", err);
    return null;
  }
};
