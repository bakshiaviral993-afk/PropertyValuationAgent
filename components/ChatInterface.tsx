import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, AppMode, WizardStep, AppLang } from '../types';
import { Send, ChevronLeft, Mic, MicOff, Edit2, History, Loader2, Sparkles, Edit3, IndianRupee } from 'lucide-react';
import LoadingInsights from './LoadingInsights';
import { SpeechInput } from '../services/voiceService';
import { resolveLocalityData, formatPrice } from '../services/geminiService';

interface ChatInterfaceProps {
  onComplete: (data: any) => void;
  isLoading: boolean;
  mode: AppMode;
  lang: AppLang;
}

const CITY_LOCALITY_MAP: Record<string, { localities: string[], pincodes: Record<string, string[]> }> = {
  'Mumbai': {
    localities: ['Bandra West', 'Worli', 'Andheri West', 'Powai', 'Juhu', 'Colaba'],
    pincodes: { 
      'Bandra West': ['400050'], 
      'Worli': ['400018'], 
      'Andheri West': ['400053'],
      'Powai': ['400076'],
      'Juhu': ['400049'],
      'Colaba': ['400005']
    }
  },
  'Pune': {
    localities: ['Kharadi', 'Baner', 'Wagholi', 'Hinjewadi'],
    pincodes: { 
      'Kharadi': ['411014'], 
      'Baner': ['411045'], 
      'Wagholi': ['412207'],
      'Hinjewadi': ['411057']
    }
  },
  'Delhi': {
    localities: ['Rajouri Garden', 'Connaught Place', 'Dwarka', 'Saket', 'Vasant Kunj', 'Karol Bagh'],
    pincodes: {
      'Rajouri Garden': ['110027'],
      'Connaught Place': ['110001'],
      'Dwarka': ['110075'],
      'Saket': ['110017'],
      'Vasant Kunj': ['110070'],
      'Karol Bagh': ['110005']
    }
  }
};

