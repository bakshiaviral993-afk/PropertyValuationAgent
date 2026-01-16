import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, AppMode, WizardStep, AppLang } from '../types';
import { Send, ChevronLeft, Mic, MicOff, Edit2, History, Loader2, Sparkles, Edit3, IndianRupee, MapPin, Search, CheckCircle2 } from 'lucide-react';
import LoadingInsights from './LoadingInsights';
import { SpeechInput } from '../services/voiceService';
import { resolveLocalityData, formatPrice } from '../services/geminiService';

interface ChatInterfaceProps {
  onComplete: (data: any) => void;
  isLoading: boolean;
  mode: AppMode;
  lang: AppLang;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onComplete, isLoading, mode, lang }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [formData, setFormData] = useState<any>({});
  const [inputValue, setInputValue] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<any[]>([]); 
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isManualEntry, setIsManualEntry] = useState<boolean>(false);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [localityOptions, setLocalityOptions] = useState<string[]>([]);
  const [pincodeOptions, setPincodeOptions] = useState<string[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Dynamic cities/localities – no hardcodes
  const [cities, setCities] = useState<string[]>([]); // Fetch dynamically if needed
  useEffect(() => {
    // Example dynamic fetch – replace with real API if needed
    setCities(['Mumbai', 'Pune', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata']); // Can be fetched from backend
  }, []);

  const steps: WizardStep[] = getSteps(mode, lang); // Assume getSteps is defined elsewhere

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  useEffect(() => {
    if (!isManualEntry) {
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: steps[currentStepIndex].question }]);
    }
    inputRef.current?.focus();
  }, [currentStepIndex, isManualEntry]);

  useEffect(() => {
    if (selectedCity) {
      resolveLocalityData(selectedCity, selectedCity).then(setLocalityOptions);
    }
  }, [selectedCity]);

  useEffect(() => {
    if (formData.area) {
      resolveLocalityData(formData.area, selectedCity, 'pincode').then(setPincodeOptions);
    }
  }, [formData.area, selectedCity]);

  const handleNext = (value: string) => {
    if (!value.trim()) return;

    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), sender: 'user', text: value },
    ]);

    const step = steps[currentStepIndex];
    const updatedData = { ...formData, [step.field]: value };
    setFormData(updatedData);

    if (step.type === 'city-picker') setSelectedCity(value);

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setInputValue('');
      setIsManualEntry(false);
    } else {
      onComplete(updatedData);
    }
  };

  const handleVoiceInput = (text: string) => {
    setInputValue(text);
    handleNext(text);
  };

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  const handleEdit = (index: number) => {
    if (messages[index].sender !== 'user') return;
    const stepIdx = Math.floor(index / 2);
    const field = steps[stepIdx]?.field;
    if (!field) return;
    
    const oldValue = formData[field];
    setHistory(prev => [...prev, { field, oldValue, timestamp: Date.now() }]);
    setCurrentStepIndex(stepIdx);
    setInputValue(String(oldValue));
    setIsManualEntry(true);
    setMessages(prev => prev.slice(0, index)); 
  };

  return (
    <div className="bg-neo-glass/80 backdrop-blur-xl rounded-[40px] border border-white/10 shadow-neo-glass p-8 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => onComplete(null)} className="p-3 bg-white/5 rounded-2xl border border-white/10 text-gray-500 hover:text-white transition-all shadow-glass-3d">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{mode.toUpperCase()} Analysis</h2>
          <p className="text-[10px] text-gray-500 uppercase font-black opacity-60 tracking-widest">Node Grounding in Progress</p>
        </div>
      </div>

      <div ref={chatRef} className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-hide">
        {messages.map((msg, idx) => (
          <div key={msg.id} className={`flex ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'} gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500`} style={{ animationDelay: `${idx * 50}ms` }}>
            {msg.sender === 'bot' ? (
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-gray-400 hover:text-white transition-all shadow-glass-3d">
                <Sparkles size={20} />
              </div>
            ) : (
              <div className="p-3 bg-neo-neon rounded-2xl text-white shadow-neo-glow">
                <Edit2 size={20} />
              </div>
            )}
            <div className={`p-6 rounded-3xl max-w-[80%] ${msg.sender === 'bot' ? 'bg-white/5 border border-white/10 shadow-glass-3d' : 'bg-neo-neon text-white shadow-neo-glow'}`}>
              <p className="text-sm leading-relaxed">{msg.text}</p>
              {msg.sender === 'user' && (
                <button onClick={() => handleEdit(idx)} className="mt-2 text-[10px] text-gray-500 hover:text-white flex items-center gap-1 uppercase tracking-widest">
                  <Edit2 size={12} /> Edit
                </button>
              )}
            </div>
          </div>
        ))}

        {isLoading && <LoadingInsights />}
      </div>

      {!isLoading && (
        <div className="mt-8">
          {currentStep.type === 'text' || currentStep.type === 'number' ? (
            <div className="relative flex gap-3 animate-in fade-in duration-300">
              <div className="absolute left-6 inset-y-0 flex items-center pointer-events-none text-gray-500">
                <Edit3 size={18}/>
              </div>
              <input 
                autoFocus 
                type={currentStep.type === 'number' ? 'number' : 'text'}
                placeholder={currentStep.placeholder || `Enter ${currentStep.field}...`}
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 py-4 text-sm font-bold text-white focus:border-neo-neon outline-none" 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleNext(inputValue)} 
              />
              <button onClick={() => handleNext(inputValue)} className="w-14 h-14 bg-neo-neon rounded-2xl flex items-center justify-center text-white shadow-neo-glow hover:scale-105 active:scale-95 transition-all">
                <Send size={20} />
              </button>
            </div>
          ) : currentStep.type === 'select' ? (
            <div className="flex flex-wrap gap-3">
              {currentStep.options?.map(o => (
                <button key={o} onClick={() => handleNext(o)} className="flex-1 min-w-[100px] h-12 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-gray-200 hover:border-neo-neon transition-all uppercase tracking-widest">{o}</button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
