
import React, { useState } from 'react';
import { Compass, Wind, Sparkles, Send, Loader2, Zap, MessageSquareText } from 'lucide-react';
import { AppLang, ChatMessage } from '../types';
import { askPropertyQuestion } from '../services/geminiService';
import PanchangWidget from './PanchangWidget';

interface HarmonyDashboardProps {
  contextResult?: any;
  lang: AppLang;
}

const HarmonyDashboard: React.FC<HarmonyDashboardProps> = ({ contextResult, lang }) => {
  const [harmonyType, setHarmonyType] = useState<'vastu' | 'fengshui' | 'general'>('vastu');
  const [harmonyResult, setHarmonyResult] = useState<{ tip: string, detail: string } | null>(null);
  const [followUpMsgs, setFollowUpMsgs] = useState<ChatMessage[]>([]);
  const [followInput, setFollowInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getHarmonyTips = async () => {
    setIsLoading(true);
    setHarmonyResult(null);
    setFollowUpMsgs([]);
    
    const pincode = contextResult?.pincode || 'unknown locality';
    const prompt = `System: You are a friendly home-harmony expert. 
    User: Act as a concise home-consultant. Pincode: ${pincode}. Give one highlighted ${harmonyType.toUpperCase()} tip (max 12 words) and a 2-sentence explanation.
    Answer strictly in this format:
    TIP:: your highlighted one-line tip
    DETAIL:: 2-sentence plain-language explanation.`;

    try {
      const response = await askPropertyQuestion([{ id: 'h', sender: 'user', text: prompt }], contextResult, lang, harmonyType as any);
      
      const tipLine = response.split('\n').find(l => l.toUpperCase().startsWith('TIP::'))?.replace(/TIP::/i, '').trim();
      const detailLine = response.split('\n').find(l => l.toUpperCase().startsWith('DETAIL::'))?.replace(/DETAIL::/i, '').trim();
      
      setHarmonyResult({
        tip: tipLine || response.split('\n')[0],
        detail: detailLine || response.split('\n').slice(1).join(' ')
      });
    } catch (e) {
      console.error(e);
      setHarmonyResult({ tip: "Neural link slow.", detail: "Please re-initialize tips." });
    } finally {
      setIsLoading(false);
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
        [{ id: 'f', sender: 'user', text: `Previous conversation: ${historyText}\nUser follow-up: ${currentInput}\nAnswer concisely.` }],
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
        <div className="flex items-center gap-4">
          <div className="p-3 bg-neo-neon/10 rounded-2xl text-neo-neon shadow-neo-glow">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Home Harmony Tips</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-1 opacity-60">Pincode Grounded Wisdom</p>
          </div>
        </div>

        {/* Radio Selectors (Harmony Matrix) */}
        <div className="flex flex-wrap items-center gap-8 bg-white/5 p-6 rounded-[32px] border border-white/5">
          <div className="flex gap-8">
            {(['vastu', 'fengshui', 'general'] as const).map((type) => (
              <label key={type} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="radio" 
                    name="harmony" 
                    checked={harmonyType === type}
                    onChange={() => setHarmonyType(type)}
                    className="sr-only"
                  />
                  <div className={`w-6 h-6 rounded-full border-2 transition-all ${harmonyType === type ? 'border-neo-neon bg-neo-neon shadow-neo-glow' : 'border-gray-600 group-hover:border-gray-400'}`} />
                  {harmonyType === type && <div className="absolute inset-0 flex items-center justify-center"><div className="w-2.5 h-2.5 bg-white rounded-full" /></div>}
                </div>
                <span className={`text-xs font-black uppercase tracking-widest transition-colors ${harmonyType === type ? 'text-white' : 'text-gray-500'}`}>
                  {type === 'fengshui' ? 'Feng-shui' : type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
              </label>
            ))}
          </div>
          <button 
            id="getHarmonyBtn"
            onClick={getHarmonyTips}
            disabled={isLoading}
            className="ml-auto px-10 py-4 bg-neo-neon text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-neo-glow hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />} Get tips
          </button>
        </div>

        {/* Output Box */}
        {(harmonyResult || isLoading) && (
          <div id="harmonyOutput" className="bg-white/5 border border-white/10 rounded-[40px] p-10 animate-in zoom-in duration-500 relative overflow-hidden">
            {isLoading && !harmonyResult ? (
              <div className="flex flex-col items-center justify-center py-10 gap-4">
                <Loader2 size={32} className="text-neo-neon animate-spin" />
                <p className="text-[10px] font-black text-neo-neon uppercase tracking-[0.4em]">Establish Harmony Sync...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div id="harmonyHighlight" className="text-2xl font-black text-[#0a6] uppercase tracking-tight leading-tight neon-text-glow">
                  {harmonyResult?.tip}
                </div>
                <div id="harmonyDetail" className="text-sm text-gray-300 leading-relaxed font-medium">
                  {harmonyResult?.detail}
                </div>

                {/* Follow-up history thread */}
                {followUpMsgs.length > 0 && (
                  <div className="space-y-4 pt-6 border-t border-white/5 max-h-[300px] overflow-y-auto scrollbar-hide">
                    {followUpMsgs.map((m) => (
                      <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] px-4 py-3 rounded-2xl text-xs ${m.sender === 'user' ? 'bg-neo-neon/20 text-white' : 'bg-white/5 text-gray-400'}`}>
                          <span className="font-black mr-2 uppercase tracking-tighter">{m.sender === 'user' ? 'You:' : 'AI:'}</span>
                          {m.text}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Follow-up input */}
                <div className="relative mt-8 flex gap-3">
                  <input 
                    id="followInput"
                    type="text" 
                    placeholder="Ask follow-up…"
                    className="flex-1 h-14 bg-black/40 border border-white/10 rounded-2xl pl-6 pr-6 text-xs font-bold text-white focus:border-neo-neon outline-none"
                    value={followInput}
                    onChange={(e) => setFollowInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFollowUp()}
                  />
                  <button id="followBtn" onClick={handleFollowUp} className="w-14 h-14 bg-neo-neon text-white rounded-2xl flex items-center justify-center shadow-neo-glow hover:scale-105 active:scale-95 transition-all">
                    <Send size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 no-pdf-export">
        <PanchangWidget lang={lang} />
        <div className="bg-neo-neon/5 border border-neo-neon/10 rounded-[48px] p-10 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-6">
                <MessageSquareText size={24} className="text-neo-neon" />
                <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Neural Alignment</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
                Harmony diagnostics adjust advice based on your <span className="text-white font-bold">Pincode Grounding</span>. 
                Whether you choose Vastu or Feng-shui, our AI calculates spatial prosperity for your specific sector.
            </p>
        </div>
      </div>
    </div>
  );
};

export default HarmonyDashboard;
