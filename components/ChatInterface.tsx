
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, AppMode, WizardStep } from '../types';
import { Send, Terminal, CheckCircle2, Radar, Building, Home, Clock, Hash, Navigation } from 'lucide-react';

interface ChatInterfaceProps {
  onComplete: (data: any) => void;
  isLoading: boolean;
  mode: AppMode;
  buyType?: 'New Buy' | 'Resale';
  suggestExpansion?: boolean;
  onConfirmExpansion?: () => void;
}

// Enhanced City Data with multiple pincode support
const CITY_DATA: Record<string, { localities: string[], pincodes: Record<string, string | string[]> }> = {
  'Pune': {
    localities: ['Wagholi', 'Hinjewadi', 'Baner', 'Kharadi', 'Magarpatta', 'Hadapsar', 'Kothrud', 'Wakad'],
    pincodes: { 
      'Wagholi': '412207', 
      'Hinjewadi': ['411057', '411033'], 
      'Baner': '411045', 
      'Kharadi': '411014', 
      'Wakad': '411057',
      'Kothrud': ['411038', '411029', '411058']
    }
  },
  'Mumbai': {
    localities: ['Andheri East', 'Andheri West', 'Borivali', 'Worli', 'Bandra West', 'Bandra East', 'Powai', 'Malad', 'Goregaon'],
    pincodes: { 
      'Andheri East': ['400069', '400093', '400099', '400059'], 
      'Andheri West': ['400053', '400058'],
      'Worli': '400018', 
      'Bandra West': '400050', 
      'Bandra East': '400051',
      'Powai': ['400076', '400087'],
      'Borivali': ['400091', '400092', '400103']
    }
  },
  'Bangalore': {
    localities: ['Whitefield', 'Electronic City', 'Indiranagar', 'Koramangala', 'HSR Layout', 'Marathahalli'],
    pincodes: { 
      'Whitefield': ['560066', '560067'], 
      'Electronic City': ['560100', '560105'], 
      'Indiranagar': '560038' 
    }
  },
  'Delhi-NCR': {
    localities: ['Gurgaon Sector 56', 'Noida Sector 62', 'Rohini', 'Dwarka', 'Janakpuri', 'Saket'],
    pincodes: { 
      'Saket': '110017', 
      'Dwarka': ['110075', '110077', '110078'],
      'Gurgaon Sector 56': '122011'
    }
  }
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onComplete, isLoading, mode, buyType, suggestExpansion, onConfirmExpansion }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [inputValue, setInputValue] = useState('');
  const [pincodeSuggestions, setPincodeSuggestions] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Common steps at start
  const commonSteps: WizardStep[] = [
    { field: 'city', question: "Select Deployment City:", type: 'select', options: Object.keys(CITY_DATA) },
    { field: 'address', question: "Select Sector/Locality:", type: 'locality-picker' },
    { field: 'pincode', question: "Verify Sector Pincode:", type: 'text', placeholder: '411001' }
  ];

  const getActiveSteps = (): WizardStep[] => {
    const base = [...commonSteps];
    
    if (mode === 'buy') {
      const steps: WizardStep[] = [
        ...base,
        { field: 'possessionStatus', question: "Deployment Timeline:", type: 'select', options: ['Ready to Move', 'Under Construction', 'Upcoming Project'] },
        { field: 'possessionYear', question: "Target Possession Year:", type: 'select', options: ['2025', '2026', '2027', '2028+'] },
        { field: 'bhk', question: "BHK Configuration:", type: 'select', options: ['1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Villa'] },
        { field: 'sqft', question: "Carpet Area (sqft):", type: 'number', placeholder: 'e.g., 1050' },
        { field: 'expectedPrice', question: "Budget Ceiling (₹):", type: 'number', placeholder: 'e.g., 8500000' }
      ];
      return steps;
    }

    if (mode === 'sell') {
      const steps: WizardStep[] = [
        ...base,
        { field: 'bhk', question: "Configuration:", type: 'select', options: ['1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Villa'] },
        { field: 'sqft', question: "Built-up Area (sqft):", type: 'number', placeholder: 'e.g., 1250' },
        { field: 'age', question: "Property Age (Years):", type: 'number', placeholder: 'e.g., 5' },
        { field: 'expectedPrice', question: "Expected Resale Price (₹):", type: 'number', placeholder: 'e.g., 7500000' }
      ];
      return steps;
    }

    if (mode === 'rent') {
      const steps: WizardStep[] = [
        ...base,
        { field: 'bhk', question: "BHK Configuration:", type: 'select', options: ['1 BHK', '2 BHK', '3 BHK', '4 BHK'] },
        { field: 'sqft', question: "Area (sqft):", type: 'number', placeholder: 'e.g., 1000' },
        { field: 'expectedRent', question: "Target Monthly Rent (₹):", type: 'number', placeholder: 'e.g., 35000' },
        { field: 'securityDepositMonths', question: "Security Deposit (Months):", type: 'number', placeholder: 'e.g., 6' },
      ];
      return steps;
    }

    if (mode === 'land') {
      const steps: WizardStep[] = [
        ...base,
        { field: 'plotSize', question: "Plot Size:", type: 'number', placeholder: 'e.g., 2000' },
        { field: 'unit', question: "Measurement Unit:", type: 'select', options: ['sqft', 'sqyd', 'sqmt', 'acre'] },
        { field: 'fsi', question: "Permissible FSI:", type: 'number', placeholder: 'e.g., 2.5' },
        { field: 'approvals', question: "Legal Approvals:", type: 'select', options: ['NA', 'RERA', 'None'] },
      ];
      return steps;
    }

    return base;
  };

  const activeSteps = getActiveSteps();
  const currentStep = activeSteps[currentStepIndex];

  useEffect(() => {
    const contextText = buyType ? ` [${buyType.toUpperCase()} MODE]` : "";
    setMessages([{
      id: 'welcome',
      sender: 'bot',
      text: `PROTOCOL_ID_${mode.toUpperCase()}_ENGAGED${contextText}. Initiating geographic triangulations...`,
    }, {
      id: 'q1',
      sender: 'bot',
      text: activeSteps[0].question,
    }]);
    setCurrentStepIndex(0);
    setFormData({});
    setPincodeSuggestions([]);
  }, [mode, buyType]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleNext = async (value: any) => {
    if (typeof value === 'string' && !value.trim() && currentStep?.type !== 'multi-select') return;

    const displayValue = value.toString();
    setMessages(prev => [...prev, { id: `user-${Date.now()}`, sender: 'user', text: displayValue }]);

    let updatedData = { ...formData, [currentStep.field]: value };
    let nextIndex = currentStepIndex + 1;
    
    // Auto-pincode lookup logic
    if (currentStep.field === 'address') {
       const city = updatedData.city;
       const locality = value;
       const geoData = CITY_DATA[city]?.pincodes[locality];

       if (geoData) {
         if (Array.isArray(geoData)) {
           // Multiple pincodes found, show them as options in next step
           setPincodeSuggestions(geoData);
         } else {
           // Exactly one pincode found, auto-fill and skip the pincode question
           updatedData.pincode = geoData;
           setPincodeSuggestions([]);
           
           // Find where the pincode step is and jump past it
           const pincodeStepIdx = activeSteps.findIndex(s => s.field === 'pincode');
           if (pincodeStepIdx !== -1) {
             nextIndex = pincodeStepIdx + 1;
           }
         }
       } else {
         setPincodeSuggestions([]);
       }
    }

    // Possession skip logic
    if (currentStep.field === 'possessionStatus' && value === 'Ready to Move') {
        const yearStepIdx = activeSteps.findIndex(s => s.field === 'possessionYear');
        if (yearStepIdx !== -1 && yearStepIdx >= nextIndex) {
            nextIndex = yearStepIdx + 1;
        }
    }

    setFormData(updatedData);
    setInputValue('');

    if (nextIndex < activeSteps.length) {
      setCurrentStepIndex(nextIndex);
      const nextStep = activeSteps[nextIndex];
      const botMsg = nextStep.field === 'pincode' && pincodeSuggestions.length > 0 
        ? `I've found multiple pincodes for ${value}. Select the correct one:`
        : nextStep.question;

      setTimeout(() => setMessages(prev => [...prev, { id: `bot-${Date.now()}`, sender: 'bot', text: botMsg }]), 400);
    } else {
      setTimeout(() => {
        setMessages(prev => [...prev, { id: `bot-fin`, sender: 'bot', text: "DATA_LAKE_SYNCHRONIZED. Analyzing market vectors..." }]);
        onComplete(updatedData);
      }, 600);
    }
  };

  const renderInputs = () => {
    if (isLoading || suggestExpansion) return null;

    // Custom UI for Pincode Suggestions
    if (currentStep.field === 'pincode' && pincodeSuggestions.length > 0) {
      return (
        <div className="flex flex-wrap gap-2">
           {pincodeSuggestions.map(pin => (
             <button key={pin} onClick={() => handleNext(pin)} className="px-5 py-2.5 bg-cyber-card border border-cyber-border hover:border-cyber-teal text-white rounded-xl text-xs font-mono transition-all flex items-center gap-2 hover:shadow-neon-teal">
                <Hash size={12} className="text-cyber-teal" /> {pin}
             </button>
           ))}
           <button onClick={() => setPincodeSuggestions([])} className="px-5 py-2.5 bg-white/5 border border-dashed border-white/20 text-gray-500 rounded-xl text-[10px] font-mono hover:text-white transition-all uppercase">
              Other_Manual
           </button>
        </div>
      );
    }

    if (currentStep.type === 'locality-picker') {
        const localities = CITY_DATA[formData.city]?.localities || [];
        return (
            <div className="flex flex-wrap gap-2">
                {localities.map(loc => (
                    <button key={loc} onClick={() => handleNext(loc)} className="px-4 py-2 bg-cyber-card border border-cyber-border hover:border-cyber-teal text-white rounded-lg text-[10px] font-mono transition-all flex items-center gap-2 hover:bg-cyber-teal/10">
                        <Navigation size={10} className="text-cyber-teal" /> {loc.toUpperCase()}
                    </button>
                ))}
                <button onClick={() => setMessages(prev => [...prev, { id: 'manual', sender: 'bot', text: 'Enter Locality Manually:' }])} className="px-4 py-2 bg-white/5 border border-dashed border-white/20 text-gray-500 rounded-lg text-[10px] font-mono hover:text-white">
                    OTHER_SECTOR
                </button>
                {messages.some(m => m.text === 'Enter Locality Manually:') && (
                    <div className="w-full relative mt-2">
                        <input 
                            className="w-full pl-4 pr-12 py-3 bg-cyber-black border border-cyber-border rounded-lg text-white font-mono text-xs focus:border-cyber-teal outline-none"
                            placeholder="Type Sector Name..."
                            onKeyDown={e => e.key === 'Enter' && handleNext((e.target as HTMLInputElement).value)}
                            autoFocus
                        />
                    </div>
                )}
            </div>
        )
    }

    if (currentStep.type === 'select') {
        return (
            <div className="flex flex-wrap gap-2">
                {currentStep.options?.map((opt) => (
                    <button key={opt} onClick={() => handleNext(opt)} className="px-4 py-2 bg-cyber-card border border-cyber-border hover:border-cyber-teal text-cyber-text rounded-lg text-[10px] font-mono transition-all hover:text-white flex items-center gap-2">
                        {opt === 'New Booking' && <Building size={12} />}
                        {opt === 'Resale Purchase' && <Home size={12} />}
                        {opt === 'Ready to Move' && <Clock size={12} />}
                        {opt.toUpperCase()}
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="relative">
            <input
                type={currentStep.type === 'number' ? 'number' : 'text'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNext(inputValue)}
                placeholder={currentStep.placeholder || 'Type here...'}
                className="w-full pl-4 pr-12 py-3 bg-cyber-black border border-cyber-border rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyber-teal transition-all"
            />
            <button onClick={() => handleNext(inputValue)} className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center rounded bg-cyber-teal text-cyber-black shadow-neon-teal">
                <Send size={14} />
            </button>
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl overflow-hidden shadow-glass border border-cyber-border">
      <div className="px-5 py-4 border-b border-cyber-border bg-black/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal size={16} className="text-cyber-teal" />
          <h2 className="text-white font-mono text-[10px] tracking-widest font-bold uppercase">{mode}_SYSTEM_IO</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-[11px] md:text-[12px] leading-relaxed font-mono ${
                msg.sender === 'user'
                  ? 'bg-cyber-teal/10 border border-cyber-teal/30 text-cyber-teal'
                  : 'bg-cyber-card/80 border border-cyber-border text-cyber-text shadow-lg'
              }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && <div className="flex gap-2"><div className="w-2 h-2 rounded-full bg-cyber-teal animate-bounce"></div><div className="w-2 h-2 rounded-full bg-cyber-teal animate-bounce delay-100"></div><div className="w-2 h-2 rounded-full bg-cyber-teal animate-bounce delay-200"></div></div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-black/20 border-t border-cyber-border min-h-[80px]">
        {suggestExpansion ? (
            <button onClick={onConfirmExpansion} className="w-full py-3 bg-cyber-lime text-black rounded-xl font-bold font-mono text-xs shadow-neon-teal animate-pulse flex items-center justify-center gap-2">
                <Radar size={16} /> CONFIRM_RADIUS_BREACH
            </button>
        ) : !isLoading && currentStep && renderInputs()}
      </div>
    </div>
  );
};

export default ChatInterface;
