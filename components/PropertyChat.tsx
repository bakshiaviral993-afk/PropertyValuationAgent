import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Mic, MicOff, Trash2, Volume2, VolumeX, Compass, Paintbrush, Wind, Headphones, Image as ImageIcon, Loader2, Info, AlertCircle, Zap, Hash, ChevronRight, Binary } from 'lucide-react';
import { ChatMessage, AppLang } from '../types';
import { askPropertyQuestion, generatePropertyImage } from '../services/geminiService';
import LoadingInsights from './LoadingInsights';
import { SpeechInput, speak } from '../services/voiceService';

interface PropertyChatProps {
  contextResult?: any;
  lang: AppLang;
  initialIntent?: 'general' | 'vastu' | 'interior' | 'feng-shui';
}

const PropertyChat: React.FC<PropertyChatProps> = ({ contextResult, lang, initialIntent = 'general' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [interimValue, setInterimValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [isAutoSpeak, setIsAutoSpeak] = useState(true);
  const [intent, setIntent] = useState<'general' | 'vastu' | 'interior' | 'feng-shui'>(initialIntent);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const voiceInputRef = useRef<SpeechInput | null>(null);

  useEffect(() => {
    let text = "";
    if (intent === 'general') {
      text = lang === 'HI' ? "नमस्ते! मैं आपका क्वांटकासा एक्सपर्ट हूँ। आप रियल एस्टेट के बारे में कुछ भी पूछ सकते हैं।" : "Namaste! I am your QuantCasa Expert. Ask me anything about real estate, investment, or legalities.";
    } else if (intent === 'vastu') {
      text = lang === 'HI' ? "वास्तु परामर्श सक्रिय है। अपने घर की दिशा और ऊर्जा के बारे में पूछें।" : "Vastu Consultation active. Let's optimize your home's directional energy.";
    } else if (intent === 'feng-shui') {
      text = lang === 'HI' ? "फेंग शुई मोड चालू है। 'ची' प्रवाह और उपायों के बारे में चर्चा करें।" : "Feng Shui mode is on. Let's discuss Chi flow and Bagua remedies.";
    } else {
      text = lang === 'HI' ? "इटीरियर डिजाइन मोड। अपने सपनों के इंटीरियर को विज़ुअलाइज़ करें।" : "Interior Design mode. Let's visualize your dream home's aesthetic.";
    }
    setMessages([{ id: 'init', sender: 'bot', text, isSystem: true } as any]);
  }, [lang, intent]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimValue, isLoading]);

  const handleSend = async (text?: string) => {
    const messageText = text || inputValue;
    if (!messageText.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, sender: 'user', text: messageText };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setInterimValue('');
    setIsLoading(true);

    try {
      // PHASE 1: Fetch Text Response (High Priority)
      const responseText = await askPropertyQuestion([...messages, userMsg], contextResult, lang, intent);
      
      const botMsgId = `b-${Date.now()}`;
      const botMsg: ChatMessage = { 
        id: botMsgId, 
        sender: 'bot', 
        text: responseText,
        // We set a flag to show image is pending if intent is visual
        image: (intent === 'interior' || intent === 'vastu') ? 'PENDING' : undefined 
      };

      setMessages(prev => [...prev, botMsg]);
      setIsLoading(false); // STOP main loading as text is here

      if (isAutoSpeak) {
        const speakText = responseText.replace(/- Tip:|- Details:|- Suggestions:/gi, '').trim();
        speak(speakText, lang === 'HI' ? 'hi-IN' : 'en-IN');
      }

      // PHASE 2: Background Image Generation (Low Priority / Async)
      if (intent === 'interior' || intent === 'vastu') {
        const tipMatch = responseText.match(/- Tip:([\s\S]*?)- Details:/i) || responseText.match(/- Tip:([\s\S]*?)$/i);
        const imgPrompt = tipMatch ? tipMatch[1].trim() : messageText;
        
        if (imgPrompt.length > 5) {
          generatePropertyImage(`${intent} visualization: ${imgPrompt}`).then(url => {
            if (url) {
              setMessages(prev => prev.map(m => 
                m.id === botMsgId ? { ...m, image: url } : m
              ));
            } else {
              setMessages(prev => prev.map(m => 
                m.id === botMsgId ? { ...m, image: undefined } : m
              ));
            }
          });
        } else {
          setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, image: undefined } : m));
        }
      }

    } catch (err) {
      setMessages(prev => [...prev, { id: `e-${Date.now()}`, sender: 'bot', text: "Neural link timeout. Core processing failed.", isSystem: true } as any]);
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      voiceInputRef.current?.stop();
      setIsListening(false);
      return;
    }
    voiceInputRef.current = new SpeechInput((text, isFinal) => {
        if (isFinal) { setInputValue(text); handleSend(text); toggleListening(); } else setInterimValue(text);
      }, () => setIsListening(false), (v) => setMicVolume(v), lang === 'HI' ? 'hi-IN' : 'en-IN'
    );
    setIsListening(true);
    voiceInputRef.current.start();
  };

  const renderDeepSeekContent = (text: string, isSystem?: boolean) => {
    if (isSystem) return <p className="text-sm font-medium leading-relaxed">{text}</p>;
    
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const tipLine = lines.find(l => /^-?\s*tip:/i.test(l));
    const detailsIdx = lines.findIndex(l => /^-?\s*details:/i.test(l));
    const sugIdx = lines.findIndex(l => /^-?\s*suggestions:/i.test(l));

    if (!tipLine && detailsIdx === -1 && sugIdx === -1) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 opacity-40">
             <Binary size={10} className="text-neo-neon" />
             <span className="text-[8px] font-black uppercase tracking-widest">Unstructured Raw Signal</span>
          </div>
          {lines.map((line, i) => (
            <p key={i} className="text-sm font-medium leading-relaxed">
              {/^[•\-\*\d\.]/.test(line) ? (
                <span className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-neo-neon mt-1.5 shrink-0 shadow-neo-neon" />
                  {line.replace(/^[•\-\*\d\.\s]+/, '')}
                </span>
              ) : line}
            </p>
          ))}
        </div>
      );
    }

    const tipContent = tipLine ? tipLine.replace(/^-?\s*tip:\s*/i, '').trim() : null;
    const details = detailsIdx !== -1 
      ? lines.slice(detailsIdx + 1, sugIdx !== -1 ? sugIdx : undefined)
          .filter(l => !/^-?\s*suggestions:/i.test(l))
          .map(l => l.replace(/^[•\-\*\d\.\s]+/, '').trim())
          .filter(l => l.length > 1)
      : [];
    const suggestions = sugIdx !== -1 
      ? lines.slice(sugIdx + 1)
          .map(l => l.replace(/^[•\-\*\d\.\s]+/, '').trim())
          .filter(l => l.length > 2)
      : [];

    return (
      <div className="space-y-6">
        {tipContent && (
          <div className="bg-neo-neon/10 border-l-4 border-neo-neon p-5 rounded-r-3xl animate-in fade-in slide-in-from-left duration-500 shadow-sm">
             <span className="text-[9px] font-black uppercase text-neo-neon block mb-2 tracking-[0.2em] opacity-70">Primary Expert Tip</span>
             <p className="text-sm font-black text-white leading-tight">{tipContent}</p>
          </div>
        )}
        {details.length > 0 && (
          <div className="space-y-4 px-1">
            <span className="text-[9px] font-black uppercase text-gray-500 block tracking-[0.2em]">Logical Breakdown</span>
            <ul className="space-y-4">
              {details.map((d, i) => (
                <li key={i} className="text-xs text-gray-300 flex gap-4 leading-relaxed animate-in slide-in-from-bottom duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-neo-neon shrink-0 mt-0.5 shadow-sm">{i + 1}</div>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}
        {suggestions.length > 0 && (
          <div className="pt-6 border-t border-white/5 space-y-4">
             <span className="text-[9px] font-black uppercase text-neo-pink block tracking-[0.2em] opacity-70">Interactive Suggestions</span>
             <div className="flex flex-wrap gap-2.5">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => handleSend(s)} className="px-5 py-2.5 bg-neo-pink/5 border border-neo-pink/10 rounded-2xl text-[10px] font-black text-neo-pink hover:bg-neo-pink hover:text-white transition-all flex items-center gap-2 group active:scale-95">
                    <Hash size={12} className="opacity-50 group-hover:rotate-12 transition-transform" /> {s}
                  </button>
                ))}
             </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-neo-bg rounded-[48px] shadow-neo-glow overflow-hidden border border-white/10 relative">
      <div className="px-8 py-6 border-b border-white/5 bg-neo-glass/40 backdrop-blur-xl z-20">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl transition-all duration-700 ${isListening ? 'bg-neo-pink shadow-pink-glow rotate-12 scale-110' : 'bg-neo-neon/10'}`}>
              <Bot className={isListening ? "text-white" : "text-neo-neon"} size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Expert Bot</h2>
              <span className="text-[7px] text-gray-500 font-black uppercase tracking-[0.4em] mt-1.5 block">Neural Reasoner Active</span>
            </div>
          </div>
          <button onClick={() => setIsAutoSpeak(!isAutoSpeak)} className={`p-2.5 rounded-xl border transition-all ${isAutoSpeak ? 'text-neo-neon bg-neo-neon/10 border-neo-neon/30' : 'text-gray-500 bg-white/5 border-white/10'}`}>
             {isAutoSpeak ? <Volume2 size={18}/> : <VolumeX size={18}/>}
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
           {['general', 'vastu', 'feng-shui', 'interior'].map(id => (
             <button key={id} onClick={() => setIntent(id as any)} className={`flex-1 min-w-[95px] flex items-center justify-center gap-2 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${intent === id ? 'bg-neo-neon border-neo-neon text-white shadow-neo-glow' : 'bg-white/5 border-white/5 text-gray-500 hover:text-gray-300'}`}>
                {id}
             </button>
           ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide z-10 bg-black/10">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
             <div className="flex gap-4 max-w-[92%]">
                {m.sender === 'bot' && <div className="w-10 h-10 rounded-2xl bg-neo-neon/10 border border-neo-neon/20 flex items-center justify-center text-neo-neon shrink-0 shadow-sm"><Bot size={20} /></div>}
                <div className={`px-6 py-4 rounded-[32px] shadow-glass-3d ${m.sender === 'user' ? 'bg-gradient-to-br from-neo-neon to-indigo-700 text-white rounded-tr-none' : 'bg-neo-glass text-gray-200 rounded-tl-none border border-white/10'}`}>
                  {m.image === 'PENDING' ? (
                    <div className="w-full h-48 rounded-2xl bg-white/5 flex flex-col items-center justify-center gap-4 mb-6 border border-dashed border-white/10 animate-pulse">
                      <ImageIcon size={32} className="text-gray-600" />
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Synthesizing Visualization...</p>
                    </div>
                  ) : m.image ? (
                    <div className="rounded-2xl overflow-hidden mb-6 border border-white/10 shadow-neo-glow animate-in zoom-in duration-700">
                      <img src={m.image} className="w-full h-auto object-cover" alt="Viz" />
                    </div>
                  ) : null}
                  {m.sender === 'bot' ? renderDeepSeekContent(m.text, (m as any).isSystem) : <p className="text-sm font-medium leading-relaxed">{m.text}</p>}
                </div>
             </div>
          </div>
        ))}
        {interimValue && <div className="flex justify-end"><div className="bg-neo-pink/20 text-white px-7 py-4 rounded-[28px] animate-pulse text-xs font-black uppercase tracking-widest border border-neo-pink/30">{interimValue}...</div></div>}
        {isLoading && <div className="max-w-[440px] animate-in fade-in zoom-in duration-500"><LoadingInsights /></div>}
        <div ref={scrollRef} className="h-8" />
      </div>

      <div className="p-8 bg-neo-glass/80 backdrop-blur-3xl border-t border-white/10 z-20">
        <div className="relative flex gap-4">
          <button onClick={toggleListening} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isListening ? 'bg-neo-pink text-white shadow-pink-glow animate-pulse scale-110' : 'bg-white/5 text-gray-400'}`}>
            {isListening ? <MicOff size={24}/> : <Mic size={24}/>}
          </button>
          <input 
            type="text" placeholder="Type micro-market details or ask expert tips..." 
            className="flex-1 h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold text-white outline-none focus:border-neo-neon transition-all"
            value={inputValue} onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={() => handleSend()} disabled={!inputValue.trim() || isLoading} className="w-14 h-14 bg-neo-neon rounded-2xl flex items-center justify-center text-white shadow-neo-glow disabled:opacity-20 transition-all hover:scale-105 active:scale-95">
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyChat;