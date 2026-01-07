
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, AppMode, WizardStep, AppLang } from '../types';
import { Send, MapPin, ChevronLeft, Mic, MicOff, Home, CheckCircle, Search, Sparkles, Hash, Plus, Check, Edit3, Navigation } from 'lucide-react';
import LoadingInsights from './LoadingInsights';
import { SpeechInput } from '../services/voiceService';

interface ChatInterfaceProps {
  onComplete: (data: any) => void;
  isLoading: boolean;
  mode: AppMode;
  lang: AppLang;
}

const CITY_LOCALITY_MAP: Record<string, { localities: string[], pincodes: Record<string, string[]> }> = {
  'Mumbai': {
    localities: ['Bandra West', 'Worli', 'Andheri West', 'Powai', 'Juhu', 'Colaba', 'Borivali', 'Dadar', 'Malad', 'Khar', 'Santacruz', 'Vile Parle', 'Goregaon', 'Kandivali', 'Chembur', 'Mulund', 'Ghatkopar', 'Walkeshwar', 'Malabar Hill'],
    pincodes: { 
      'Bandra West': ['400050'], 
      'Worli': ['400018'], 
      'Andheri West': ['400053'],
      'Powai': ['400076'],
      'Juhu': ['400049'],
      'Colaba': ['400005'],
      'Borivali': ['400091'],
      'Dadar': ['400014'],
      'Malad': ['400064'],
      'Khar': ['400052'],
      'Santacruz': ['400054'],
      'Vile Parle': ['400057'],
      'Goregaon': ['400063'],
      'Kandivali': ['400067'],
      'Chembur': ['400071'],
      'Mulund': ['400080'],
      'Ghatkopar': ['400077'],
      'Walkeshwar': ['400006'],
      'Malabar Hill': ['400006']
    }
  },
  'Pune': {
    localities: ['Kharadi', 'Baner', 'Wagholi', 'Hinjewadi', 'Kothrud', 'Aundh', 'Viman Nagar', 'Hadapsar', 'Bavdhan', 'Pimple Saudagar'],
    pincodes: { 
      'Kharadi': ['411014'], 
      'Baner': ['411045'], 
      'Wagholi': ['412207'],
      'Hinjewadi': ['411057'],
      'Kothrud': ['411038'],
      'Aundh': ['411007'],
      'Viman Nagar': ['411014'],
      'Hadapsar': ['411028'],
      'Bavdhan': ['411021'],
      'Pimple Saudagar': ['411027']
    }
  }
};

