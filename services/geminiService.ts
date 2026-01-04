
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { 
  BuyRequest, BuyResult, 
  RentRequest, RentResult, 
  LandRequest, LandResult
} from "../types";

/**
 * Safely retrieves the API key.
 * The key is injected by the platform into process.env.API_KEY.
 */
const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key || key === 'undefined' || key === 'null') {
    throw new Error("API_KEY_MISSING: Neural Link requires an active API key in the environment.");
  }
  return key;
};

const BUY_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    fairValue: { type: Type.STRING },
    valuationRange: { type: Type.STRING },
    recommendation: { type: Type.STRING, enum: ['Good Buy', 'Fair Price', 'Overpriced'] },
    negotiationScript: { type: Type.STRING },
    marketSentiment: { type: Type.STRING },
    registrationEstimate: { type: Type.STRING },
    appreciationPotential: { type: Type.STRING },
    confidenceScore: { type: Type.NUMBER },
    valuationJustification: { type: Type.STRING },
    listings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          price: { type: Type.STRING },
          priceValue: { type: Type.NUMBER },
          address: { type: Type.STRING },
          sourceUrl: { type: Type.STRING },
          bhk: { type: Type.STRING },
          emiEstimate: { type: Type.STRING },
          latitude: { type: Type.NUMBER },
          longitude: { type: Type.NUMBER }
        },
        required: ["title", "price", "priceValue", "address", "sourceUrl", "bhk", "latitude", "longitude"]
      }
    }
  },
  required: ["fairValue", "valuationRange", "recommendation", "negotiationScript", "listings", "confidenceScore", "valuationJustification"]
};

const RENT_SCHEMA: Schema = {
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
    suggestRadiusExpansion: { type: Type.BOOLEAN },
    propertiesFoundCount: { type: Type.NUMBER },
    valuationJustification: { type: Type.STRING },
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
          qualityScore: { type: Type.NUMBER },
          latitude: { type: Type.NUMBER },
          longitude: { type: Type.NUMBER }
        },
        required: ["title", "rent", "address", "sourceUrl", "bhk", "latitude", "longitude"]
      }
    }
  },
  required: ["rentalValue", "yieldPercentage", "negotiationScript", "listings", "confidenceScore", "suggestRadiusExpansion", "propertiesFoundCount", "valuationJustification"]
};

const LAND_SCHEMA: Schema = {
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
        },
        required: ["title", "price", "size", "address", "sourceUrl", "latitude", "longitude"]
      }
    }
  },
  required: ["landValue", "perSqmValue", "devROI", "negotiationStrategy", "confidenceScore", "listings", "valuationJustification"]
};

export const getBuyAnalysis = async (data: BuyRequest): Promise<BuyResult> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const prompt = `Act as Chief Real Estate Strategist. Analyze property in ${data.address}, ${data.city} (${data.pincode}). 
  Spec: ${data.bhk}, ${data.sqft} sqft. Type: ${data.purchaseType}.
  1. Provide market valuation and detailed rationale.
  2. Ground results in real-world live web data via search.
  3. Every listing must have precise latitude/longitude.
  4. Ensure priceValue is an integer representing the price in INR.`;

  const searchResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', 
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] }
  });

  const structResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Structure the following real estate analysis into valid BUY_SCHEMA JSON: ${searchResponse.text}`,
    config: { 
      responseMimeType: "application/json", 
      responseSchema: BUY_SCHEMA 
    }
  });

  if (!structResponse.text) throw new Error("QuantCore: Failed to structure market intelligence.");
  return JSON.parse(structResponse.text) as BuyResult;
};

export const getRentAnalysis = async (data: RentRequest): Promise<RentResult> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  const prompt = `Act as Rental Market Strategist. Locality: ${data.address}, ${data.city}. 
  Configuration: ${data.bhk}, ${data.sqft} sqft.
  1. Estimate monthly rent and annual yield. 
  2. Ground results in real-world data from the web. 
  3. Every property MUST have latitude/longitude.`;

  const searchResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', 
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] }
  });

  const structResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Translate the following market data into RENT_SCHEMA JSON: ${searchResponse.text}`,
    config: { 
      responseMimeType: "application/json", 
      responseSchema: RENT_SCHEMA 
    }
  });

  if (!structResponse.text) throw new Error("QuantCore: Rental reconnaissance synthesis failed.");
  return JSON.parse(structResponse.text) as RentResult;
};

export const getLandValuationAnalysis = async (data: LandRequest): Promise<LandResult> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  const prompt = `Act as Senior Land Valuer. Plot: ${data.plotSize} ${data.unit} in ${data.address}, ${data.city}.
  FSI Context: ${data.fsi}. Potential: ${data.devPotential}.
  1. Analyze land value and dev potential using live web grounding.
  2. Every listing found must include GPS coordinates.`;

  const searchResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', 
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] }
  });

  const structResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Structure the following land appraisal into LAND_SCHEMA JSON: ${searchResponse.text}`,
    config: { 
      responseMimeType: "application/json", 
      responseSchema: LAND_SCHEMA 
    }
  });

  if (!structResponse.text) throw new Error("QuantCore: Geographic plot appraisal failed.");
  return JSON.parse(structResponse.text) as LandResult;
};
