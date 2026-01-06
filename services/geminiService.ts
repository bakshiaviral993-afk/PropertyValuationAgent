
import { GoogleGenAI, Type } from "@google/genai";
import { 
  BuyRequest, BuyResult, 
  RentRequest, RentResult, 
  LandRequest, LandResult,
  GroundingSource, ChatMessage
} from "../types";
import { callLLMWithFallback } from "./llmFallback";

/**
 * Extracts JSON from a string that might contain other text or markdown blocks.
 * Necessary because search grounding tools often prevent the model from outputting pure JSON.
 */
const extractJsonFromText = (text: string): any => {
  try {
    return JSON.parse(text.trim());
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("Failed to parse matched JSON block", e);
      }
    }
    throw new Error("Could not extract valid JSON from model response.");
  }
};

const runWithFallback = async (prompt: string, config: any): Promise<any> => {
  // IMPORTANT: Rules for Search/Maps Grounding:
  // responseMimeType and responseSchema are NOT allowed with googleSearch/googleMaps.
  const isGroundingUsed = config.tools?.some((t: any) => t.googleSearch || t.googleMaps);
  
  const optimizedConfig = { ...config };
  if (isGroundingUsed) {
    delete optimizedConfig.responseMimeType;
    delete optimizedConfig.responseSchema;
  }

  const { text, groundingSources } = await callLLMWithFallback(prompt, optimizedConfig);

  if (isGroundingUsed || config.responseMimeType === "application/json") {
    const parsed = extractJsonFromText(text);
    return { ...parsed, groundingSources: groundingSources || [] };
  }
  
  return text;
};

export const getBuyAnalysis = async (data: BuyRequest): Promise<BuyResult> => {
  const prompt = `
    Perform a professional real estate valuation scan for:
    Configuration: ${data.bhk}
    Locality: ${data.area}, ${data.city} (Pincode: ${data.pincode})
    Size: ${data.sqft} sqft
    Facing: ${data.facing || 'Not specified'}

    TASK: Use search to find current market listings and price trends.
    OUTPUT: Return ONLY a JSON object with: fairValue, valuationRange, recommendation, negotiationScript, marketSentiment, sentimentScore (0-100), registrationEstimate, appreciationPotential, confidenceScore (0-100), valuationJustification, and listings (array of objects with title, price, address, sourceUrl).
  `;
  
  return await runWithFallback(prompt, { tools: [{ googleSearch: {} }] });
};

export const getRentAnalysis = async (data: RentRequest): Promise<RentResult> => {
  const prompt = `
    Perform a rental yield analysis for:
    Configuration: ${data.bhk}
    Locality: ${data.area}, ${data.city}
    Size: ${data.sqft} sqft

    TASK: Use search for rental benchmarks.
    OUTPUT: Return ONLY a JSON object with: rentalValue, yieldPercentage, rentOutAlert, depositCalc, negotiationScript, marketSummary, tenantDemandScore, confidenceScore, valuationJustification, and listings (array).
  `;
  return await runWithFallback(prompt, { tools: [{ googleSearch: {} }] });
};

export const getLandValuationAnalysis = async (data: LandRequest): Promise<LandResult> => {
  const prompt = `
    Land plot valuation analysis for:
    Location: ${data.address}, ${data.city}
    Plot Size: ${data.plotSize} ${data.unit}
    FSI: ${data.fsi}

    TASK: Use search for land rates and zoning news.
    OUTPUT: Return ONLY a JSON object with: landValue, perSqmValue, devROI, negotiationStrategy, confidenceScore, zoningAnalysis, valuationJustification, and listings (array).
  `;
  return await runWithFallback(prompt, { tools: [{ googleSearch: {} }] });
};

export const askPropertyQuestion = async (
  messages: ChatMessage[], 
  contextResult?: any, 
  lang: 'EN' | 'HI' = 'EN',
  intent: 'general' | 'vastu' | 'interior' | 'feng-shui' = 'general'
): Promise<string> => {
  const systemInstruction = `
    You are QuantCasa Property Expert. Language: ${lang === 'HI' ? 'Hindi' : 'English'}.
    Current Intent Mode: ${intent.toUpperCase()}.
    ${intent === 'vastu' ? 'Focus on Vastu Shastra energy flow.' : ''}
    ${intent === 'feng-shui' ? 'Focus on Feng Shui Chi flow.' : ''}
    ${intent === 'interior' ? 'Focus on aesthetic and spatial design.' : ''}
    ${contextResult ? `CONTEXT: User property data available: ${JSON.stringify(contextResult)}.` : ''}
    Be professional and helpful. Use markdown for lists or bold text.
  `;

  const lastUserMessage = messages[messages.length - 1].text;
  const { text } = await callLLMWithFallback(lastUserMessage, { systemInstruction, temperature: 0.7 });
  return text;
};

export const generatePropertyImage = async (prompt: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `High-quality architectural visualization of ${prompt}. 8k resolution, photorealistic.` }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    const img = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return img ? `data:image/png;base64,${img.inlineData.data}` : null;
  } catch { return null; }
};
