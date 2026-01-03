import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ValuationRequest, ValuationResult, RentRequest, RentResult, RentalListing } from "../types";
import { vectorService } from "./vectorDb";

const VALUATION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    estimatedValue: { type: Type.NUMBER },
    pricePerSqft: { type: Type.NUMBER },
    rangeLow: { type: Type.NUMBER },
    rangeHigh: { type: Type.NUMBER },
    confidenceScore: { type: Type.NUMBER },
    locationScore: { type: Type.NUMBER },
    sentimentScore: { type: Type.NUMBER },
    sentimentAnalysis: { type: Type.STRING },
    comparables: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          projectName: { type: Type.STRING },
          price: { type: Type.NUMBER },
          area: { type: Type.NUMBER },
          bhk: { type: Type.STRING },
          pricePerSqft: { type: Type.NUMBER },
          latitude: { type: Type.NUMBER },
          longitude: { type: Type.NUMBER }
        },
        required: ["projectName", "price", "area", "bhk", "pricePerSqft", "latitude", "longitude"]
      }
    },
    valuationJustification: { type: Type.STRING },
    propertyStatus: { type: Type.STRING }
  },
  required: [
    "estimatedValue", "pricePerSqft", "rangeLow", "rangeHigh",
    "confidenceScore", "locationScore", "sentimentScore",
    "comparables", "valuationJustification", "propertyStatus"
  ]
};

const RENT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    averageRent: { type: Type.STRING },
    marketSummary: { type: Type.STRING },
    negotiationStrategy: { type: Type.STRING },
    depositEstimate: { type: Type.STRING },
    maintenanceEstimate: { type: Type.STRING },
    relocationExpenses: { type: Type.STRING },
    radiusUsed: { type: Type.STRING },
    expertVerdict: {
      type: Type.OBJECT,
      properties: {
        justifiedPrice: { type: Type.STRING },
        maxThreshold: { type: Type.STRING },
        whyJustified: { type: Type.STRING },
        whyNoMoreThan: { type: Type.STRING }
      },
      required: ["justifiedPrice", "maxThreshold", "whyJustified", "whyNoMoreThan"]
    },
    premiumDrivers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          feature: { type: Type.STRING },
          impact: { type: Type.STRING }
        },
        required: ["feature", "impact"]
      }
    },
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
        required: ["title", "rent", "address", "sourceUrl", "bhk", "qualityScore"]
      }
    }
  },
  required: [
    "averageRent", "marketSummary", "negotiationStrategy", 
    "depositEstimate", "maintenanceEstimate", "relocationExpenses", 
    "listings", "radiusUsed", "expertVerdict", "premiumDrivers"
  ]
};

const verifyDeepLink = (urlStr: string): boolean => {
  try {
    const url = new URL(urlStr);
    const path = url.pathname.toLowerCase();
    const genericPaths = ['/rent', '/flats-for-rent', '/residential-rent', '/properties-for-rent', '/index.html', '/flats-in-'];
    if (genericPaths.some(p => path === p || path === p + '/')) return false;
    if (path.length < 15) return false;
    if (url.hostname.includes('housing.com')) return /-p[0-9]+$/i.test(path);
    if (url.hostname.includes('nobroker.in')) return path.includes('/property/') || /[0-9a-f]{20,}/i.test(path);
    if (url.hostname.includes('magicbricks.com')) return path.includes('propertydetails');
    if (url.hostname.includes('99acres.com')) return path.includes('-npid-') || path.length > 50;
    return path.split('/').length > 2;
  } catch {
    return false;
  }
};

export const getValuationAnalysis = async (data: ValuationRequest): Promise<ValuationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Act as Lead Property Analyst. Subject: ${data.area}, ${data.city}. Analyze market trends and provide 3 comparable listings with estimated coordinates. Property specs: ${data.superBuiltUpArea} sqft, ${data.bhk}.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: VALUATION_SCHEMA }
  });
  return JSON.parse(response.text!) as ValuationResult;
};

export const getRentAnalysis = async (data: RentRequest): Promise<RentResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const scanLogs: string[] = ["Activating Research Wing Analysis...", "Establishing Lead Tester Security Layer..."];
  let currentRadius = 2;
  let attempts = 0;
  let finalResult: RentResult | null = null;

  while (attempts < 3) {
    scanLogs.push(`Precision Scan Initialized: Radius ${currentRadius}km around ${data.area}.`);
    const searchPrompt = `LEAD TESTER & MARKET EXPERT PROTOCOL: 
    Find 5 current rental listings for ${data.bhk} in ${data.area}, ${data.city} (Radius: ${currentRadius}km).
    STRICT URL GATE: Only direct property detail pages.
    Specifically identify:
    1. Property age trends in this sector.
    2. Premium amenities available (Swimming pool, Clubhouse, Automation).
    3. Distance from key landmarks (IT Parks, Metros, Schools).
    Explain why the current price is justified or inflated.`;

    const searchResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: searchPrompt,
      config: { tools: [{ googleSearch: {} }] }
    });

    const extractionPrompt = `
      Analyze findings: "${searchResponse.text}"
      Radius: ${currentRadius}km in ${data.area}, ${data.city}. Target: ${data.bhk}.
      
      ACT AS A PROFESSIONAL MARKET APPRAISER:
      - justifiedPrice: Based on property age and landmark proximity, what IS the fair monthly rent?
      - maxThreshold: What is the absolute "Do Not Pay More" limit?
      - whyJustified: Explain why the 'justifiedPrice' is fair (list 3 specific factors like age, school proximity, road access).
      - whyNoMoreThan: List deal-breakers or diminishing returns (e.g., "Lack of dedicated parking", "Old construction").
      - premiumDrivers: Array of objects {feature: string, impact: string} (e.g., {feature: "Metro Proximity", impact: "+15%"}).
      - marketSummary: Concise overview.
      - averageRent: Overall market average for current listings.
      - maintenanceEstimate: Society charges.
      - depositEstimate: Typical security deposit.
      - relocationExpenses: One-time cost estimate.
      
      Structure into JSON according to RENT_SCHEMA.
    `;

    const structResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: extractionPrompt,
      config: { responseMimeType: "application/json", responseSchema: RENT_SCHEMA }
    });

    const candidate = JSON.parse(structResponse.text!) as RentResult;
    const verifiedListings = candidate.listings.filter(listing => verifyDeepLink(listing.sourceUrl));
    
    if (verifiedListings.length >= 2 || attempts === 2) {
      scanLogs.push(`Signal Stabilized. Negotiation Matrix Prepared.`);
      finalResult = { ...candidate, listings: verifiedListings, scanLogs, radiusUsed: `${currentRadius}km` };
      break;
    } else {
      scanLogs.push(`Signal Low. Expanding Dynamic Radius to ${currentRadius + 3}km...`);
      currentRadius += 3;
      attempts++;
    }
  }

  if (!finalResult) throw new Error("Intelligence wing could not stabilize the data cluster.");

  try {
    const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${data.area}, ${data.city}`)}&format=json&limit=1`);
    const geoData = await geoResponse.json();
    if (geoData.length > 0) {
      finalResult.latitude = parseFloat(geoData[0].lat);
      finalResult.longitude = parseFloat(geoData[0].lon);
    }
  } catch (e) {}

  return finalResult;
};