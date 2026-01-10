
import React, { useState } from 'react';
import { Play, Loader2, Video, X, ShieldAlert, Sparkles, Wand2 } from 'lucide-react';
import { generatePropertyWalkthrough, checkAndRequestApiKey } from '../services/videoService';

interface VideoGeneratorProps {
  prompt: string;
  title: string;
  onClose?: () => void;
}

const LOADING_MESSAGES = [
  "Initializing Veo Neural Engine...",
  "Grounding spatial architecture...",
  "Synthesizing material textures...",
  "Calculating light ray pathways...",
  "Rendering cinematic frames...",
  "Finalizing walkthrough sequence..."
];

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ prompt, title, onClose }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const startGeneration = async () => {
    setStatus('loading');
    setError(null);
    
    // Cycle loading messages
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 4000);

    try {
      await checkAndRequestApiKey();
      const url = await generatePropertyWalkthrough(prompt);
      setVideoUrl(url);
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "The video node encountered a quantum flux. Please try again.");
      setStatus('error');
    } finally {
      clearInterval(interval);
    }
  };

  return (
    <div className="bg-neo-glass backdrop-blur-3xl border border-white/10 rounded-[48px] p-8 md:p-12 shadow-neo-glow w-full max-w-4xl animate-in zoom-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-neo-pink/10 rounded-2xl text-neo-pink shadow-pink-glow">
            <Video size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Quantum Walkthrough</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em] font-black opacity-60">Veo 3.1 Synthesis</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl hover:bg-neo-pink hover:text-white transition-all text-gray-500">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="relative aspect-video rounded-[32px] overflow-hidden bg-black/40 border border-white/5 flex flex-col items-center justify-center">
        {status === 'idle' && (
          <div className="text-center space-y-6 px-10">
            <div className="w-20 h-20 bg-neo-pink/20 rounded-full flex items-center justify-center mx-auto shadow-pink-glow animate-pulse">
              <Sparkles className="text-neo-pink" size={32} />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Generate Cinematic Tour</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
              Our AI will synthesize a 4K walkthrough video for <span className="text-white font-bold">{title}</span>. 
              This process utilizes high-compute Veo nodes and takes 2-3 minutes.
            </p>
            <button 
              onClick={startGeneration}
              className="px-10 py-5 bg-neo-pink text-white rounded-3xl font-black uppercase tracking-widest shadow-pink-glow hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto"
            >
              <Wand2 size={20} /> Start Synthesis
            </button>
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em]">Requires Paid Billing Account</p>
          </div>
        )}

        {status === 'loading' && (
          <div className="text-center space-y-8 p-12">
            <div className="relative">
              <Loader2 size={64} className="text-neo-pink animate-spin mx-auto" />
              <div className="absolute inset-0 bg-neo-pink/20 blur-3xl rounded-full" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white uppercase tracking-widest animate-pulse">
                {LOADING_MESSAGES[loadingMsgIdx]}
              </h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Do not close this window</p>
            </div>
          </div>
        )}

        {status === 'success' && videoUrl && (
          <video 
            src={videoUrl} 
            controls 
            autoPlay 
            className="w-full h-full object-cover"
          />
        )}

        {status === 'error' && (
          <div className="text-center space-y-6 p-12">
            <ShieldAlert size={64} className="text-neo-pink mx-auto" />
            <p className="text-sm text-neo-pink font-bold uppercase tracking-widest">{error}</p>
            <button 
              onClick={startGeneration}
              className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-xs font-black uppercase tracking-widest hover:bg-neo-pink transition-all"
            >
              Retry Connection
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-start gap-4 p-6 bg-white/5 rounded-3xl border border-white/5">
        <div className="p-2 bg-neo-pink/10 rounded-xl text-neo-pink">
          <Play size={16} />
        </div>
        <p className="text-xs text-gray-400 leading-relaxed font-medium italic">
          "The generated video is a predictive architectural visualization based on current market grounding and spatial descriptions. Actual property interior may vary from AI synthesis."
        </p>
      </div>
    </div>
  );
};

export default VideoGenerator;
