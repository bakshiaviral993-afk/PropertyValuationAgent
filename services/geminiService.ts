
import { GoogleGenAI, Modality } from "@google/genai";
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

export const getBuyAnalysis = async (data: BuyRequest): Promise<BuyResult> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key required for live valuation.");

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const searchQuery = `Current real estate prices for ${data.bhk} flats in ${data.area}, ${data.city}. 
    Pincodes: ${data.pincode}. 
    Find specific listing examples with prices, exact building names (society name), builder names, and neighborhood insights (safety, parks, transport).
    Need latitude and longitude for mapping the listings.`;

    const searchResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: searchQuery,
      config: { tools: [{ googleSearch: {} }] }
    });

    const groundingChunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({ uri: chunk.web.uri, title: chunk.web.title }));

    const struct = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on this search data: ${searchResponse.text}. 
      Generate a JSON valuation report for a ${data.bhk} (${data.sqft} sqft) in ${data.area}, ${data.city}.
      
      Requirements:
      - fairValue: String (e.g. ₹1.5 Cr)
      - valuationRange: String (e.g. ₹1.4 - 1.7 Cr)
      - listings: 5+ real examples from search. For each listing, strictly include: 
          "title" (Project Name), 
          "societyName" (Complex Name), 
          "builderName" (Company that built it), 
          "price" (Current Ask), 
          "address", 
          "sourceUrl", 
          "latitude", 
          "longitude".
      - insights: 4 objects {title, description, type: positive/development/trend}
      - neighborhoodScore: overall, walkability, grocery, parks, safety, connectivity (0-100)
      - valuationJustification: 3-4 deep sentences explaining the logic.
      - marketSentiment: Brief summary of the current market vibe.
      - negotiationScript: A short script for the buyer to use during price negotiation.
      - appreciationPotential: (e.g. 5-7%)
      - confidenceScore: (80-99)
      
      Response must be valid JSON matching BuyResult.`,
      config: { responseMimeType: "application/json" }
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
      contents: `Monthly rent for ${data.bhk} in ${data.area}, ${data.city}. Pincodes: ${data.pincode}. Find real local listings with society and builder names.`,
      config: { tools: [{ googleSearch: {} }] }
    });

    const groundingChunks = searchRes.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({ uri: chunk.web.uri, title: chunk.web.title }));

    const structRes = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on this search data: ${searchRes.text}. Return RentResult JSON for ${data.bhk} in ${data.area}, ${data.city}.`,
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
      contents: `Land plot valuation in ${data.address}, ${data.city}. Size: ${data.plotSize} ${data.unit}. Search for recent sales or listings.`,
      config: { tools: [{ googleSearch: {} }] }
    });

    const structRes = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on this search data: ${searchRes.text}. Return LandResult JSON for plot in ${data.address}, ${data.city}.`,
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
      contents: { parts: [{ text: `A high quality professional architectural real estate photo of ${prompt}. Modern, bright, and appealing.` }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    return null;
  } catch (err) {
    console.error("Image Generation Error:", err);
    return null;
  }
};

export const getSpeech = async (text: string): Promise<string | null> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say with expert authority and confidence: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
          },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (err) {
    console.error("Speech Generation Error:", err);
    return null;
  }
};
