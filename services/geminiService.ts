
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { 
  BuyRequest, BuyResult, 
  RentRequest, RentResult, 
  LandRequest, LandResult
} from "../types";

/**
 * Validates and returns the API key from environment.
 * Prevents initialization with invalid or missing keys.
 */
const getValidatedApiKey = (): string => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null' || apiKey.trim() === '') {
    const errorMsg = "CRITICAL: process.env.API_KEY is missing or invalid. Check Vercel Environment Variables.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  return apiKey;
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
    valuationJustification: { type: Type.STRING, description: "Detailed logic and market rationale for this valuation." },
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
    valuationJustification: { type: Type.STRING, description: "Rationale for the suggested rent based on local demand and inventory." },
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
          qualityScore: { type: Type.NUMBER }
        },
        required: ["title", "rent", "address", "sourceUrl", "bhk"]
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
    valuationJustification: { type: Type.STRING, description: "Expert explanation of land value based on FSI and zoning." },
    listings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          price: { type: Type.STRING },
          size: { type: Type.STRING },
          address: { type: Type.STRING },
          sourceUrl: { type: Type.STRING }
        },
        required: ["title", "price", "size", "address", "sourceUrl"]
      }
    }
  },
  required: ["landValue", "perSqmValue", "devROI", "negotiationStrategy", "confidenceScore", "listings", "valuationJustification"]
};

export const getBuyAnalysis = async (data: any): Promise<BuyResult> => {
  const apiKey = getValidatedApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  const isSell = data.age !== undefined;
  const role = isSell ? "Liquidator/Asset Appraiser" : "Chief Acquisition Strategist";
  
  const prompt = `Act as ${role}. Sector: ${data.address}, ${data.city} (${data.pincode}). Spec: ${data.bhk}, ${data.sqft} sqft.
  TASK:
  1. Provide market valuation and justification logic.
  2. Ground results in real-world web data.
  3. Every listing MUST have precise latitude/longitude coordinates.
  Return JSON per BUY_SCHEMA.`;

  const searchResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', 
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] }
  });

  const structResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Translate to BUY_SCHEMA JSON: ${searchResponse.text}`,
    config: { responseMimeType: "application/json", responseSchema: BUY_SCHEMA }
  });

  if (!structResponse.text) throw new Error("QuantCore: Analysis synthesis failed.");
  return JSON.parse(structResponse.text) as BuyResult;
};

export const getRentAnalysis = async (data: RentRequest): Promise<RentResult> => {
  const apiKey = getValidatedApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Act as Rental Strategist. Locality: ${data.address}, ${data.city}. 
  Estimate rent and yield. Return JSON per RENT_SCHEMA.`;

  const searchResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', 
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] }
  });

  const structResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Structure into RENT_SCHEMA JSON: ${searchResponse.text}`,
    config: { responseMimeType: "application/json", responseSchema: RENT_SCHEMA }
  });

  if (!structResponse.text) throw new Error("QuantCore: Rental reconnaissance failed.");
  return JSON.parse(structResponse.text) as RentResult;
};

export const getLandValuationAnalysis = async (data: LandRequest): Promise<LandResult> => {
  const apiKey = getValidatedApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Act as Expert Land Valuer. Plot: ${data.plotSize} ${data.unit} in ${data.address}, ${data.city}.
  Analyze FSI and dev potential. Return JSON per LAND_SCHEMA.`;

  const searchResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', 
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] }
  });

  const structResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Translate to LAND_SCHEMA JSON: ${searchResponse.text}`,
    config: { responseMimeType: "application/json", responseSchema: LAND_SCHEMA }
  });

  if (!structResponse.text) throw new Error("QuantCore: Geographic plot appraisal failed.");
  return JSON.parse(structResponse.text) as LandResult;
};
