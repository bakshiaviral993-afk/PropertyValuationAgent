
import React, { useState, useEffect, useRef } from 'react';
import { Send, ShieldCheck, Zap, Bot, X, Volume2, VolumeX, MessageSquare, ArrowRight } from 'lucide-react';
import { ChatMessage, AppLang } from '../types';
import { askCibilExpert } from '../services/geminiService';
import LoadingInsights from './LoadingInsights';
import { speak } from '../services/voiceService';

interface CibilCoachProps {
  currentScore: number;
  lang: AppLang;
  onClose: () => void;
}

const CibilCoach: React.FC<CibilCoachProps> = ({ currentScore, lang, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [options, setOptions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasInited = useRef(false);

  useEffect(() => {
    if (hasInited.current) return;
    hasInited.current = true;
    
    const initText = lang === 'HI' 
      ? `आपका सिबिल स्कोर ${currentScore} है। इसे सुधारने के लिए हमें गहराई से जांच करनी होगी। क्या आपने पिछले 24 महीनों में कोई भुगतान मिस किया है?`
      : `Your CIBIL score is ${currentScore}. Let's diagnose the primary cause. Have you missed any loan or credit card payments in the last 24 months?`;
    
    setMessages([{ id: 'start', sender: 'bot', text: initText }]);
    setOptions(['Yes', 'No', 'Not Sure', 'Check My Report']);
    if (autoSpeak) speak(initText, lang === 'HI' ? 'hi-IN' : 'en-IN');
  }, [lang, currentScore]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (val?: string) => {
    const textToSend = val || inputValue;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, sender: 'user', text: textToSend };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue('');
    setOptions([]);
    setIsLoading(true);

    try {
      const response = await askCibilExpert(updatedMessages, currentScore);
      
      // Improved option parsing
      const optionsMatch = response.match(/OPTIONS:\s*\[?(.*?)\]?$/i);
      let foundOptions = ['Yes', 'No', 'Explain More'];
      
      if (optionsMatch) {
        const rawOpts = optionsMatch[1].split(',').map(o => o.replace(/[\[\]"]/g, '').trim());
        if (rawOpts.length > 0) foundOptions = rawOpts;
      } else if (response.includes('?') || response.toLowerCase().includes('have you')) {
        foundOptions = ['Yes', 'No', 'Sometimes'];
      }
      
      const cleanResponse = response.replace(/OPTIONS:.*$/i, '').trim();
      setMessages(prev => [...prev, { id: `b-${Date.now()}`, sender: 'bot', text: cleanResponse }]);
      setOptions(foundOptions);
      
      if (autoSpeak) speak(cleanResponse, lang === 'HI' ? 'hi-IN' : 'en-IN');
    } catch (e) {
      setMessages(prev => [...prev, { id: `e-${Date.now()}`, sender: 'bot', text: "Neural link lost. Retrying diagnostic protocol..." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-neo-bg border border-white/10 rounded-[40px] flex flex-col h-full overflow-hidden shadow-neo-glow animate-in zoom-in duration-500">
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/5 bg-neo-glass/40 backdrop-blur-xl flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-neo-pink/10 rounded-2xl text-neo-pink shadow-pink-glow">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Credit Repair AI</h2>
            <span className="text-[8px] text-neo-pink font-black uppercase tracking-[0.4em]">Recovery_Protocol_Online</span>
          </div>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setAutoSpeak(!autoSpeak)}
             className={`p-2 rounded-xl border transition-all ${autoSpeak ? 'bg-neo-pink/20 border-neo-pink text-neo-pink' : 'text-gray-500 border-white/10'}`}
           >
             {autoSpeak ? <Volume2 size={20}/> : <VolumeX size={20}/>}
           </button>
           <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-all"><X size={20} /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide bg-black/20">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
            <div className="flex gap-3 max-w-[85%]">
              {m.sender === 'bot' && (
                <div className="w-8 h-8 rounded-lg bg-neo-pink/10 border border-neo-pink/20 flex items-center justify-center text-neo-pink shrink-0">
                  <Bot size={14} />
                </div>
              )}
              <div className={`px-5 py-3 rounded-[24px] text-sm font-medium leading-relaxed ${
                m.sender === 'user' 
                  ? 'bg-neo-pink text-white rounded-tr-none shadow-pink-glow' 
                  : 'bg-white/5 text-gray-200 rounded-tl-none border border-white/5'
              }`}>
                {m.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && <div className="flex justify-start"><LoadingInsights /></div>}
        <div ref={scrollRef} />
      </div>

      {/* Answer Selection Bubbles */}
      {!isLoading && options.length > 0 && (
        <div className="px-8 py-4 flex flex-wrap gap-2 animate-in slide-in-from-bottom-4">
           {options.map(opt => (
             <button
               key={opt}
               onClick={() => handleSend(opt)}
               className="px-6 py-3 bg-neo-pink/10 border border-neo-pink/20 rounded-full text-[10px] font-black uppercase text-neo-pink hover:bg-neo-pink hover:text-white transition-all shadow-pink-glow flex items-center gap-2"
             >
               <MessageSquare size={12} /> {opt}
             </button>
           ))}
        </div>
      )}

      {/* Input Module */}
      <div className="p-8 bg-neo-glass border-t border-white/5">
        <div className="relative flex gap-3">
          <input 
            type="text"
            placeholder="Type your explanation..."
            className="flex-1 h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold text-white outline-none focus:border-neo-pink"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />
          <button 
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isLoading}
            className="w-14 h-14 bg-neo-pink rounded-2xl flex items-center justify-center text-white shadow-pink-glow active:scale-95 transition-all"
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CibilCoach;
