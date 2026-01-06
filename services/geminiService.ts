
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

const runWithFallback = async (prompt: string, config: any): Promise<any> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("CRITICAL_AUTH_ERROR: API_KEY_MISSING");

  // Senior Dev Note: Using standard model identifiers to prevent 404 errors in production
  const models = ['gemini-3-pro-preview', 'gemini-3-flash-preview', 'gemini-flash-lite-latest'];
  let lastError = null;

  for (const modelName of models) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: config
      });
      
      const text = response.text;
      if (!text) throw new Error("Buffer empty");
      
      if (config.responseMimeType === "application/json") {
          const parsed = JSON.parse(text.trim());
          const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          const sources: GroundingSource[] = groundingChunks
            .filter((chunk: any) => chunk.web)
            .map((chunk: any) => ({ uri: chunk.web.uri, title: chunk.web.title }));

          return { ...parsed, groundingSources: sources };
      }
      
      return text;
    } catch (err: any) {
      lastError = err;
      // If it's a 404, we definitely want to try the next model in the array
      console.warn(`QuantCasa Node [${modelName}] failed:`, err.message);
    }
  }
  throw lastError || new Error("SYSTEM_HALT: All nodes failed.");
};

export const getBuyAnalysis = async (data: BuyRequest): Promise<BuyResult> => {
  const prompt = `Valuation scan for ${data.bhk} in ${data.area}, ${data.city}. Pincode: ${data.pincode}. Area: ${data.sqft}sqft. Strict JSON output.`;
  const schema = {
    type: Type.OBJECT,
    properties: {
      fairValue: { type: Type.STRING },
      valuationRange: { type: Type.STRING },
      recommendation: { type: Type.STRING },
      negotiationScript: { type: Type.STRING },
      marketSentiment: { type: Type.STRING },
      sentimentScore: { type: Type.NUMBER },
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
            address: { type: Type.STRING },
            sourceUrl: { type: Type.STRING },
            bhk: { type: Type.STRING },
            builderName: { type: Type.STRING },
            societyName: { type: Type.STRING },
            latitude: { type: Type.NUMBER },
            longitude: { type: Type.NUMBER }
          }
        }
      }
    },
    required: ["fairValue", "listings"]
  };
  return await runWithFallback(prompt, { tools: [{ googleSearch: {} }], responseMimeType: "application/json", responseSchema: schema });
};

export const getRentAnalysis = async (data: RentRequest): Promise<RentResult> => {
  const prompt = `Rental analysis for ${data.bhk} in ${data.area}, ${data.city}. Return JSON.`;
  return await runWithFallback(prompt, { tools: [{ googleSearch: {} }], responseMimeType: "application/json" });
};

export const getLandValuationAnalysis = async (data: LandRequest): Promise<LandResult> => {
  const prompt = `Land plot valuation in ${data.address}, ${data.city}. Return JSON.`;
  return await runWithFallback(prompt, { tools: [{ googleSearch: {} }], responseMimeType: "application/json" });
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
    ${intent === 'vastu' ? 'You are a Vastu Shastra Consultant. Focus on Ishanya, Agneya, etc.' : ''}
    ${intent === 'feng-shui' ? 'You are a Feng Shui Master. Use Bagua map concepts, Five Elements, and Chi flow analysis.' : ''}
    ${intent === 'interior' ? 'You are an Interior Design Architect. Suggest themes and materials.' : ''}

    ${contextResult ? `CONTEXT: User property data: ${JSON.stringify(contextResult)}.` : ''}
    
    Guidelines:
    - If user asks for both Vastu and Feng Shui, blend the advice harmoniously.
    - Provide non-structural, actionable remedies (crystals, colors, mirrors).
    - Be professional and concise.
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Professional 4k photo of ${prompt}. Modern luxury style.` }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    const img = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return img ? `data:image/png;base64,${img.inlineData.data}` : null;
  } catch { return null; }
};
