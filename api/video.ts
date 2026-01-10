import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { prompt, aspectRatio } = req.body;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Cinematic property tour: ${prompt}`,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio }
    });

    let polls = 0;
    while (!operation.done && polls < 15) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
      polls++;
    }

    if (!operation.done) throw new Error('Synthesis timeout');

    const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
    res.status(200).json({ videoUrl: `${uri}&key=${process.env.API_KEY}` });
  } catch (error) {
    res.status(500).json({ error: 'Video synthesis failed' });
  }
}