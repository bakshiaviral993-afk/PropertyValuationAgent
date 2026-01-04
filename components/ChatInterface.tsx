
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, AppMode, WizardStep, BudgetRange } from '../types';
import { Send, Navigation, Mic, MicOff, Check, SlidersHorizontal, Compass } from 'lucide-react';

interface ChatInterfaceProps {
  onComplete: (data: any) => void;
  isLoading: boolean;
  mode: AppMode;
  buyType?: 'New Buy' | 'Resale';
  suggestExpansion?: boolean;
  onConfirmExpansion?: () => void;
}

const CITY_DATA: Record<string, { localities: string[], pincodes: Record<string, string | string[]> }> = {
  'Mumbai': {
    localities: ['Andheri East', 'Andheri West', 'Bandra West', 'Bandra East', 'Worli', 'Powai', 'Borivali West', 'Borivali East', 'Malad West', 'Juhu', 'Colaba', 'Chembur'],
    pincodes: { 
      'Andheri East': ['400069', '400093', '400099', '400059', '400072'], 
      'Andheri West': ['400053', '400058', '400061'],
      'Bandra West': '400050', 
      'Bandra East': '400051',
      'Worli': ['400018', '400030'],
      'Powai': ['400076', '400087'],
      'Borivali West': '400091',
      'Borivali East': '400066',
      'Malad West': ['400064', '400095'],
      'Juhu': '400049',
      'Colaba': '400005',
      'Chembur': ['400071', '400074', '400088']
    }
  },
  'Pune': {
    localities: ['Wagholi', 'Hinjewadi', 'Baner', 'Kharadi', 'Magarpatta', 'Hadapsar', 'Kothrud', 'Wakad', 'Viman Nagar'],
    pincodes: { 
      'Wagholi': '412207', 
      'Hinjewadi': ['411057', '411033'], 
      'Baner': ['411045', '411007'], 
      'Kharadi': '411014', 
      'Magarpatta': '411013',
      'Hadapsar': ['411028', '411013'],
      'Kothrud': ['411038', '411029', '411058'],
      'Wakad': '411057',
      'Viman Nagar': '411014'
    }
  },
  'Bangalore': {
    localities: ['Whitefield', 'Electronic City', 'Indiranagar', 'Koramangala', 'HSR Layout', 'Marathahalli', 'Jayanagar', 'Hebbal'],
    pincodes: { 
      'Whitefield': ['560066', '560067'], 
      'Electronic City': ['560100', '560105'], 
      'Indiranagar': '560038',
      'Koramangala': ['560034', '560095'],
      'HSR Layout': '560102',
      'Marathahalli': '560037',
      'Jayanagar': '560041',
      'Hebbal': '560024'
    }
  }
};