const COMMON_CITIES = Object.keys(CITY_LOCALITY_MAP).concat(['Bangalore', 'Hyderabad', 'Chennai', 'Kolkata']);

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onComplete, isLoading, mode, lang }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<any[]>([]); 
  const [isListening, setIsListening] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isManualEntry, setIsManualEntry] = useState(false);

  const getSteps = (): WizardStep[] => {
    const baseSteps: WizardStep[] = [
      { field: 'city', question: lang === 'HI' ? "नमस्ते! आप किस शहर में हैं?" : "Namaste! Which city are you in?", type: 'city-picker' },
      { field: 'area', question: lang === 'HI' ? "अपना इलाका चुनें या दर्ज करें:" : "Pick or type your Locality:", type: 'locality-picker' },
      { field: 'pincode', question: lang === 'HI' ? "पिन कोड दर्ज करें:" : "Enter PIN code:", type: 'number', placeholder: 'e.g. 400050' },
    ];

    if (mode === 'essentials') return baseSteps;

    if (mode === 'land') {
      return [
        ...baseSteps,
        { field: 'unit', question: "Select Plot Unit:", type: 'select', options: ['sqft', 'Acres', 'sq. yds'] },
        { field: 'plotSize', question: "Enter Plot Area:", type: 'number' },
        { field: 'fsi', question: "Permissible FSI (if known, else 1.0):", type: 'number' },
      ];
    }

    if (mode === 'commercial') {
      return [
        ...baseSteps,
        { field: 'type', question: "Property Type?", type: 'select', options: ['Shop', 'Office', 'Warehouse'] },
        { field: 'intent', question: "Buy, Rent or Lease?", type: 'select', options: ['Buy', 'Rent', 'Lease'] },
        { field: 'sqft', question: "Area in Sqft?", type: 'number' },
      ];
    }

    return [
      ...baseSteps,
      { field: 'bhk', question: "How many bedrooms (BHK)?", type: 'select', options: ['1 BHK', '2 BHK', '3 BHK', '4+ BHK'] },
      { field: 'facing', question: "What is the preferred facing?", type: 'select', options: ['North', 'East', 'West', 'South', 'North-East', 'Any'] },
      { 
        field: 'budget', 
        question: mode === 'rent' ? "What is your monthly rent budget?" : "What is your investment budget (₹0 Cr - ₹10 Cr)?", 
        type: 'price-range', 
        min: 0, 
        max: mode === 'rent' ? 500000 : 100000000, 
        step: mode === 'rent' ? 1000 : 500000 
      },
      { field: 'sqft', question: "House size (sq. ft.):", type: 'number' },
    ];
  };

  const steps = getSteps();
  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    setMessages([{ id: 'start', sender: 'bot', text: steps[0].question }]);
  }, [lang, mode]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleEditMessage = (index: number) => {
    if (messages[index].sender !== 'user') return;
    const stepIdx = Math.floor(index / 2);
    const field = steps[stepIdx].field;
    const oldValue = formData[field];
    setHistory(prev => [...prev, { field, oldValue, timestamp: Date.now() }]);
    setCurrentStepIndex(stepIdx);
    setInputValue(String(oldValue));
    setIsManualEntry(true);
    setMessages(prev => prev.slice(0, index)); 
  };

  const handleNext = async (val: any) => {
    if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) return;
    
    let normalizedVal = (typeof val === 'string') ? val.trim() : val;
    let nextFormData = { ...formData, [currentStep.field]: normalizedVal };

    setMessages(prev => [...prev, { 
      id: `u-${Date.now()}`, 
      sender: 'user', 
      text: currentStep.type === 'price-range' ? formatPrice(Number(normalizedVal)) : String(normalizedVal) 
    }]);

    // Handle City to Area Transition
    if (currentStep.field === 'city') {
      setIsResolving(true);
      const cityKey = Object.keys(CITY_LOCALITY_MAP).find(k => k.toLowerCase() === String(normalizedVal).toLowerCase());
      let discoveredLocalities = cityKey ? CITY_LOCALITY_MAP[cityKey].localities : [];
      
      if (discoveredLocalities.length === 0) {
        discoveredLocalities = await resolveLocalityData('major localities', String(normalizedVal));
      }
      setIsResolving(false);
      setSuggestions(discoveredLocalities);
      setFormData(nextFormData);
      setCurrentStepIndex(1);
      setMessages(prev => [...prev, { id: `b-area-${Date.now()}`, sender: 'bot', text: steps[1].question }]);
      setInputValue('');
      return;
    }

    // Handle Area to PIN Transition (The FIX)
    if (currentStep.field === 'area') {
      const cityKey = Object.keys(CITY_LOCALITY_MAP).find(k => k.toLowerCase() === nextFormData.city.toLowerCase());
      const cityData = cityKey ? CITY_LOCALITY_MAP[cityKey] : null;
      let autoPincode = null;

      if (cityData?.pincodes) {
        const areaKey = Object.keys(cityData.pincodes).find(k => k.toLowerCase() === String(normalizedVal).toLowerCase());
        if (areaKey) autoPincode = cityData.pincodes[areaKey][0];
      }

      if (!autoPincode && !isManualEntry) {
        setIsResolving(true);
        try {
          const aiResult = await resolveLocalityData(String(normalizedVal), nextFormData.city, 'pincode');
          autoPincode = aiResult.find(s => /^\d{6}$/.test(s));
        } catch (e) { console.warn("AI PIN resolution failed", e); }
        setIsResolving(false);
      }

      if (autoPincode) {
        const updatedWithAuto = { ...nextFormData, pincode: autoPincode };
        setFormData(updatedWithAuto);
        setMessages(prev => [...prev, { 
          id: `b-auto-${Date.now()}`, 
          sender: 'bot', 
          text: lang === 'HI' ? `पिन कोड पाया गया: ${autoPincode}` : `Auto-filled PIN: ${autoPincode}` 
        }]);

        if (mode === 'essentials') { onComplete(updatedWithAuto); return; }

        const nextIdx = 3; 
        if (nextIdx < steps.length) {
          setCurrentStepIndex(nextIdx);
          setTimeout(() => {
            setMessages(prev => [...prev, { id: `b-next-${Date.now()}`, sender: 'bot', text: steps[nextIdx].question }]);
          }, 300);
          setInputValue('');
          setSuggestions([]);
          setIsManualEntry(false);
          return;
        } else {
          onComplete(updatedWithAuto);
          return;
        }
      }
    }

    // Default Sequential flow
    setFormData(nextFormData);
    let nextIdx = currentStepIndex + 1;
    setInputValue('');
    setSuggestions([]); 
    setIsManualEntry(false);

    if (nextIdx < steps.length) {
      setCurrentStepIndex(nextIdx);
      setTimeout(() => {
        setMessages(prev => [...prev, { id: `b-${Date.now()}`, sender: 'bot', text: steps[nextIdx].question }]);
      }, 300);
    } else {
      onComplete(nextFormData);
    }
  };

  const toggleListening = () => {
    if (isListening) return;
    const voiceInput = new SpeechInput((text, isFinal) => {
        if (isFinal) { setInputValue(text); handleNext(text); }
      }, () => setIsListening(false), () => {}, lang === 'HI' ? 'hi-IN' : 'en-IN'
    );
    setIsListening(true);
    voiceInput.start();
  };

  return (
    <div className="h-full flex flex-col bg-neo-bg rounded-[48px] shadow-neo-glow overflow-hidden border border-white/10 relative">
      <div className="px-10 py-8 border-b border-white/5 bg-neo-glass/40 backdrop-blur-xl">
        <div className="flex justify-between items-center mb-6">
          <button disabled={currentStepIndex === 0 || isResolving} onClick={() => setCurrentStepIndex(currentStepIndex - 1)} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl text-neo-neon disabled:opacity-20 transition-all">
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <span className="text-[10px] font-black text-neo-neon uppercase tracking-[0.4em]">
              {mode.toUpperCase()}_SCAN • {currentStepIndex + 1}/{steps.length}
            </span>
          </div>
          <button onClick={toggleListening} className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isListening ? 'bg-neo-pink text-white animate-pulse' : 'bg-white/5 text-gray-500'}`}>
            {isListening ? <MicOff size={20}/> : <Mic size={20}/>}
          </button>
        </div>
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-neo-neon to-neo-pink transition-all duration-1000" style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
        {messages.map((m, idx) => (
          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 group`}>
            <div className={`relative max-w-[85%] px-6 py-4 rounded-[24px] text-sm font-medium ${
              m.sender === 'user' 
                ? 'bg-gradient-to-br from-neo-neon to-blue-600 text-white rounded-tr-none' 
                : 'bg-white/5 text-gray-200 rounded-tl-none border border-white/5'
            }`}>
              {m.text}
              {m.sender === 'user' && (
                <button 
                  onClick={() => handleEditMessage(idx)}
                  className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all text-neo-neon hover:text-white"
                  title="Edit entry"
                >
                  <Edit2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
        {history.length > 0 && (
          <div className="flex items-center gap-2 text-[8px] font-black text-gray-600 uppercase tracking-widest px-4">
            <History size={10} /> {history.length} Revisions Logged
          </div>
        )}
        {(isLoading || isResolving) && <LoadingInsights />}
        <div ref={scrollRef} />
      </div>

      <div className="p-10 bg-neo-glass/60 backdrop-blur-2xl border-t border-white/5">
        {!isLoading && !isResolving && currentStep && (
          <div className="space-y-5">
            {suggestions.length > 0 && currentStep.field === 'area' && (
              <div className="flex flex-wrap gap-2 mb-4">
                 {suggestions.map(s => (
                   <button key={s} onClick={() => handleNext(s)} className="h-10 px-5 rounded-xl bg-neo-neon/20 border border-neo-neon/40 text-xs font-black text-white hover:bg-neo-neon">{s}</button>
                 ))}
                 <button onClick={() => setIsManualEntry(true)} className="h-10 px-5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-400">Manual Entry</button>
              </div>
            )}
            
            {currentStep.type === 'city-picker' && !isManualEntry && (
              <div className="flex flex-wrap gap-2">
                {COMMON_CITIES.map(c => (
                  <button key={c} onClick={() => handleNext(c)} className="h-10 px-5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-200 hover:border-neo-neon">{c}</button>
                ))}
              </div>
            )}

            {currentStep.type === 'price-range' && (
              <div className="space-y-6 animate-in zoom-in duration-300">
                <div className="flex justify-between items-center bg-white/5 px-6 py-4 rounded-2xl border border-white/10">
                   <IndianRupee size={16} className="text-neo-neon" />
                   <span className="text-xl font-black text-white tracking-tighter">
                     {formatPrice(Number(inputValue) || 0)}
                   </span>
                </div>
                <input 
                  type="range" 
                  min={currentStep.min} 
                  max={currentStep.max} 
                  step={currentStep.step} 
                  value={inputValue || 0}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neo-neon"
                />
                <button 
                  onClick={() => handleNext(inputValue || 0)} 
                  className="w-full py-5 bg-neo-neon text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-neo-glow hover:scale-[1.02] transition-all"
                >
                  Set Budget Selection
                </button>
              </div>
            )}

            {(isManualEntry || (currentStep.type !== 'city-picker' && currentStep.type !== 'select' && currentStep.type !== 'price-range' && suggestions.length === 0)) && (
               <div className="relative flex gap-3 animate-in fade-in duration-300">
                <input 
                  autoFocus 
                  type={currentStep.type === 'number' ? 'number' : 'text'}
                  placeholder={currentStep.placeholder || `Enter ${currentStep.field}...`}
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-neo-neon outline-none" 
                  value={inputValue} 
                  onChange={(e) => setInputValue(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleNext(inputValue)} 
                />
                <button onClick={() => handleNext(inputValue)} className="w-14 h-14 bg-neo-neon rounded-2xl flex items-center justify-center text-white shadow-neo-glow"><Send size={20} /></button>
              </div>
            )}

            {currentStep.type === 'select' && (
              <div className="flex flex-wrap gap-3">
                {currentStep.options?.map(o => (
                  <button key={o} onClick={() => handleNext(o)} className="flex-1 min-w-[100px] h-12 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-gray-200 hover:border-neo-neon transition-all">{o}</button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;