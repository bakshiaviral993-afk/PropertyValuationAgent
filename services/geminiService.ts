
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { 
  BuyRequest, BuyResult, 
  RentRequest, RentResult, 
  LandRequest, LandResult
} from "../types";

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
          emiEstimate: { type: Type.STRING }
        },
        required: ["title", "price", "priceValue", "address", "sourceUrl", "bhk"]
      }
    }
  },
  required: ["fairValue", "valuationRange", "recommendation", "negotiationScript", "listings", "confidenceScore"]
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
  required: ["rentalValue", "yieldPercentage", "negotiationScript", "listings", "confidenceScore", "suggestRadiusExpansion", "propertiesFoundCount"]
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
  required: ["landValue", "perSqmValue", "devROI", "negotiationStrategy", "confidenceScore", "listings"]
};

export const getBuyAnalysis = async (data: any): Promise<BuyResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const isSell = data.age !== undefined;
  const role = isSell ? "Liquidator/Asset Appraiser" : "Chief Acquisition Strategist";
  const purchaseContext = data.purchaseType ? `Mode: ${data.purchaseType}. Possession: ${data.possessionStatus} (${data.possessionYear || 'Immediate'}).` : "";

  const prompt = `Act as ${role}. 
  Sector: ${data.address}, ${data.city} (${data.pincode}). 
  Spec: ${data.bhk}, ${data.sqft} sqft. ${purchaseContext}
  Target Value: ₹${data.expectedPrice}. 

  VALUATION VECTORS:
  1. SEARCH: Scan web for ${isSell ? 'resale' : 'new primary'} property rates in ${data.address}.
  2. POSSESSION RISK: If Under Construction/Upcoming, adjust valuation for RERA compliance and entry-point discount.
  3. COMPARABLES: Find listings under ${data.expectedPrice}.
  4. NEW VS RESALE: If 'New Booking', focus on builder credibility. If 'Resale', focus on asset age and maintenance.
  
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

  return JSON.parse(structResponse.text!) as BuyResult;
};

export const getRentAnalysis = async (data: RentRequest): Promise<RentResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const searchScope = data.forceExpandRadius ? "unlimited" : "5km max";

  const prompt = `Act as Rental Strategist. 
  Locality: ${data.address}, ${data.city}. 
  Subject: ${data.bhk}, ${data.sqft} sqft. 
  
  RADIUS LOGIC PROTOCOL:
  1. Search active listings within 2km-5km.
  2. If < 5 found, set 'suggestRadiusExpansion' to TRUE.
  3. Preference: ${searchScope}.
  
  Return JSON per RENT_SCHEMA.`;

  const searchResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', 
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] }
  });

  const structResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Structure this into valid RENT_SCHEMA JSON: ${searchResponse.text}`,
    config: { responseMimeType: "application/json", responseSchema: RENT_SCHEMA }
  });

  return JSON.parse(structResponse.text!) as RentResult;
};

export const getLandValuationAnalysis = async (data: LandRequest): Promise<LandResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Act as Expert Land Valuer. Plot: ${data.plotSize} ${data.unit} in ${data.address}, ${data.city}.
  Facing: ${data.facing}, FSI: ${data.fsi}, Potential: ${data.devPotential}, Approvals: ${data.approvals}.

  Search active land plots in ${data.address} via web grounding. 
  Return JSON per LAND_SCHEMA.`;

  const searchResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', 
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] }
  });

  const structResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Translate land analysis into valid LAND_SCHEMA JSON: ${searchResponse.text}`,
    config: { responseMimeType: "application/json", responseSchema: LAND_SCHEMA }
  });

  return JSON.parse(structResponse.text!) as LandResult;
};
