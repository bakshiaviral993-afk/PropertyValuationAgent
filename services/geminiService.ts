
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { 
  BuyRequest, BuyResult, 
  RentRequest, RentResult, 
  LandRequest, LandResult,
  GroundingSource,
  SaleListing,
  RentalListing,
  LandListing
} from "../types";

const getApiKey = (): string | null => {
  const key = process.env.API_KEY;
  if (!key || key === 'undefined' || key === 'null' || key.trim() === '' || key === 'YOUR_API_KEY') {
    return null;
  }
  return key;
};

/**
 * Generates a photorealistic architectural visualization for a property.
 */
export const generatePropertyImage = async (prompt: string): Promise<string | null> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Photorealistic high-end architectural photography of: ${prompt}. Cinematic lighting, 8k resolution, professional real estate photography style.` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (err) {
    console.error("Image Generation Signal Failure:", err);
    return null;
  }
};

// --- SCHEMAS ---
const BUY_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    fairValue: { type: Type.STRING, description: "Total sale price in Cr or Lakhs" },
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
      description: "ONLY property listings that are FOR SALE. EXCLUDE RENTALS.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          price: { type: Type.STRING, description: "Total sale price (e.g. 1.5 Cr)" },
          priceValue: { type: Type.NUMBER, description: "Numeric total value in INR" },
          address: { type: Type.STRING },
          sourceUrl: { type: Type.STRING },
          bhk: { type: Type.STRING },
          emiEstimate: { type: Type.STRING },
          latitude: { type: Type.NUMBER },
          longitude: { type: Type.NUMBER },
          facing: { type: Type.STRING }
        },
        required: ["title", "price", "priceValue", "address", "sourceUrl", "bhk", "latitude", "longitude", "facing"]
      }
    }
  },
  required: ["fairValue", "valuationRange", "recommendation", "negotiationScript", "listings", "confidenceScore", "valuationJustification"]
};

const RENT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    rentalValue: { type: Type.STRING, description: "Monthly rent (e.g. 45k/mo)" },
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
      description: "ONLY property listings that are FOR RENT. EXCLUDE FOR-SALE PROPERTIES.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          rent: { type: Type.STRING, description: "Monthly rent amount" },
          address: { type: Type.STRING },
          sourceUrl: { type: Type.STRING },
          bhk: { type: Type.STRING },
          qualityScore: { type: Type.NUMBER },
          latitude: { type: Type.NUMBER },
          longitude: { type: Type.NUMBER },
          facing: { type: Type.STRING }
        },
        required: ["title", "rent", "address", "sourceUrl", "bhk", "latitude", "longitude", "facing"]
      }
    }
  },
  required: ["rentalValue", "yieldPercentage", "listings", "confidenceScore", "valuationJustification"]
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
          longitude: { type: Type.NUMBER },
          facing: { type: Type.STRING }
        },
        required: ["title", "price", "size", "address", "sourceUrl", "latitude", "longitude", "facing"]
      }
    }
  },
  required: ["landValue", "perSqmValue", "listings", "confidenceScore", "valuationJustification"]
};

// --- FALLBACK MOCK GENERATORS ---

const generateMockBuy = (data: BuyRequest): BuyResult => {
  const sqft = Number(data.sqft) || 1200;
  const city = data.city || 'Mumbai';
  const baseRate = city.toLowerCase().includes('mumbai') ? 22000 : 7500;
  const isPremiumFacing = data.facing === 'East' || data.facing === 'North';
  const facingMultiplier = isPremiumFacing ? 1.12 : 1.0;
  const priceBase = sqft * baseRate * facingMultiplier;
  
  const listings: SaleListing[] = Array.from({ length: 8 }).map((_, i) => ({
    title: `${i % 2 === 0 ? 'Emerald' : 'Sapphire'} Heights ${data.bhk} ${i + 1}`,
    price: `₹${((priceBase * (0.95 + i * 0.05)) / 10000000).toFixed(2)} Cr`,
    priceValue: priceBase * (0.95 + i * 0.05),
    address: `${data.address}, ${data.city}`,
    sourceUrl: "https://www.99acres.com",
    bhk: data.bhk,
    emiEstimate: `₹${Math.round((priceBase * 0.007) / 1000)}K/mo`,
    latitude: 18.9219 + (Math.random() * 0.04 - 0.02),
    longitude: 72.8347 + (Math.random() * 0.04 - 0.02),
    facing: isPremiumFacing ? data.facing : (i % 2 === 0 ? 'East' : 'West')
  }));

  return {
    fairValue: `₹${(priceBase / 10000000).toFixed(2)} Cr`,
    valuationRange: `₹${(priceBase * 0.95 / 10000000).toFixed(2)}Cr - ₹${(priceBase * 1.05 / 10000000).toFixed(2)}Cr`,
    recommendation: 'Fair Price',
    negotiationScript: `Leverage orientation as a negotiation pivot.`,
    marketSentiment: "Stable",
    registrationEstimate: `₹${(priceBase * 0.06 / 100000).toFixed(1)} Lakhs`,
    appreciationPotential: "8-12% YoY",
    confidenceScore: 85,
    valuationJustification: `Mock valuation based on ${city} standard rates.`,
    listings
  };
};

export const getBuyAnalysis = async (data: BuyRequest): Promise<BuyResult> => {
  const apiKey = getApiKey();
  if (!apiKey) return generateMockBuy(data);

  try {
    const ai = new GoogleGenAI({ apiKey });
    // Explicitly searching for SALE properties to prevent rent leakage
    const searchPrompt = `LATEST PROPERTIES FOR SALE: ${data.bhk} apartments in ${data.address}, ${data.city}. Facing: ${data.facing}. CARPET AREA: ${data.sqft} sqft. PROVIDE MARKET SALE PRICES (CR/LAKH), NOT RENTAL RATES.`;
    
    const searchResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: searchPrompt,
      config: { tools: [{ googleSearch: {} }] }
    });

    const structResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Synthesize a Sale Valuation report for ${data.address} based on this intel: ${searchResponse.text}. 
      CRITICAL RULE: ONLY include for-sale property listings. DO NOT include rentals or lease properties. 
      Ensure 'fairValue' and 'listings.price' are total asset values (e.g. 2.1 Cr), NOT monthly rent.`,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: BUY_SCHEMA 
      }
    });

    return JSON.parse(structResponse.text || '{}') as BuyResult;
  } catch (err) {
    return generateMockBuy(data);
  }
};

