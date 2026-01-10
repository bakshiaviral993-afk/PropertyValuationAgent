
import { GoogleGenAI } from "@google/genai";

export async function checkAndRequestApiKey(): Promise<boolean> {
  if (typeof window.aistudio === 'undefined') return true; // Fallback for environments without the helper
  
  const hasKey = await window.aistudio.hasSelectedApiKey();
  if (!hasKey) {
    await window.aistudio.openSelectKey();
    // Per instructions, assume success after triggering the dialog to avoid race conditions
    return true;
  }
  return true;
}

export async function generatePropertyWalkthrough(prompt: string, aspectRatio: '16:9' | '9:16' = '16:9'): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `A cinematic 4k architectural walkthrough of a high-end property: ${prompt}. Smooth camera movement, realistic lighting, modern interior design.`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    });

    while (!operation.done) {
      // Polling interval per guidelines
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed to return a valid URI.");

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error: any) {
    console.error("Veo Error:", error);
    if (error.message?.includes("Requested entity was not found")) {
      // Trigger key selection again on failure per instructions
      if (typeof window.aistudio !== 'undefined') {
        await window.aistudio.openSelectKey();
      }
    }
    throw error;
  }
}
