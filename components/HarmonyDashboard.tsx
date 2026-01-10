import React, { useState, useRef } from 'react';
import { Compass, Wind, Sparkles, Send, Loader2, Zap, MessageSquareText, Upload, Image as ImageIcon, Paintbrush, X } from 'lucide-react';
import { AppLang, ChatMessage } from '../types';
import { askPropertyQuestion, generatePropertyImage, analyzeImageForHarmony } from '../services/geminiService';
import PanchangWidget from './PanchangWidget';

interface HarmonyDashboardProps {
  contextResult?: any;
  lang: AppLang;
}

const HarmonyDashboard: React.FC<HarmonyDashboardProps> = ({ contextResult, lang }) => {
  const [harmonyType, setHarmonyType] = useState<'vastu' | 'feng-shui' | 'interior' | 'general'>('vastu');
  const [harmonyResult, setHarmonyResult] = useState<{ tip: string, detail: string, renderUrl?: string } | null>(null);
  const [followUpMsgs, setFollowUpMsgs] = useState<ChatMessage[]>([]);
  const [followInput, setFollowInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getHarmonyTips = async (base64Img?: string) => {
    setIsLoading(true);
    setHarmonyResult(null);
    setFollowUpMsgs([]);
    
    const pincode = contextResult?.pincode || 'Metro Hub';
    let visionAnalysis = "";
    
    if (base64Img) {
      try {
        visionAnalysis = await analyzeImageForHarmony(base64Img, harmonyType);
      } catch (e) {
        console.warn("Vision node sync failed", e);
      }
    }

    const prompt = `System: Home-harmony expert. 2026 Biophilic Trend fusion.
    User: Analyze ${harmonyType.toUpperCase()} for Pincode: ${pincode}. ${visionAnalysis ? 'Vision Context: ' + visionAnalysis : ''}
    Output Format:
    TIP:: [Highlighted one-line trendy advice]
    DETAIL:: [2-sentence explanation involving biophilic elements]`;

    try {
      const response = await askPropertyQuestion([{ id: 'h', sender: 'user', text: prompt }], contextResult, lang, harmonyType as any);
      
      const tipLine = response.split('\n').find(l => l.toUpperCase().startsWith('TIP::'))?.replace(/TIP::/i, '').trim();
      const detailLine = response.split('\n').find(l => l.toUpperCase().startsWith('DETAIL::'))?.replace(/DETAIL::/i, '').trim();
      
      // Generate trendy visual render
      const renderPrompt = `${harmonyType} optimized living space: ${tipLine || 'sustainable modern fusion'}. Include biophilic greenery and natural lighting.`;
      const renderUrl = await generatePropertyImage(renderPrompt);

      setHarmonyResult({
        tip: tipLine || response.split('\n')[0],
        detail: detailLine || response.split('\n').slice(1).join(' '),
        renderUrl: renderUrl || undefined
      });
    } catch (e) {
      setHarmonyResult({ tip: "Neural link slow.", detail: "Please re-initialize tips." });
    } finally {
      setIsLoading(false);
    }
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
    <div id="harmonyPanel" className="h-full flex flex-col gap-10 animate-in fade-in slide-in-from-right-10 duration-1000">
      <div className="bg-neo-glass border border-white/10 p-8 rounded-[48px] shadow-neo-glow space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-neo-neon/10 rounded-2xl text-neo-neon shadow-neo-glow">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Home Harmony 2026</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-1 opacity-60">Biophilic & Spatial AI</p>
            </div>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-neo-neon hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <Upload size={14} /> Upload Plan
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" hidden />
        </div>

        <div className="flex flex-wrap items-center gap-6 bg-white/5 p-6 rounded-[32px] border border-white/5">
          <div className="flex flex-wrap gap-6">
            {(['vastu', 'feng-shui', 'interior', 'general'] as const).map((type) => (
              <label key={type} className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="radio" name="harmony" checked={harmonyType === type}
                  onChange={() => setHarmonyType(type)} className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${harmonyType === type ? 'border-neo-neon bg-neo-neon shadow-neo-glow' : 'border-gray-600'}`}>
                  {harmonyType === type && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${harmonyType === type ? 'text-white' : 'text-gray-500'}`}>
                  {type}
                </span>
              </label>
            ))}
          </div>
          <button 
            onClick={() => getHarmonyTips(uploadedImage || undefined)}
            disabled={isLoading}
            className="ml-auto px-8 py-4 bg-neo-neon text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-neo-glow hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />} Establish Sync
          </button>
        </div>

        {uploadedImage && (
          <div className="relative w-full aspect-video rounded-[32px] overflow-hidden border border-neo-neon/20 group">
             <img src={uploadedImage} alt="Input Plan" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onClick={() => setUploadedImage(null)} className="p-3 bg-neo-pink rounded-full text-white"><X size={20}/></button>
             </div>
             <div className="absolute top-4 left-4 px-3 py-1 bg-neo-neon text-white text-[8px] font-black uppercase rounded-lg">Spatial Input Loaded</div>
          </div>
        )}

        {(harmonyResult || isLoading) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in zoom-in duration-500">
            <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-6">
              {isLoading && !harmonyResult ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 size={32} className="text-neo-neon animate-spin" />
                  <p className="text-[10px] font-black text-neo-neon uppercase tracking-[0.4em]">Establish Harmony Link...</p>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-black text-emerald-400 uppercase tracking-tight leading-tight neon-text-glow">
                    {harmonyResult?.tip}
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed font-medium italic">
                    "{harmonyResult?.detail}"
                  </p>
                  
                  {followUpMsgs.length > 0 && (
                    <div className="space-y-4 pt-6 border-t border-white/5 max-h-[200px] overflow-y-auto scrollbar-hide">
                      {followUpMsgs.map((m) => (
                        <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[90%] px-4 py-3 rounded-2xl text-xs ${m.sender === 'user' ? 'bg-neo-neon/20 text-white' : 'bg-white/5 text-gray-400'}`}>
                            {m.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="relative mt-8 flex gap-3">
                    <input 
                      type="text" placeholder="Ask biophilic remedy…" value={followInput}
                      onChange={(e) => setFollowInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleFollowUp()}
                      className="flex-1 h-12 bg-black/40 border border-white/10 rounded-2xl pl-5 text-xs font-bold text-white outline-none focus:border-neo-neon"
                    />
                    <button onClick={handleFollowUp} className="w-12 h-12 bg-neo-neon text-white rounded-2xl flex items-center justify-center shadow-neo-glow active:scale-95 transition-all">
                      <Send size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="relative aspect-square rounded-[40px] overflow-hidden border border-white/10 bg-black/20 group">
              {harmonyResult?.renderUrl ? (
                <>
                  <img src={harmonyResult.renderUrl} alt="Trendy Render" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                  <div className="absolute bottom-6 left-6 right-6 p-4 bg-neo-bg/80 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-black text-neo-neon uppercase tracking-widest">Trendy 2026 Render</p>
                      <p className="text-[10px] font-bold text-white uppercase mt-1">Biophilic Fusion Applied</p>
                    </div>
                    <ImageIcon size={20} className="text-neo-neon" />
                  </div>
                </>
              ) : isLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 opacity-30">
                  <Paintbrush size={48} className="animate-bounce" />
                  <p className="text-[9px] font-black uppercase tracking-[0.4em]">Synthesizing Visualization...</p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-4 opacity-20">
                   <ImageIcon size={64} />
                   <p className="text-[10px] font-black uppercase tracking-widest">Establish Sync for Render</p>
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
                <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Trendy Alignment</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
                Harmony diagnostics in 2026 focus on <span className="text-white font-bold">Biophilic Integration</span>. 
                Our AI suggests natural remedies—using specific wood grains, plant species, and circadian lighting—to align your asset's energy with modern wellness standards.
            </p>
        </div>
      </div>
    </div>
  );
};

export default HarmonyDashboard;