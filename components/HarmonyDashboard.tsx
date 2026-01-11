import React, { useState, useRef } from 'react';
import { Compass, Wind, Sparkles, Send, Loader2, Zap, MessageSquareText, Upload, Image as ImageIcon, Paintbrush, X, List, ChevronRight, Hash } from 'lucide-react';
import { AppLang, ChatMessage } from '../types';
import { askPropertyQuestion, generatePropertyImage, analyzeImageForHarmony } from '../services/geminiService';
import PanchangWidget from './PanchangWidget';

interface HarmonyDashboardProps {
  contextResult?: any;
  lang: AppLang;
}

interface StructuredResult {
  tip: string;
  details: string[];
  suggestions: string[];
  renderUrl?: string;
}

const HarmonyDashboard: React.FC<HarmonyDashboardProps> = ({ contextResult, lang }) => {
  const [harmonyType, setHarmonyType] = useState<'vastu' | 'feng-shui' | 'interior' | 'general'>('vastu');
  const [harmonyResult, setHarmonyResult] = useState<StructuredResult | null>(null);
  const [followUpMsgs, setFollowUpMsgs] = useState<ChatMessage[]>([]);
  const [followInput, setFollowInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseDeepSeekStyle = (text: string): Omit<StructuredResult, 'renderUrl'> => {
    const lines = text.split('\n');
    const tipLine = lines.find(l => l.toLowerCase().includes('- tip:'));
    const tip = tipLine ? tipLine.split(':').slice(1).join(':').trim() : "Spatial Protocol Synced";
    
    const detailIdx = lines.findIndex(l => l.toLowerCase().includes('- details:'));
    const suggestionIdx = lines.findIndex(l => l.toLowerCase().includes('- suggestions:'));
    
    let details: string[] = [];
    if (detailIdx !== -1) {
      details = lines.slice(detailIdx + 1, suggestionIdx !== -1 ? suggestionIdx : undefined)
        .map(l => l.replace(/^[•\-\*\d\.\s]+/, '').trim())
        .filter(l => l.length > 3);
    } else {
      // Fallback: Use non-header lines as details
      details = lines.filter(l => l.trim() && !l.toLowerCase().includes('- tip:') && !l.toLowerCase().includes('- suggestions:'))
        .map(l => l.replace(/^[•\-\*\d\.\s]+/, '').trim())
        .slice(0, 5);
    }
      
    const suggestions = suggestionIdx !== -1 
      ? lines.slice(suggestionIdx + 1)
          .map(l => l.replace(/^[•\-\*\d\.\s]+/, '').trim())
          .filter(l => l.length > 5)
      : [];

    return { tip, details, suggestions };
  };

  const getHarmonyTips = async (base64Img?: string, customPrompt?: string) => {
    setIsLoading(true);
    if (!customPrompt) {
      setHarmonyResult(null);
      setFollowUpMsgs([]);
    }
    
    const pincode = contextResult?.pincode || 'Regional Hub';
    let visionAnalysis = "";
    
    if (base64Img) {
      try {
        visionAnalysis = await analyzeImageForHarmony(base64Img, harmonyType);
      } catch (e) {
        console.warn("Vision node sync failed", e);
      }
    }

    const userInput = customPrompt || followInput;
    const finalPrompt = `Analyze ${harmonyType.toUpperCase()} for ${pincode}. 
    User Context: ${userInput}. 
    ${visionAnalysis ? 'Vision Intelligence: ' + visionAnalysis : ''}
    Respond in DeepSeek logical structure with explicit headers.`;

    try {
      const response = await askPropertyQuestion([{ id: 'h', sender: 'user', text: finalPrompt }], contextResult, lang, harmonyType as any);
      const structured = parseDeepSeekStyle(response);
      
      let renderUrl = harmonyResult?.renderUrl;
      if (!customPrompt) {
        const renderPrompt = `${harmonyType} optimized room: ${structured.tip}. Include sustainable biophilic elements.`;
        renderUrl = (await generatePropertyImage(renderPrompt)) || undefined;
      }

      setHarmonyResult({ ...structured, renderUrl });
      if (customPrompt) {
        setFollowUpMsgs(prev => [...prev, { id: `b-${Date.now()}`, sender: 'bot', text: response }]);
      }
    } catch (e) {
      setHarmonyResult({ tip: "Neural flux.", details: ["Please re-initialize protocol."], suggestions: [] });
    } finally {
      setIsLoading(false);
      if (!customPrompt) setFollowInput('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setFollowInput(suggestion);
    getHarmonyTips(uploadedImage || undefined, suggestion);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setUploadedImage(base64);
        getHarmonyTips(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFollowUp = async () => {
    if (!followInput.trim() || isLoading) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, sender: 'user', text: followInput };
    setFollowUpMsgs(prev => [...prev, userMsg]);
    const currentInput = followInput;
    setFollowInput('');
    setIsLoading(true);

    try {
      const historyText = followUpMsgs.concat(userMsg).map(m => `${m.sender}: ${m.text}`).join('\n');
      const answer = await askPropertyQuestion(
        [{ id: 'f', sender: 'user', text: `Previous conversation: ${historyText}\nUser follow-up: ${currentInput}\nProvide biophilic remedy.` }],
        { ...contextResult, harmonyBase: harmonyResult },
        lang,
        harmonyType as any
      );
      setFollowUpMsgs(prev => [...prev, { id: `b-${Date.now()}`, sender: 'bot', text: answer }]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="harmonyPanel" className="h-full flex flex-col gap-10 animate-in fade-in duration-1000">
      <div className="bg-neo-glass border border-white/10 p-8 rounded-[48px] shadow-neo-glow space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-neo-neon/10 rounded-2xl text-neo-neon shadow-neo-glow">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Home Harmony 2026</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-1 opacity-60">DeepSeek Logical Diagnostics</p>
            </div>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-neo-neon hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <Upload size={14} /> Upload Plan/Photo
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" hidden />
        </div>

        <div className="space-y-4">
          <textarea 
            value={followInput}
            onChange={(e) => setFollowInput(e.target.value)}
            placeholder="Describe property details (e.g. 'Kitchen in SE, entrance in North, master bedroom in SW') for expert analysis..."
            className="w-full bg-black/40 border border-white/10 rounded-[32px] p-6 text-sm font-medium text-white outline-none focus:border-neo-neon min-h-[120px] transition-all scrollbar-hide"
          />
          <div className="flex flex-wrap items-center gap-6 bg-white/5 p-4 rounded-[32px] border border-white/5">
            <div className="flex flex-wrap gap-3">
              {(['vastu', 'feng-shui', 'interior', 'general'] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={harmonyType === type} onChange={() => setHarmonyType(type)} className="sr-only" />
                  <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${harmonyType === type ? 'bg-neo-neon text-white shadow-neo-glow' : 'bg-white/5 text-gray-500 hover:text-white'}`}>
                    {type}
                  </div>
                </label>
              ))}
            </div>
            <button 
              onClick={() => getHarmonyTips(uploadedImage || undefined)}
              disabled={isLoading || (!followInput.trim() && !uploadedImage)}
              className="ml-auto px-8 py-4 bg-neo-neon text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-neo-glow hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />} Run Diagnostic
            </button>
          </div>
        </div>

        {uploadedImage && (
          <div className="relative w-full aspect-video rounded-[32px] overflow-hidden border border-neo-neon/20 group">
             <img src={uploadedImage} alt="Input Plan" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onClick={() => setUploadedImage(null)} className="p-3 bg-neo-pink rounded-full text-white"><X size={20}/></button>
             </div>
             <div className="absolute top-4 left-4 px-3 py-1 bg-neo-neon text-white text-[8px] font-black uppercase rounded-lg">Spatial Recon Active</div>
          </div>
        )}

        {(harmonyResult || isLoading) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in zoom-in duration-500">
            <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-6 flex flex-col min-h-[400px]">
              {isLoading && !harmonyResult ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4 text-center">
                  <Loader2 size={40} className="text-neo-neon animate-spin" />
                  <p className="text-[10px] font-black text-neo-neon uppercase tracking-[0.4em]">Synthesizing Logical Breakdown...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <span className="text-[8px] font-black text-neo-neon uppercase tracking-[0.4em] opacity-60">Primary Expert Tip</span>
                    <div className="text-2xl font-black text-emerald-400 uppercase tracking-tight leading-tight neon-text-glow">
                      {harmonyResult?.tip}
                    </div>
                  </div>

                  <div className="space-y-4 flex-1">
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.4em]">Analysis Details</span>
                    <ul className="space-y-4">
                      {harmonyResult?.details.map((item, i) => (
                        <li key={i} className="flex gap-4 text-sm text-gray-300 leading-relaxed font-medium italic animate-in slide-in-from-left duration-300">
                          <div className="w-5 h-5 rounded-full bg-neo-neon/10 border border-neo-neon/30 text-neo-neon text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i+1}</div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {harmonyResult?.suggestions && harmonyResult.suggestions.length > 0 && (
                    <div className="space-y-4 pt-6 border-t border-white/5">
                      <span className="text-[8px] font-black text-neo-pink uppercase tracking-[0.4em]">Interactive Suggestions</span>
                      <div className="flex flex-wrap gap-2">
                        {harmonyResult.suggestions.map((sug, i) => (
                          <button 
                            key={i} 
                            onClick={() => handleSuggestionClick(sug)}
                            className="px-4 py-2 bg-neo-pink/5 border border-neo-pink/20 rounded-xl text-[10px] font-bold text-neo-pink hover:bg-neo-pink hover:text-white transition-all flex items-center gap-2"
                          >
                            <Hash size={10} /> {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="relative aspect-square rounded-[40px] overflow-hidden border border-white/10 bg-black/20 group">
              {harmonyResult?.renderUrl ? (
                <>
                  <img src={harmonyResult.renderUrl} alt="Trendy Render" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                  <div className="absolute bottom-6 left-6 right-6 p-4 bg-neo-bg/80 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-black text-neo-neon uppercase tracking-widest">Aesthetic Visualization</p>
                      <p className="text-[10px] font-bold text-white uppercase mt-1">Biophilic Logic Applied</p>
                    </div>
                    <ImageIcon size={20} className="text-neo-neon" />
                  </div>
                </>
              ) : isLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 opacity-30">
                  <Paintbrush size={48} className="animate-pulse" />
                  <p className="text-[9px] font-black uppercase tracking-[0.4em]">Rendering Visual Link...</p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-4 opacity-20">
                   <ImageIcon size={64} />
                   <p className="text-[10px] font-black uppercase tracking-widest text-center">Diagnostics Required for Visualization</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 no-pdf-export">
        <PanchangWidget lang={lang} />
        <div className="bg-neo-neon/5 border border-neo-neon/10 rounded-[48px] p-10 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-6">
                <MessageSquareText size={24} className="text-neo-neon" />
                <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Expert Engine</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
                QuantCasa's Expert mode uses <span className="text-white font-bold">Structured Reasoning</span> to deliver step-by-step guidance. Our system now features robust content rendering to ensure you never miss a critical expert signal.
            </p>
        </div>
      </div>
    </div>
  );
};

export default HarmonyDashboard;