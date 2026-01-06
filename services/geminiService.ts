
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

export const getBuyAnalysis = async (data: BuyRequest): Promise<BuyResult> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key configuration error. Please check environment variables.");

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `Perform a deep real estate analysis for ${data.bhk} apartment in ${data.area}, ${data.city}.
    Pincode: ${data.pincode}. Total area: ${data.sqft} sqft.
    Search for verified listings and market trends.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { 
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fairValue: { type: Type.STRING, description: "e.g. ₹1.5 Cr" },
            valuationRange: { type: Type.STRING, description: "e.g. ₹1.4 - 1.6 Cr" },
            recommendation: { type: Type.STRING, description: "Must be one of: Good Buy, Fair Price, Overpriced" },
            negotiationScript: { type: Type.STRING },
            marketSentiment: { type: Type.STRING, description: "A single descriptive string about the market vibe." },
            sentimentScore: { type: Type.NUMBER, description: "0 to 100" },
            registrationEstimate: { type: Type.STRING },
            appreciationPotential: { type: Type.STRING, description: "e.g. 5-7% annually" },
            confidenceScore: { type: Type.NUMBER },
            valuationJustification: { type: Type.STRING },
            neighborhoodScore: {
              type: Type.OBJECT,
              properties: {
                overall: { type: Type.NUMBER },
                walkability: { type: Type.NUMBER },
                grocery: { type: Type.NUMBER },
                parks: { type: Type.NUMBER },
                safety: { type: Type.NUMBER },
                connectivity: { type: Type.NUMBER }
              }
            },
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  type: { type: Type.STRING, description: "positive, development, or trend" }
                }
              }
            },
            listings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  price: { type: Type.STRING },
                  address: { type: Type.STRING },
                  sourceUrl: { type: Type.STRING },
                  bhk: { type: Type.STRING },
                  latitude: { type: Type.NUMBER },
                  longitude: { type: Type.NUMBER },
                  builderName: { type: Type.STRING },
                  societyName: { type: Type.STRING }
                }
              }
            }
          },
          required: ["fairValue", "valuationRange", "recommendation", "listings", "marketSentiment", "sentimentScore"]
        }
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({ uri: chunk.web.uri, title: chunk.web.title }));

    const text = response.text;
    if (!text) throw new Error("Empty response from intelligence node.");
    
    const parsed = JSON.parse(text.trim());
    return { ...parsed, groundingSources: sources };
  } catch (err: any) {
    console.error("Valuation Engine Error:", err);
    throw new Error(err.message || "Valuation engine encountered a sync error.");
  }
};

export const getRentAnalysis = async (data: RentRequest): Promise<RentResult> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key required.");
  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Analyze monthly rent for ${data.bhk} in ${data.area}, ${data.city}. Pincode: ${data.pincode}.`;

    const res = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { 
        tools: [{ googleSearch: {} }], 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rentalValue: { type: Type.STRING },
            yieldPercentage: { type: Type.STRING },
            rentOutAlert: { type: Type.STRING },
            depositCalc: { type: Type.STRING },
            negotiationScript: { type: Type.STRING },
            marketSummary: { type: Type.STRING },
            tenantDemandScore: { type: Type.NUMBER },
            confidenceScore: { type: Type.NUMBER },
            valuationJustification: { type: Type.STRING },
            propertiesFoundCount: { type: Type.NUMBER },
            listings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  rent: { type: Type.STRING },
                  address: { type: Type.STRING },
                  sourceUrl: { type: Type.STRING },
                  bhk: { type: Type.STRING },
                  latitude: { type: Type.NUMBER },
                  longitude: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    });

    const groundingChunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({ uri: chunk.web.uri, title: chunk.web.title }));

    const parsed = JSON.parse(res.text?.trim() || '{}');
    return { ...parsed, groundingSources: sources };
  } catch (err) {
    throw new Error("Rental data sync failed.");
  }
};

export const getLandValuationAnalysis = async (data: LandRequest): Promise<LandResult> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key required.");
  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Land plot valuation in ${data.address}, ${data.city}. Plot size: ${data.plotSize} ${data.unit}. FSI: ${data.fsi}.`;

    const res = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { 
        tools: [{ googleSearch: {} }], 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            landValue: { type: Type.STRING },
            perSqmValue: { type: Type.STRING },
            devROI: { type: Type.STRING },
            negotiationStrategy: { type: Type.STRING },
            confidenceScore: { type: Type.NUMBER },
            zoningAnalysis: { type: Type.STRING },
            valuationJustification: { type: Type.STRING },
            listings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  price: { type: Type.STRING },
                  size: { type: Type.STRING },
                  address: { type: Type.STRING },
                  sourceUrl: { type: Type.STRING },
                  latitude: { type: Type.NUMBER },
                  longitude: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    });
    
    return JSON.parse(res.text?.trim() || '{}');
  } catch (err) {
    throw new Error("Land intelligence node timed out.");
  }
};

export const generatePropertyImage = async (prompt: string): Promise<string | null> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Professional architectural photo of ${prompt}. Modern, wide angle, 4k.` }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    return null;
  } catch (err) {
    return null;
  }
};