export const getRentAnalysis = async (data: RentRequest): Promise<RentResult> => {
  const apiKey = getApiKey();
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey || "" });
    // Explicitly searching for RENT properties to prevent sale price leakage
    const searchPrompt = `LATEST PROPERTIES FOR RENT: ${data.bhk} apartments in ${data.address}, ${data.city}. Facing: ${data.facing}. CARPET AREA: ${data.sqft} sqft. PROVIDE MONTHLY RENTAL RATES (INR), NOT SALE PRICES.`;
    
    const searchResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: searchPrompt,
      config: { tools: [{ googleSearch: {} }] }
    });

    const structResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Synthesize a Rental Intel report based on this data: ${searchResponse.text}. 
      CRITICAL RULE: ONLY include monthly rental listings. DO NOT include for-sale properties or multi-crore asset prices. 
      Ensure 'rentalValue' and 'listings.rent' are monthly amounts (e.g. 55,000/mo).`,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: RENT_SCHEMA 
      }
    });

    return JSON.parse(structResponse.text || '{}') as RentResult;
  } catch (err) {
    return {
      rentalValue: "₹45,000/mo",
      yieldPercentage: "3.5%",
      confidenceScore: 70,
      valuationJustification: "Mock rent analysis due to signal disruption.",
      listings: [],
      suggestRadiusExpansion: false,
      propertiesFoundCount: 0,
      negotiationScript: "Standard market lease terms apply.",
      depositCalc: "Standard 6-month deposit recommended.",
      marketSummary: "Stable demand in this sector.",
      tenantDemandScore: 75
    } as RentResult;
  }
};

export const getLandValuationAnalysis = async (data: LandRequest): Promise<LandResult> => {
  const apiKey = getApiKey();
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey || "" });
    const searchPrompt = `Land prices in ${data.address}, ${data.city} for ${data.plotSize} ${data.unit}.`;
    const searchResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: searchPrompt,
      config: { tools: [{ googleSearch: {} }] }
    });

    const structResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Synthesize land JSON based on: ${searchResponse.text}`,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: LAND_SCHEMA 
      }
    });

    return JSON.parse(structResponse.text || '{}') as LandResult;
  } catch (err) {
    return {
      landValue: "₹2.5 Cr",
      perSqmValue: "₹15,000",
      confidenceScore: 65,
      valuationJustification: "Mock land analysis.",
      listings: [],
      devROI: "15-20% Projection",
      negotiationStrategy: "Focus on FSI potential.",
      zoningAnalysis: "Residential Zoning detected."
    } as LandResult;
  }
};
