
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, AppMode, WizardStep, AppLang } from '../types';
import { Send, MapPin, ChevronLeft, Mic, Home, CheckCircle, Search, Sparkles, Hash, Plus, Check, Edit3, Navigation } from 'lucide-react';
import LoadingInsights from './LoadingInsights';

interface ChatInterfaceProps {
  onComplete: (data: any) => void;
  isLoading: boolean;
  mode: AppMode;
  lang: AppLang;
}

// Expanded dataset for auto-population
const CITY_LOCALITY_MAP: Record<string, { localities: string[], pincodes: Record<string, string[]> }> = {
  'Mumbai': {
    localities: ['Bandra West', 'Worli', 'Andheri West', 'Powai', 'Juhu', 'Colaba', 'Borivali', 'Dadar', 'Malad', 'Khar'],
    pincodes: { 
      'Bandra West': ['400050', '400051'], 
      'Worli': ['400018', '400030'], 
      'Andheri West': ['400053', '400058'],
      'Powai': ['400076'],
      'Juhu': ['400049'],
      'Colaba': ['400001', '400005'],
      'Borivali': ['400091', '400092'],
      'Dadar': ['400014', '400028'],
      'Malad': ['400064', '400097'],
      'Khar': ['400052']
    }
  },
  'Delhi': {
    localities: ['Dwarka', 'Saket', 'Vasant Kunj', 'Rohini', 'Janakpuri', 'Connaught Place', 'South Extension'],
    pincodes: { 
      'Dwarka': ['110075', '110078'], 
      'Saket': ['110017'], 
      'Vasant Kunj': ['110070']
    }
  },
  'Bangalore': {
    localities: ['Whitefield', 'Indiranagar', 'Koramangala', 'HSR Layout', 'Hebbal', 'Jayanagar', 'Electronic City', 'Marathahalli'],
    pincodes: { 
      'Whitefield': ['560066', '560067'], 
      'Indiranagar': ['560008', '560038'], 
      'Koramangala': ['560034', '560095'],
      'HSR Layout': ['560102']
    }
  },
  'Pune': {
    localities: ['Kharadi', 'Baner', 'Wagholi', 'Hinjewadi', 'Kothrud', 'Viman Nagar', 'Hadapsar', 'Aundh', 'Pimple Saudagar'],
    pincodes: { 
      'Kharadi': ['411014'], 
      'Baner': ['411045'], 
      'Wagholi': ['412207'],
      'Hinjewadi': ['411057'],
      'Kothrud': ['411038']
    }
  },
  'Hyderabad': {
    localities: ['Gachibowli', 'Hitech City', 'Madhapur', 'Banjara Hills', 'Jubilee Hills', 'Kukatpally', 'Miyapur'],
    pincodes: { 'Gachibowli': ['500032'], 'Hitech City': ['500081'] }
  },
  'Chennai': {
    localities: ['Adyar', 'Anna Nagar', 'Velachery', 'OMR', 'T Nagar', 'Mylapore', 'Besant Nagar'],
    pincodes: { 'Adyar': ['600020'], 'Anna Nagar': ['600040'] }
  }
};