const COMMON_CITIES = Object.keys(CITY_LOCALITY_MAP).concat(['Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata']);

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onComplete, isLoading, mode, lang }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isManualEntry, setIsManualEntry] = useState(false);

  const getSteps = (): WizardStep[] => {
    const baseSteps: WizardStep[] = [
      { field: 'city', question: lang === 'HI' ? "नमस्ते! आप किस शहर में संपत्ति देख रहे हैं?" : "Namaste! Which city are you looking in?", type: 'city-picker' },
      { field: 'area', question: lang === 'HI' ? "अपना इलाका चुनें या दर्ज करें:" : "Pick or type your locality:", type: 'locality-picker' },
      { field: 'pincode', question: lang === 'HI' ? "पिन कोड दर्ज करें:" : "Enter PIN code:", type: 'number', placeholder: 'e.g. 400050' },
    ];

    if (mode === 'land') {
      return [
        ...baseSteps,
        { field: 'unit', question: lang === 'HI' ? "जमीन की इकाई चुनें (Unit):" : "Select Land Area Unit:", type: 'select', options: ['sqft', 'Acres', 'Hectares', 'sq. yds'] },
        { field: 'plotSize', question: lang === 'HI' ? "जमीन का आकार दर्ज करें (Value):" : "Enter Land Area Value:", type: 'number', placeholder: 'e.g. 2500' },
        { field: 'fsi', question: lang === 'HI' ? "अनुमत FSI (यदि ज्ञात हो, अन्यथा 1.0):" : "Permissible FSI (if known, else 1.0):", type: 'number', placeholder: 'e.g. 1.5' },
      ];
    }

    return [
      ...baseSteps,
      { field: 'bhk', question: lang === 'HI' ? "कितने बैडरूम (BHK)?" : "How many bedrooms (BHK)?", type: 'select', options: ['1 BHK', '2 BHK', '3 BHK', '4+ BHK'] },
      { field: 'sqft', question: lang === 'HI' ? "घर का साइज (वर्ग फुट):" : "House size (sq. ft.):", type: 'number', placeholder: 'e.g. 850' },
      { field: 'facing', question: lang === 'HI' ? "घर की दिशा (वास्तु):" : "House facing (Vastu):", type: 'select', options: ['East', 'North', 'West', 'South'] },
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

  const handleNext = (val: any) => {
    if (!val || (typeof val === 'string' && val.trim() === '')) return;
    
    let updatedValue = val;
    let nextFormData = { ...formData, [currentStep.field]: updatedValue };

    if (currentStep.field === 'area' && nextFormData.city && CITY_LOCALITY_MAP[nextFormData.city]) {
      const cityData = CITY_LOCALITY_MAP[nextFormData.city];
      const foundPincodes = cityData.pincodes[val];
      if (foundPincodes && foundPincodes.length > 0) {
          nextFormData.pincode = foundPincodes[0];
      }
    }

    setFormData(nextFormData);
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, sender: 'user', text: String(updatedValue) }]);

    let nextIdx = currentStepIndex + 1;
    setIsManualEntry(false);
    
    if (nextIdx < steps.length && steps[nextIdx].field === 'pincode' && nextFormData.pincode) {
        const autoPincode = nextFormData.pincode;
        setMessages(prev => [...prev, { id: `b-auto-${Date.now()}`, sender: 'bot', text: lang === 'HI' ? `पिनकोड ${autoPincode} मिला।` : `Pincode ${autoPincode} detected for ${val}.` }]);
        nextIdx++; 
    }

    setInputValue('');

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
    const voiceInput = new SpeechInput(
      (text, isFinal) => {
        if (isFinal) {
          setInputValue(text);
          handleNext(text);
        }
      },
      () => setIsListening(false),
      () => {},
      lang === 'HI' ? 'hi-IN' : 'en-IN'
    );
    setIsListening(true);
    voiceInput.start();
  };

  const localitiesForSelectedCity = formData.city ? CITY_LOCALITY_MAP[formData.city]?.localities || [] : [];

  return (
    <div className="h-full flex flex-col bg-neo-bg rounded-[48px] shadow-neo-glow overflow-hidden border border-white/10">
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
              {mode.toUpperCase()}_SCAN • {currentStepIndex + 1}/{steps.length}
            </span>
          </div>
          <button onClick={toggleListening} className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isListening ? 'bg-neo-pink text-white animate-pulse shadow-pink-glow' : 'bg-white/5 text-gray-500 hover:text-white'}`}>
            {isListening ? <MicOff size={20}/> : <Mic size={20}/>}
          </button>
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
              <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto scrollbar-hide">
                {COMMON_CITIES.map(c => (
                  <button key={c} onClick={() => handleNext(c)} className="h-10 px-5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-200 hover:border-neo-neon transition-all">{c}</button>
                ))}
                <button onClick={() => setIsManualEntry(true)} className="h-10 px-5 rounded-xl bg-neo-neon/10 border border-neo-neon/30 text-xs font-bold text-neo-neon flex items-center gap-2 uppercase tracking-widest"><Edit3 size={14}/> Other</button>
              </div>
            )}

            {currentStep.type === 'locality-picker' && !isManualEntry && (
              <div className="flex flex-wrap gap-2">
                {localitiesForSelectedCity.map(l => (
                  <button key={l} onClick={() => handleNext(l)} className="h-10 px-5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-200 hover:border-neo-neon transition-all">{l}</button>
                ))}
                <button onClick={() => setIsManualEntry(true)} className="h-10 px-5 rounded-xl bg-neo-neon/10 border border-neo-neon/30 text-xs font-bold text-neo-neon flex items-center gap-2 uppercase tracking-widest"><Edit3 size={14}/> Type Locality</button>
              </div>
            )}

            {(isManualEntry || (currentStep.type !== 'city-picker' && currentStep.type !== 'locality-picker' && currentStep.type !== 'select')) && (
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