const PriceRangeSelector = ({ min, max, step, onConfirm }: { min: number, max: number, step: number, onConfirm: (range: BudgetRange) => void }) => {
  const [range, setRange] = useState<BudgetRange>({ min, max: max / 2 });

  const formatPrice = (p: number) => {
    if (p >= 10000000) return `${(p / 10000000).toFixed(2)} Cr`;
    if (p >= 100000) return `${(p / 100000).toFixed(0)} Lakh`;
    return `${p / 1000}k`;
  };

  return (
    <div className="w-full space-y-6 p-4 bg-white/5 border border-white/10 rounded-2xl animate-in zoom-in-95">
      <div className="flex justify-between items-center px-2">
        <div className="text-center">
          <div className="text-[10px] text-gray-500 uppercase font-mono">Min_Floor</div>
          <div className="text-sm font-bold text-cyber-teal font-mono">{formatPrice(range.min)}</div>
        </div>
        <div className="w-8 h-px bg-white/10"></div>
        <div className="text-center">
          <div className="text-[10px] text-gray-500 uppercase font-mono">Max_Ceiling</div>
          <div className="text-sm font-bold text-cyber-teal font-mono">{formatPrice(range.max)}</div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="relative pt-2">
          <input 
            type="range" 
            min={min} 
            max={max} 
            step={step}
            value={range.max}
            onChange={(e) => setRange({ ...range, max: Number(e.target.value) })}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyber-teal"
          />
        </div>
      </div>

      <button 
        onClick={() => onConfirm(range)}
        className="w-full py-3 rounded-xl bg-cyber-teal text-cyber-black font-bold text-xs font-mono shadow-neon-teal hover:bg-white transition-all flex items-center justify-center gap-2"
      >
        <SlidersHorizontal size={14} /> LOCK_BUDGET_THRESHOLD
      </button>
    </div>
  );
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onComplete, isLoading, mode, buyType, suggestExpansion, onConfirmExpansion }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<any>({ amenities: [] });
  const [inputValue, setInputValue] = useState('');
  const [pincodeSuggestions, setPincodeSuggestions] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const commonSteps: WizardStep[] = [
    { field: 'city', question: "Select Operation City:", type: 'select', options: Object.keys(CITY_DATA) },
    { field: 'address', question: "Select Locality/Sector:", type: 'locality-picker' },
    { field: 'pincode', question: "Verify Sector Pincode:", type: 'text', placeholder: '400001' }
  ];

  const getActiveSteps = (): WizardStep[] => {
    const base = [...commonSteps];
    const facingStep: WizardStep = { field: 'facing', question: "Asset Orientation (Vastu Facing):", type: 'select', options: ['East', 'West', 'North', 'South'] };

    if (mode === 'buy' || mode === 'sell') {
      return [...base,
        { field: 'possessionStatus', question: "Deployment Timeline:", type: 'select', options: ['Ready to Move', 'Under Construction', 'Upcoming Project'] },
        { field: 'bhk', question: "BHK Configuration:", type: 'select', options: ['1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Villa'] },
        { field: 'sqft', question: "Carpet Area (sqft):", type: 'number', placeholder: 'e.g., 1050' },
        facingStep,
        { field: 'amenities', question: "Select Amenities (Multiple):", type: 'multi-select', options: ['Pool', 'Gym', 'Clubhouse', 'Parking', 'Security', 'Power Backup'] },
        { field: 'budgetRange', question: "Budget Spectrum Analysis:", type: 'price-range', min: 2000000, max: 200000000, step: 500000 }
      ];
    } else if (mode === 'rent') {
      return [...base,
        { field: 'bhk', question: "BHK Configuration:", type: 'select', options: ['1 BHK', '2 BHK', '3 BHK', '4 BHK'] },
        { field: 'sqft', question: "Carpet Area (sqft):", type: 'number', placeholder: 'e.g., 850' },
        facingStep,
        { field: 'budgetRange', question: "Rental Yield Range:", type: 'price-range', min: 5000, max: 500000, step: 2000 },
        { field: 'securityDepositMonths', question: "Security Deposit (Months):", type: 'number', placeholder: 'e.g., 6' }
      ];
    } else if (mode === 'land') {
      return [...base,
        { field: 'plotSize', question: "Plot Dimension Value:", type: 'number', placeholder: 'e.g., 2000' },
        { field: 'unit', question: "Measurement Unit:", type: 'select', options: ['sqft', 'sqyd', 'sqmt', 'acre'] },
        facingStep,
        { field: 'fsi', question: "Floor Space Index (FSI):", type: 'number', placeholder: 'e.g., 1.5' },
        { field: 'devPotential', question: "Development Intent:", type: 'select', options: ['residential', 'commercial'] }
      ];
    }
    return base;
  };

  const activeSteps = getActiveSteps();
  const currentStep = activeSteps[currentStepIndex];

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
    }
    
    setMessages([{
      id: 'welcome',
      sender: 'bot',
      text: `PROTOCOL_ID_${mode.toUpperCase()}_ENGAGED. Initiating geographic triangulations...`,
    }, {
      id: 'q1',
      sender: 'bot',
      text: activeSteps[0].question,
    }]);
    setCurrentStepIndex(0);
    setFormData({ amenities: [] });
  }, [mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleNext = async (value: any) => {
    if (value === undefined || value === null) return;
    
    let processedValue = value;
    let displayText = '';

    if (currentStep.type === 'number') {
      processedValue = Number(value);
      displayText = String(value);
    } else if (currentStep.type === 'price-range') {
      const range = value as BudgetRange;
      const format = (p: number) => p >= 10000000 ? `${(p/10000000).toFixed(1)}Cr` : `${(p/100000).toFixed(0)}L`;
      displayText = `${format(range.min)} - ${format(range.max)}`;
    } else {
      displayText = Array.isArray(value) ? value.join(', ') : String(value);
    }

    if (displayText.trim() === '' && currentStep.type !== 'price-range') return;

    const newFormData = { ...formData, [currentStep.field]: processedValue };
    setMessages(prev => [...prev, { 
      id: `u-${Date.now()}`, 
      sender: 'user', 
      text: displayText 
    }]);
    setInputValue('');

    let nextIdx = currentStepIndex + 1;
    
    if (currentStep.field === 'address') {
      const city = newFormData.city;
      const geoCodes = CITY_DATA[city]?.pincodes[value];
      if (geoCodes) {
        if (typeof geoCodes === 'string') {
          newFormData.pincode = geoCodes;
          const pinStepIdx = activeSteps.findIndex(s => s.field === 'pincode');
          nextIdx = pinStepIdx + 1;
        } else {
          setPincodeSuggestions(geoCodes);
        }
      }
    }

    setFormData(newFormData);

    if (nextIdx < activeSteps.length) {
      setCurrentStepIndex(nextIdx);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: activeSteps[nextIdx].question
        }]);
      }, 400);
    } else {
      onComplete(newFormData);
    }
  };

  const toggleAmenity = (amenity: string) => {
    const current = formData.amenities || [];
    const updated = current.includes(amenity) 
      ? current.filter((a: string) => a !== amenity)
      : [...current, amenity];
    setFormData({ ...formData, amenities: updated });
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-2xl min-h-[500px]">
      <div className="bg-black/40 px-6 py-4 border-b border-white/5 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-cyber-teal animate-pulse'}`} />
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">
              {isLoading ? 'SEARCH_GROUNDING_ACTIVE' : isListening ? 'VOICE_SYNC_ACTIVE' : 'NEURAL_LINK_STABLE'}
            </span>
         </div>
         <div className="text-[9px] text-cyber-teal font-mono font-bold uppercase">SEC_{currentStepIndex + 1}_V2.5</div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin max-h-[400px]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl font-mono text-xs ${
              msg.sender === 'user' ? 'bg-cyber-teal text-cyber-black font-bold shadow-neon-teal' : 'bg-white/5 border border-white/10 text-gray-300'
            }`}>
               {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-cyber-teal rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-cyber-teal rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-cyber-teal rounded-full animate-bounce [animation-delay:-0.3s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-black/20 border-t border-white/5">
        {!isLoading && currentStep && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            {currentStep.type === 'price-range' ? (
              <PriceRangeSelector 
                min={currentStep.min || 0} 
                max={currentStep.max || 100000000} 
                step={currentStep.step || 100000} 
                onConfirm={handleNext} 
              />
            ) : currentStep.type === 'locality-picker' ? (
              <div className="flex flex-wrap gap-2">
                {CITY_DATA[formData.city]?.localities.map(loc => (
                  <button key={loc} onClick={() => handleNext(loc)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-mono text-gray-400 hover:border-cyber-teal hover:text-cyber-teal transition-all flex items-center gap-2">
                    <Navigation size={10} /> {loc}
                  </button>
                ))}
              </div>
            ) : currentStep.type === 'multi-select' ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {currentStep.options?.map(opt => {
                    const isSelected = formData.amenities?.includes(opt);
                    return (
                      <button 
                        key={opt} 
                        onClick={() => toggleAmenity(opt)} 
                        className={`px-4 py-2 rounded-xl border text-[10px] font-mono transition-all flex items-center gap-2 ${
                          isSelected ? 'bg-cyber-teal/20 border-cyber-teal text-cyber-teal' : 'bg-white/5 border-white/10 text-gray-400'
                        }`}
                      >
                        {isSelected && <Check size={10} />} {opt}
                      </button>
                    );
                  })}
                </div>
                <button 
                  onClick={() => handleNext(formData.amenities)} 
                  className="w-full py-4 rounded-xl bg-cyber-teal text-cyber-black font-bold text-xs font-mono shadow-neon-teal hover:bg-white transition-all active:scale-[0.98]"
                >
                  CONFIRM_SPEC_ARRAY
                </button>
              </div>
            ) : currentStep.field === 'pincode' && pincodeSuggestions.length > 0 ? (
               <div className="flex flex-wrap gap-2">
                  {pincodeSuggestions.map(pin => (
                    <button key={pin} onClick={() => handleNext(pin)} className="px-5 py-3 rounded-xl bg-cyber-teal/10 border border-cyber-teal text-cyber-teal font-mono text-xs hover:bg-cyber-teal hover:text-black transition-all shadow-neon-teal">
                      {pin}
                    </button>
                  ))}
                  <button onClick={() => setPincodeSuggestions([])} className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-600 text-[10px] font-mono">MANUAL_ENTRY</button>
               </div>
            ) : currentStep.type === 'select' ? (
              <div className="flex flex-wrap gap-2">
                {currentStep.options?.map(opt => (
                  <button key={opt} onClick={() => handleNext(opt)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-mono text-gray-400 hover:border-cyber-teal hover:text-cyber-teal transition-all flex items-center gap-2">
                    {currentStep.field === 'facing' && <Compass size={12} />} {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="relative">
                <input
                  type={currentStep.type === 'number' ? 'number' : 'text'}
                  placeholder={currentStep.placeholder}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-xs text-white focus:outline-none focus:border-cyber-teal transition-all font-mono pr-24"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNext(inputValue)}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button onClick={toggleListening} className={`p-2 rounded-lg transition-colors ${isListening ? 'text-red-500 bg-red-500/10' : 'text-gray-500 hover:text-cyber-teal'}`}>
                    {isListening ? <Mic size={18} /> : <MicOff size={18} />}
                  </button>
                  <button onClick={() => handleNext(inputValue)} className="p-2 text-cyber-teal hover:text-white bg-cyber-teal/10 rounded-lg">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