const COMMON_CITIES = Object.keys(CITY_LOCALITY_MAP).concat(['Ahmedabad', 'Kolkata', 'Jaipur', 'Lucknow', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Surat', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra']);

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onComplete, isLoading, mode, lang }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [selectedPincodes, setSelectedPincodes] = useState<string[]>([]);

  const steps: WizardStep[] = [
    { field: 'city', question: lang === 'HI' ? "नमस्ते! आप किस शहर में घर देख रहे हैं?" : "Namaste! Which city are you looking in?", type: 'city-picker' },
    { field: 'area', question: lang === 'HI' ? "अपना इलाका चुनें या दर्ज करें:" : "Pick or type your locality:", type: 'locality-picker' },
    { field: 'pincode', question: lang === 'HI' ? "पिन कोड चुनें या दर्ज करें:" : "Select or enter PIN codes:", type: 'pincode-picker' },
    { field: 'bhk', question: lang === 'HI' ? "कितने बैडरूम (BHK)?" : "How many bedrooms (BHK)?", type: 'select', options: ['1 BHK', '2 BHK', '3 BHK', '4+ BHK'] },
    { field: 'sqft', question: lang === 'HI' ? "घर का साइज (वर्ग फुट):" : "House size (sq. ft.):", type: 'number', placeholder: 'e.g. 850' },
    { field: 'facing', question: lang === 'HI' ? "घर की दिशा (वास्तु):" : "House facing (Vastu):", type: 'select', options: ['East', 'North', 'West', 'South'] },
    { field: 'budgetRange', question: lang === 'HI' ? "आपका बजट क्या है?" : "What is your budget range?", type: 'price-range', min: 2000000, max: 100000000, step: 500000 }
  ];

  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    setMessages([{ id: 'start', sender: 'bot', text: steps[0].question }]);
  }, [lang]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNext = (val: any) => {
    if (!val || (typeof val === 'string' && val.trim() === '')) return;
    
    const updatedData = { ...formData, [currentStep.field]: val };
    setFormData(updatedData);
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, sender: 'user', text: String(val) }]);

    let nextIdx = currentStepIndex + 1;
    setIsManualEntry(false);
    setInputValue('');
    setSelectedPincodes([]);

    if (nextIdx < steps.length) {
      setCurrentStepIndex(nextIdx);
      setTimeout(() => {
        setMessages(prev => [...prev, { id: `b-${Date.now()}`, sender: 'bot', text: steps[nextIdx].question }]);
      }, 300);
    } else {
      onComplete(updatedData);
    }
  };

  const confirmPincodes = () => {
    const manualPins = inputValue.split(/[\s,]+/).filter(p => p.trim().length >= 5);
    const allPins = Array.from(new Set([...selectedPincodes, ...manualPins]));
    if (allPins.length === 0) return;
    handleNext(allPins.join(', '));
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f] rounded-[48px] shadow-neo-glow overflow-hidden border border-white/10">
      <div className="px-10 py-8 border-b border-white/5 bg-neo-glass/40 backdrop-blur-xl">
        <div className="flex justify-between items-center mb-6">
          <button 
            disabled={currentStepIndex === 0}
            onClick={() => setCurrentStepIndex(currentStepIndex - 1)}
            className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl text-neo-neon disabled:opacity-20 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <span className="text-[10px] font-black text-neo-neon uppercase tracking-[0.4em]">
              {mode.toUpperCase()}_VALUATION_V5 • {currentStepIndex + 1}/{steps.length}
            </span>
          </div>
          <div className="w-10" />
        </div>
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-neo-neon to-neo-pink transition-all duration-1000 ease-out" 
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
            <div className={`max-w-[85%] px-6 py-4 rounded-[24px] text-sm font-medium leading-relaxed ${
              m.sender === 'user' 
                ? 'bg-gradient-to-br from-neo-neon to-blue-600 text-white rounded-tr-none shadow-neo-glow' 
                : 'bg-white/5 text-gray-200 rounded-tl-none border border-white/5'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {isLoading && <LoadingInsights />}
        <div ref={scrollRef} />
      </div>

      <div className="p-10 bg-neo-glass/60 backdrop-blur-2xl border-t border-white/5">
        {!isLoading && currentStep && (
          <div className="space-y-5">
            {currentStep.type === 'city-picker' && !isManualEntry && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-2 scrollbar-hide">
                  {COMMON_CITIES.map(c => (
                    <button key={c} onClick={() => handleNext(c)} className="h-10 px-5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-200 hover:border-neo-neon hover:text-neo-neon transition-all">{c}</button>
                  ))}
                </div>
                <button onClick={() => setIsManualEntry(true)} className="w-full h-12 rounded-xl bg-neo-neon/10 border border-neo-neon/20 text-xs font-bold text-neo-neon flex items-center justify-center gap-2 hover:bg-neo-neon hover:text-white transition-all">
                  <Edit3 size={14}/> Type Another City
                </button>
              </div>
            )}

            {currentStep.type === 'locality-picker' && !isManualEntry && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-2 scrollbar-hide">
                  {CITY_LOCALITY_MAP[formData.city]?.localities?.map(l => (
                    <button key={l} onClick={() => handleNext(l)} className="h-10 px-5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-200 hover:border-neo-neon transition-all">{l}</button>
                  ))}
                  {(!CITY_LOCALITY_MAP[formData.city] || CITY_LOCALITY_MAP[formData.city].localities.length === 0) && (
                    <div className="text-xs text-gray-500 italic px-2">No predefined localities for {formData.city}. Use manual entry.</div>
                  )}
                </div>
                <button onClick={() => setIsManualEntry(true)} className="w-full h-12 rounded-xl bg-neo-pink/10 border border-neo-pink/20 text-xs font-bold text-neo-pink flex items-center justify-center gap-2 hover:bg-neo-pink hover:text-white transition-all">
                  <MapPin size={14}/> Enter Locality Manually
                </button>
              </div>
            )}

            {(isManualEntry || (currentStep.type !== 'city-picker' && currentStep.type !== 'locality-picker' && currentStep.type !== 'pincode-picker' && currentStep.type !== 'select' && currentStep.type !== 'price-range')) && (
               <div className="relative flex gap-3">
                <input 
                  autoFocus
                  type={currentStep.type === 'number' ? 'number' : 'text'}
                  placeholder={currentStep.placeholder || `Enter ${currentStep.field}...`}
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-neo-neon outline-none"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNext(inputValue)}
                />
                <button onClick={() => handleNext(inputValue)} className="w-14 h-14 bg-neo-neon rounded-2xl flex items-center justify-center text-white shadow-neo-glow hover:scale-105 transition-all"><Send size={20} /></button>
              </div>
            )}

            {currentStep.type === 'pincode-picker' && (
               <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {CITY_LOCALITY_MAP[formData.city]?.pincodes[formData.area]?.map(p => (
                      <button 
                        key={p} 
                        onClick={() => setSelectedPincodes(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])} 
                        className={`h-10 px-4 rounded-xl border text-xs font-mono font-bold transition-all flex items-center gap-2 ${selectedPincodes.includes(p) ? 'bg-neo-neon text-white border-neo-neon shadow-neo-glow' : 'bg-white/5 border-white/5 text-neo-neon'}`}
                      >
                        {selectedPincodes.includes(p) ? <Check size={12}/> : <Plus size={12}/>} {p}
                      </button>
                    ))}
                    {(!CITY_LOCALITY_MAP[formData.city]?.pincodes[formData.area]) && (
                        <div className="text-xs text-gray-500 italic px-2">No predefined pincodes for this locality. Please type one below.</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Add more pins (e.g. 400050)..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-neo-neon" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && confirmPincodes()} />
                    <button onClick={confirmPincodes} className="px-6 bg-neo-neon rounded-xl text-white text-[10px] font-black uppercase tracking-widest hover:bg-neo-pink transition-colors">Confirm</button>
                  </div>
               </div>
            )}

            {currentStep.type === 'select' && (
              <div className="flex flex-wrap gap-3">
                {currentStep.options?.map(o => (
                  <button key={o} onClick={() => handleNext(o)} className="flex-1 min-w-[100px] h-12 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-gray-200 hover:border-neo-neon hover:scale-105 transition-all">{o}</button>
                ))}
              </div>
            )}

            {currentStep.type === 'price-range' && (
              <div className="space-y-4">
                <input type="range" min={currentStep.min} max={currentStep.max} step={currentStep.step} value={inputValue || currentStep.min} onChange={(e) => setInputValue(e.target.value)} className="w-full h-2 bg-white/10 rounded-full appearance-none accent-neo-neon cursor-pointer" />
                <button onClick={() => handleNext(`₹${(Number(inputValue || currentStep.min) / 10000000).toFixed(2)} Cr`)} className="w-full h-14 bg-gradient-to-r from-neo-neon to-neo-pink text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-neo-glow">SET BUDGET: ₹{(Number(inputValue || currentStep.min) / 10000000).toFixed(2)} Cr</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
