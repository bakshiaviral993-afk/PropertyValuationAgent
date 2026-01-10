export async function checkAndRequestApiKey(): Promise<boolean> {
  return true;
}

export async function generatePropertyWalkthrough(prompt: string, aspectRatio: '16:9' | '9:16' = '16:9'): Promise<string> {
  try {
    const response = await fetch('/api/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, aspectRatio }),
    });

    if (!response.ok) throw new Error('Video node synthesis failed');

    const { videoUrl } = await response.json();
    return videoUrl;
  } catch (err) {
    console.error("Video client error:", err);
    throw err;
  }
}