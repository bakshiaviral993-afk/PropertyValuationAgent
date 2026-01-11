import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Mic, MicOff, Trash2, Volume2, VolumeX, Compass, Paintbrush, Wind, Headphones, Image as ImageIcon, Loader2, Info, AlertCircle, Zap, Hash, ChevronRight } from 'lucide-react';
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
  const [isHandsFree, setIsHandsFree] = useState(false);
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
    setMessages([{ id: 'init', sender: 'bot', text }]);
  }, [lang, intent]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimValue]);

  const handleSend = async (text?: string) => {
    const messageText = text || inputValue;
    if (!messageText.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, sender: 'user', text: messageText };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setInterimValue('');
    setIsLoading(true);

    try {
      const responseText = await askPropertyQuestion([...messages, userMsg], contextResult, lang, intent);
      
      let generatedImg: string | undefined = undefined;
      if (intent === 'interior' || intent === 'vastu') {
        const tipMatch = responseText.match(/- Tip:([\s\S]*?)- Details:/i);
        const imgPrompt = tipMatch ? tipMatch[1].trim() : messageText;
        generatedImg = await generatePropertyImage(`${intent} design visualization: ${imgPrompt}`) || undefined;
      }

      const botMsg: ChatMessage = { 
        id: `b-${Date.now()}`, 
        sender: 'bot', 
        text: responseText,
        image: generatedImg
      };
      setMessages(prev => [...prev, botMsg]);
      
      if (isAutoSpeak || isHandsFree) {
        const speakText = responseText.replace(/^[•\-\*\s]+|^- Tip:|^Details:|^Suggestions:|- Details:|- Suggestions:/gmi, '').trim();
        speak(speakText, lang === 'HI' ? 'hi-IN' : 'en-IN', () => {
          if (isHandsFree) setTimeout(() => toggleListening(), 1000);
        });
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: `e-${Date.now()}`, sender: 'bot', text: "Neural link lost. Please repeat." }]);
    } finally {
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

  const renderDeepSeekContent = (text: string) => {
    const lines = text.split('\n');
    const tipLine = lines.find(l => l.toLowerCase().includes('- tip:'));
    const detailsIdx = lines.findIndex(l => l.toLowerCase().includes('- details:'));
    const sugIdx = lines.findIndex(l => l.toLowerCase().includes('- suggestions:'));

    // Robust Fallback: If no headers found, render raw text as paragraphs or bullets
    if (!tipLine && detailsIdx === -1 && sugIdx === -1) {
      return (
        <div className="space-y-3">
          {lines.filter(l => l.trim()).map((line, i) => (
            <p key={i} className="text-sm font-medium leading-relaxed">
              {line.startsWith('-') || line.startsWith('*') || line.startsWith('•') ? (
                <span className="flex gap-2">
                  <ChevronRight size={14} className="text-neo-neon shrink-0 mt-1" />
                  {line.replace(/^[-*•]\s*/, '')}
                </span>
              ) : line}
            </p>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {tipLine && (
          <div className="bg-neo-neon/10 border-l-4 border-neo-neon p-4 rounded-r-xl">
             <span className="text-[8px] font-black uppercase text-neo-neon block mb-1">Expert Advice</span>
             <p className="text-sm font-black text-white">{tipLine.split(':').slice(1).join(':').trim()}</p>
          </div>
        )}
        
        {detailsIdx !== -1 && (
          <div className="space-y-2">
            <span className="text-[8px] font-black uppercase text-gray-500 block">Analysis Breakdown</span>
            <ul className="space-y-2">
              {lines.slice(detailsIdx+1, sugIdx !== -1 ? sugIdx : undefined)
                .map(l => l.replace(/^[•\-\*\d\.\s]+/, '').trim())
                .filter(l => l.length > 2)
                .map((d, i) => (
                  <li key={i} className="text-xs text-gray-300 flex gap-2 leading-relaxed">
                    <ChevronRight size={14} className="text-neo-neon shrink-0 mt-0.5" />
                    {d}
                  </li>
                ))}
            </ul>
          </div>
        )}

        {sugIdx !== -1 && (
          <div className="pt-4 border-t border-white/5 space-y-2">
             <span className="text-[8px] font-black uppercase text-neo-pink block">Suggestions</span>
             <div className="flex flex-wrap gap-2">
                {lines.slice(sugIdx+1)
                  .map(l => l.replace(/^[•\-\*\d\.\s]+/, '').trim())
                  .filter(l => l.length > 5)
                  .map((s, i) => (
                    <button key={i} onClick={() => handleSend(s)} className="px-3 py-1.5 bg-neo-pink/5 border border-neo-pink/20 rounded-lg text-[9px] font-bold text-neo-pink hover:bg-neo-pink hover:text-white transition-all flex items-center gap-1">
                      <Hash size={10}/> {s}
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
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-all ${isListening ? 'bg-neo-pink shadow-pink-glow' : 'bg-neo-neon/10'}`}>
              <Bot className={isListening ? "text-white" : "text-neo-neon"} size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tighter uppercase leading-none">Expert Bot</h2>
              <span className="text-[7px] text-gray-500 font-black uppercase tracking-[0.4em]">Logical Engine Active</span>
            </div>
          </div>
          <div className="flex gap-2">
             <button onClick={() => setIsAutoSpeak(!isAutoSpeak)} className={`p-2 rounded-xl border transition-all ${isAutoSpeak ? 'text-neo-neon bg-neo-neon/10 border-neo-neon/30' : 'text-gray-500 bg-white/5 border-white/10'}`}>
               {isAutoSpeak ? <Volume2 size={18}/> : <VolumeX size={18}/>}
             </button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
           {['general', 'vastu', 'feng-shui', 'interior'].map(id => (
             <button key={id} onClick={() => setIntent(id as any)} className={`flex-1 min-w-[85px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${intent === id ? 'bg-neo-neon border-neo-neon text-white' : 'bg-white/5 border-white/5 text-gray-500'}`}>
                {id}
             </button>
           ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide z-10">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
             <div className="flex gap-3 max-w-[90%]">
                {m.sender === 'bot' && <div className="w-8 h-8 rounded-xl bg-neo-neon/10 border border-neo-neon/20 flex items-center justify-center text-neo-neon shrink-0"><Bot size={16} /></div>}
                <div className={`px-5 py-3 rounded-[24px] shadow-sm ${m.sender === 'user' ? 'bg-neo-neon text-white rounded-tr-none' : 'bg-neo-glass text-gray-200 rounded-tl-none border border-white/10'}`}>
                  {m.image && <img src={m.image} className="w-full rounded-xl mb-4" />}
                  {m.sender === 'bot' ? renderDeepSeekContent(m.text) : <p className="text-sm font-medium">{m.text}</p>}
                </div>
             </div>
          </div>
        ))}
        {interimValue && <div className="flex justify-end"><div className="bg-neo-pink/20 text-white px-5 py-3 rounded-2xl animate-pulse text-xs font-bold">{interimValue}...</div></div>}
        {isLoading && <LoadingInsights />}
        <div ref={scrollRef} />
      </div>

      <div className="p-8 bg-neo-glass border-t border-white/5 z-20">
        <div className="relative flex gap-3">
          <button onClick={toggleListening} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isListening ? 'bg-neo-pink text-white' : 'bg-white/5 text-gray-400'}`}>
            {isListening ? <MicOff size={24}/> : <Mic size={24}/>}
          </button>
          <input 
            type="text" placeholder="Describe context or ask details..." 
            className="flex-1 h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold text-white outline-none focus:border-neo-neon"
            value={inputValue} onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={() => handleSend()} disabled={!inputValue.trim() || isLoading} className="w-14 h-14 bg-neo-neon rounded-2xl flex items-center justify-center text-white shadow-neo-glow disabled:opacity-20 transition-all">
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyChat;