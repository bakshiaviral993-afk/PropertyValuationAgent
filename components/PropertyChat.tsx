
import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Mic, MicOff, Trash2, Volume2, VolumeX, Compass, Paintbrush, Wind, Headphones, Image as ImageIcon, Loader2, Info, AlertCircle, Zap } from 'lucide-react';
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

  useEffect(() => {
    return () => {
      voiceInputRef.current?.stop();
    };
  }, []);

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
      const botMsg: ChatMessage = { id: `b-${Date.now()}`, sender: 'bot', text: responseText };
      setMessages(prev => [...prev, botMsg]);
      
      if (isAutoSpeak || isHandsFree) {
        speak(responseText, lang === 'HI' ? 'hi-IN' : 'en-IN', () => {
          if (isHandsFree) {
            setTimeout(() => toggleListening(), 1000);
          }
        });
      }
    } catch (err) {
      const errMsg: ChatMessage = { id: `e-${Date.now()}`, sender: 'bot', text: "Neural link interrupted. Please repeat." };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      voiceInputRef.current?.stop();
      setIsListening(false);
      setMicVolume(0);
      setInterimValue('');
      return;
    }

    voiceInputRef.current = new SpeechInput(
      (text, isFinal) => {
        if (isFinal) {
          setInputValue(text);
          setInterimValue('');
          handleSend(text);
          toggleListening();
        } else {
          setInterimValue(text);
        }
      },
      () => {
        setIsListening(false);
        setMicVolume(0);
      },
      (volume) => setMicVolume(volume),
      lang === 'HI' ? 'hi-IN' : 'en-IN'
    );

    setIsListening(true);
    voiceInputRef.current.start();
  };

  return (
    <div className="h-full flex flex-col bg-neo-bg rounded-[48px] shadow-neo-glow overflow-hidden border border-white/10 relative">
      <div className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-[120px] pointer-events-none transition-all duration-1000 ${isListening ? 'bg-neo-pink/20 opacity-100' : 'bg-neo-neon/10 opacity-50'}`} />
      
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/5 bg-neo-glass/40 backdrop-blur-xl z-20">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-all duration-300 relative ${isListening ? 'bg-neo-pink shadow-pink-glow scale-110' : 'bg-neo-neon/10'}`}>
              {isHandsFree ? <Headphones className="text-white" size={20} /> : <Bot className="text-neo-neon" size={20} />}
              {isListening && micVolume > 20 && (
                <div className="absolute -inset-2 bg-neo-pink/30 rounded-2xl animate-ping" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tighter uppercase leading-none">Expert Bot</h2>
              <span className="text-[7px] text-gray-500 font-black uppercase tracking-[0.4em]">
                {isListening ? (micVolume > 5 ? 'Direct Hardware Sync' : 'Capturing Baseline...') : 'Neural Link Active'}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
             <button onClick={() => setIsHandsFree(!isHandsFree)} className={`p-2 rounded-xl border transition-all ${isHandsFree ? 'bg-neo-pink/20 border-neo-pink text-neo-pink' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}>
               <Headphones size={18}/>
             </button>
             <button onClick={() => setIsAutoSpeak(!isAutoSpeak)} className={`p-2 rounded-xl border transition-all ${isAutoSpeak ? 'text-neo-neon bg-neo-neon/10 border-neo-neon/30' : 'text-gray-500 bg-white/5 border-white/10'}`}>
               {isAutoSpeak ? <Volume2 size={18}/> : <VolumeX size={18}/>}
             </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
           {['general', 'vastu', 'feng-shui', 'interior'].map(id => (
             <button key={id} onClick={() => setIntent(id as any)} className={`flex-1 min-w-[85px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${intent === id ? 'bg-neo-neon border-neo-neon text-white shadow-neo-glow' : 'bg-white/5 border-white/5 text-gray-500'}`}>
                {id === 'vastu' ? <Compass size={14}/> : id === 'feng-shui' ? <Wind size={14}/> : id === 'interior' ? <Paintbrush size={14}/> : <Bot size={14}/>}
                {id}
             </button>
           ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide z-10">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
             <div className="flex gap-3 max-w-[90%]">
                {m.sender === 'bot' && <div className="w-8 h-8 rounded-xl bg-neo-neon/10 border border-neo-neon/20 flex items-center justify-center text-neo-neon shrink-0"><Bot size={16} /></div>}
                <div className={`px-5 py-3 rounded-[24px] text-sm font-medium leading-relaxed shadow-sm ${m.sender === 'user' ? 'bg-gradient-to-br from-neo-neon to-blue-600 text-white rounded-tr-none shadow-neo-glow' : 'bg-neo-glass text-gray-200 rounded-tl-none border border-white/10'}`}>
                  {m.text}
                </div>
             </div>
          </div>
        ))}
        {interimValue && (
          <div className="flex justify-end">
            <div className="bg-neo-pink/10 border border-neo-pink/30 text-white px-5 py-3 rounded-[24px] rounded-tr-none text-sm font-bold shadow-pink-glow animate-pulse">
              {interimValue}...
            </div>
          </div>
        )}
        {isLoading && <LoadingInsights />}
        <div ref={scrollRef} />
      </div>

      {/* Hardware Pulse Visualizer */}
      {isListening && (
        <div className="absolute bottom-32 left-0 right-0 flex justify-center items-end gap-1.5 px-10 pointer-events-none h-24 z-30">
           {[...Array(16)].map((_, i) => {
             const height = Math.max(6, (micVolume * (0.4 + Math.random() * 1.2)) / 1.5);
             return (
               <div 
                 key={i} 
                 className="w-2 bg-neo-pink rounded-full transition-all duration-75 shadow-pink-glow"
                 style={{ 
                    height: `${height}px`, 
                    opacity: 0.2 + (micVolume/60),
                    transform: `scaleY(${1 + (micVolume/300)})` 
                 }}
               />
             );
           })}
        </div>
      )}

      {/* Input Module */}
      <div className="p-8 bg-neo-glass/80 backdrop-blur-2xl border-t border-white/5 z-20">
        <div className="relative flex gap-3">
          <button 
            onClick={toggleListening}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border relative overflow-hidden ${isListening ? 'bg-neo-pink border-neo-pink text-white shadow-pink-glow' : 'bg-white/5 border-white/10 text-gray-400 hover:text-neo-neon'}`}
          >
            {isListening ? <MicOff size={24} className="z-10"/> : <Mic size={24} className="z-10"/>}
            {isListening && (
               <div 
                 className="absolute inset-0 bg-white/10 transition-transform duration-100 origin-bottom" 
                 style={{ transform: `scaleY(${Math.min(1, micVolume/100)})` }}
               />
            )}
          </button>
          <div className="flex-1 relative">
            <input 
              type="text"
              placeholder={isListening ? (micVolume > 5 ? "Direct Sync Active..." : "Listening...") : "Ask anything..."}
              className={`w-full h-14 bg-white/5 border rounded-2xl px-6 text-sm font-bold text-white outline-none placeholder:text-gray-600 transition-all ${isListening ? 'border-neo-pink ring-1 ring-neo-pink/30 shadow-pink-glow-sm' : 'border-white/10 focus:border-neo-neon'}`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
          </div>
          <button 
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isLoading}
            className="w-14 h-14 bg-neo-neon rounded-2xl flex items-center justify-center text-white shadow-neo-glow disabled:opacity-20 active:scale-95 transition-transform"
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyChat;
