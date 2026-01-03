
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, AppMode, WizardStep } from '../types';
import { Send, Terminal, CheckCircle2, Radar, Building, Home, Clock } from 'lucide-react';

interface ChatInterfaceProps {
  onComplete: (data: any) => void;
  isLoading: boolean;
  mode: AppMode;
  suggestExpansion?: boolean;
  onConfirmExpansion?: () => void;
}

const CITY_DATA: Record<string, { localities: string[], pincodes: Record<string, string> }> = {
  'Pune': {
    localities: ['Wagholi', 'Hinjewadi', 'Baner', 'Kharadi', 'Magarpatta', 'Hadapsar', 'Kothrud', 'Wakad'],
    pincodes: { 'Wagholi': '412207', 'Hinjewadi': '411057', 'Baner': '411045', 'Kharadi': '411014', 'Wakaf': '411057' }
  },
  'Mumbai': {
    localities: ['Andheri', 'Borivali', 'Worli', 'Bandra', 'Powai', 'Malad', 'Goregaon', 'Dadar'],
    pincodes: { 'Andheri': '400053', 'Worli': '400018', 'Bandra': '400050', 'Powai': '400076' }
  },
  'Bangalore': {
    localities: ['Whitefield', 'Electronic City', 'Indiranagar', 'Koramangala', 'HSR Layout', 'Marathahalli'],
    pincodes: { 'Whitefield': '560066', 'Electronic City': '560100', 'Indiranagar': '560038' }
  },
  'Delhi-NCR': {
    localities: ['Gurgaon Sector 56', 'Noida Sector 62', 'Rohini', 'Dwarka', 'Janakpuri', 'Saket'],
    pincodes: { 'Saket': '110017', 'Dwarka': '110075' }
  }
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onComplete, isLoading, mode, suggestExpansion, onConfirmExpansion }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [inputValue, setInputValue] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  
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
      return [
        ...base,
        { field: 'purchaseType', question: "Select Acquisition Category:", type: 'select', options: ['New Booking', 'Resale Purchase'] },
        { field: 'possessionStatus', question: "Deployment Timeline:", type: 'select', options: ['Ready to Move', 'Under Construction', 'Upcoming Project'] },
        { field: 'possessionYear', question: "Target Possession Year:", type: 'select', options: ['2025', '2026', '2027', '2028+'] },
        { field: 'bhk', question: "BHK Configuration:", type: 'select', options: ['1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Villa'] },
        { field: 'sqft', question: "Carpet Area (sqft):", type: 'number', placeholder: 'e.g., 1050' },
        { field: 'expectedPrice', question: "Budget Ceiling (₹):", type: 'number', placeholder: 'e.g., 8500000' }
      ];
    }

    if (mode === 'sell') {
      return [
        ...base,
        { field: 'bhk', question: "Configuration:", type: 'select', options: ['1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Villa'] },
        { field: 'sqft', question: "Built-up Area (sqft):", type: 'number', placeholder: 'e.g., 1250' },
        { field: 'age', question: "Property Age (Years):", type: 'number', placeholder: 'e.g., 5' },
        { field: 'expectedPrice', question: "Expected Resale Price (₹):", type: 'number', placeholder: 'e.g., 7500000' }
      ];
    }

    if (mode === 'rent') {
      return [
        ...base,
        { field: 'bhk', question: "BHK Configuration:", type: 'select', options: ['1 BHK', '2 BHK', '3 BHK', '4 BHK'] },
        { field: 'sqft', question: "Area (sqft):", type: 'number', placeholder: 'e.g., 1000' },
        { field: 'expectedRent', question: "Target Monthly Rent (₹):", type: 'number', placeholder: 'e.g., 35000' },
        { field: 'securityDepositMonths', question: "Security Deposit (Months):", type: 'number', placeholder: 'e.g., 6' },
      ];
    }

    if (mode === 'land') {
      return [
        ...base,
        { field: 'plotSize', question: "Plot Size:", type: 'number', placeholder: 'e.g., 2000' },
        { field: 'unit', question: "Measurement Unit:", type: 'select', options: ['sqft', 'sqyd', 'sqmt', 'acre'] },
        { field: 'fsi', question: "Permissible FSI:", type: 'number', placeholder: 'e.g., 2.5' },
        { field: 'approvals', question: "Legal Approvals:", type: 'select', options: ['NA', 'RERA', 'None'] },
      ];
    }

    return base;
  };

  const activeSteps = getActiveSteps();
  const currentStep = activeSteps[currentStepIndex];

  useEffect(() => {
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
    setFormData({});
  }, [mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleNext = async (value: any) => {
    if (typeof value === 'string' && !value.trim() && currentStep?.type !== 'multi-select') return;

    const displayValue = value.toString();
    setMessages(prev => [...prev, { id: `user-${Date.now()}`, sender: 'user', text: displayValue }]);

    let updatedData = { ...formData, [currentStep.field]: value };
    
    // Auto-pincode logic
    if (currentStep.field === 'address' && CITY_DATA[formData.city]?.pincodes[value]) {
       updatedData.pincode = CITY_DATA[formData.city].pincodes[value];
    }

    setFormData(updatedData);
    setInputValue('');

    // Skip logic for Pincode if already auto-filled
    let nextIndex = currentStepIndex + 1;
    if (activeSteps[nextIndex]?.field === 'pincode' && updatedData.pincode) {
        nextIndex++;
    }

    // Skip logic for Possession Year if Ready to Move
    if (currentStep.field === 'possessionStatus' && value === 'Ready to Move') {
        nextIndex++;
    }

    if (nextIndex < activeSteps.length) {
      setCurrentStepIndex(nextIndex);
      setTimeout(() => setMessages(prev => [...prev, { id: `bot-${Date.now()}`, sender: 'bot', text: activeSteps[nextIndex].question }]), 400);
    } else {
      setTimeout(() => {
        setMessages(prev => [...prev, { id: `bot-fin`, sender: 'bot', text: "DATA_LAKE_SYNCHRONIZED. Analyzing market vectors..." }]);
        onComplete(updatedData);
      }, 600);
    }
  };

  const renderInputs = () => {
    if (isLoading || suggestExpansion) return null;

    if (currentStep.type === 'locality-picker') {
        const localities = CITY_DATA[formData.city]?.localities || [];
        return (
            <div className="flex flex-wrap gap-2">
                {localities.map(loc => (
                    <button key={loc} onClick={() => handleNext(loc)} className="px-4 py-2 bg-cyber-card border border-cyber-border hover:border-cyber-teal text-white rounded-lg text-[10px] font-mono transition-all">
                        {loc.toUpperCase()}
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
