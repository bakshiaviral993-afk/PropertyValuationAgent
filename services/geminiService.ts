
import { GoogleGenAI, Type } from "@google/genai";
import { 
  BuyRequest, BuyResult, 
  RentRequest, RentResult, 
  LandRequest, LandResult,
  GroundingSource, ChatMessage
} from "../types";

const getApiKey = (): string | null => {
  const key = process.env.API_KEY;
  return (!key || key === 'undefined' || key.trim() === '') ? null : key;
};

/**
 * Extracts JSON from a string that might contain other text or markdown blocks.
 * Necessary because googleSearch tool often prevents the model from outputting pure JSON.
 */
const extractJsonFromText = (text: string): any => {
  try {
    // Try pure parse first
    return JSON.parse(text.trim());
  } catch {
    // Try to find JSON block
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
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("CRITICAL_AUTH_ERROR: API_KEY_MISSING");

  /**
   * Senior Dev Note: Fix 404 errors by using standard SDK identifiers.
   * gemini-3-flash-preview: Primary for high-speed, grounded reasoning.
   * gemini-flash-lite-latest: Secondary fallback for efficiency.
   * DO NOT use gemini-2.5-flash-lite-latest as it is not a valid endpoint.
   */
  const models = ['gemini-3-flash-preview', 'gemini-flash-lite-latest'];
  let lastError = null;

  // IMPORTANT: Rules for Search/Maps Grounding:
  // 1. responseMimeType and responseSchema are NOT allowed with googleSearch/googleMaps.
  // 2. We must handle the text response and extract JSON manually.
  const isGroundingUsed = config.tools?.some((t: any) => t.googleSearch || t.googleMaps);
  
  const optimizedConfig = { ...config };
  if (isGroundingUsed) {
    delete optimizedConfig.responseMimeType;
    delete optimizedConfig.responseSchema;
  }

  for (const modelName of models) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: optimizedConfig
      });
      
      const text = response.text;
      if (!text) throw new Error("Empty response from neural node.");
      
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources: GroundingSource[] = groundingChunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({ 
          uri: chunk.web.uri, 
          title: chunk.web.title 
        }));

      if (isGroundingUsed || config.responseMimeType === "application/json") {
          const parsed = extractJsonFromText(text);
          return { ...parsed, groundingSources: sources };
      }
      
      return text;
    } catch (err: any) {
      lastError = err;
      console.warn(`QuantCasa [${modelName}] link failed:`, err.message);
      // If it's a 404 or unsupported method, try the next model.
      if (err.message?.includes('404') || err.message?.includes('not found') || err.message?.includes('not supported')) continue;
      else break; // For other errors like API Key issues, don't loop
    }
  }
  throw lastError || new Error("SYSTEM_HALT: All neural nodes unreachable.");
};

export const getBuyAnalysis = async (data: BuyRequest): Promise<BuyResult> => {
  const prompt = `
    Perform a professional real estate valuation scan for:
    Configuration: ${data.bhk}
    Locality: ${data.area}, ${data.city} (Pincode: ${data.pincode})
    Size: ${data.sqft} sqft
    Facing: ${data.facing || 'Not specified'}

    TASK: Use Google Search to find current market listings and price trends.
    OUTPUT: Return ONLY a JSON object with these fields: fairValue, valuationRange, recommendation, negotiationScript, marketSentiment, sentimentScore (0-100), registrationEstimate, appreciationPotential, confidenceScore (0-100), valuationJustification, and listings (array of objects with title, price, address, sourceUrl).
  `;
  
  return await runWithFallback(prompt, { tools: [{ googleSearch: {} }] });
};

export const getRentAnalysis = async (data: RentRequest): Promise<RentResult> => {
  const prompt = `
    Perform a rental yield analysis for:
    Configuration: ${data.bhk}
    Locality: ${data.area}, ${data.city}
    Size: ${data.sqft} sqft

    TASK: Use Google Search for rental benchmarks.
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

    TASK: Use Google Search for land rates and zoning news.
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
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("CRITICAL_AUTH_ERROR: API_KEY_MISSING");

  const systemInstruction = `
    You are QuantCasa Property Expert. Language: ${lang === 'HI' ? 'Hindi' : 'English'}.
    
    Current Intent Mode: ${intent.toUpperCase()}.
    ${intent === 'vastu' ? 'Focus on Vastu Shastra energy flow.' : ''}
    ${intent === 'feng-shui' ? 'Focus on Feng Shui Chi flow.' : ''}
    ${intent === 'interior' ? 'Focus on aesthetic and spatial design.' : ''}

    ${contextResult ? `CONTEXT: User property data available: ${JSON.stringify(contextResult)}.` : ''}
    
    Be professional and helpful. Use markdown for lists or bold text.
  `;

  const ai = new GoogleGenAI({ apiKey });
  const lastUserMessage = messages[messages.length - 1].text;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ text: lastUserMessage }] },
    config: { systemInstruction, temperature: 0.7 }
  });

  return response.text || "Neural connection reset. Please retry.";
};

export const generatePropertyImage = async (prompt: string): Promise<string | null> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  try {
    const ai = new GoogleGenAI({ apiKey });
    // Using gemini-2.5-flash-image for standard image generation as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `High-quality architectural visualization of ${prompt}. 8k resolution, photorealistic.` }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    const img = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return img ? `data:image/png;base64,${img.inlineData.data}` : null;
  } catch { return null; }
};
