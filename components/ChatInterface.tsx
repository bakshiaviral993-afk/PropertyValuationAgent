import React, { useState, useEffect, useRef } from 'react';
import { ValuationRequest, ChatMessage, StepField, AppMode, RentRequest } from '../types';
import { WIZARD_STEPS } from '../constants';
import { Send, Cpu, Mic, XCircle, Pencil, LocateFixed, Search, Map } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from "@google/genai";
import { createBlob, decodeAudioData, decode } from '../utils/audioUtils';

declare global {
  interface Window {
    L: any;
  }
}

interface ChatInterfaceProps {
  onComplete: (data: any) => void;
  isLoading: boolean;
  mode: AppMode;
}

const RENT_STEPS = [
  { field: 'state', question: "Welcome to Rental Search. Which state should I scan?", type: 'text', placeholder: 'e.g., Maharashtra' },
  { field: 'city', question: "And which city?", type: 'text', placeholder: 'e.g., Mumbai' },
  { field: 'area', question: "Please provide the locality. I will scan a 2km radius around this point.", type: 'text', placeholder: 'e.g., Bandra West' },
  { field: 'bhk', question: "What property type are you looking for?", type: 'select', options: ['1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Villa'] },
];

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onComplete, isLoading, mode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [inputValue, setInputValue] = useState('');
  
  const activeSteps = mode === 'valuation' ? WIZARD_STEPS : RENT_STEPS;
  const currentStep = activeSteps[currentStepIndex];
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        sender: 'bot',
        text: mode === 'valuation' ? "Valuation Module Active. Initializing data acquisition." : "Rental Search Engine Active. Locating regional feeds.",
      }, {
        id: 'q1',
        sender: 'bot',
        text: activeSteps[0].question,
      }]);
    }
  }, [mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const addBotMessage = (text: string) => {
    setMessages(prev => [...prev, { id: `bot-${Date.now()}`, sender: 'bot', text }]);
  };

  const handleNext = async (value: string) => {
    if (!value.trim()) return;

    // Validation for Year
    if (mode === 'valuation' && currentStep.field === StepField.ConstructionYear) {
      const year = Number(value);
      const currentYear = new Date().getFullYear();
      if (year < 1850 || year > currentYear) {
        addBotMessage(`Invalid year. Range allowed: 1850-${currentYear}.`);
        return;
      }
    }

    const newMessages: ChatMessage[] = [...messages, { 
      id: `user-${Date.now()}`, 
      sender: 'user', 
      text: value,
      stepIndex: currentStepIndex
    }];
    setMessages(newMessages);

    const updatedData = { ...formData, [currentStep.field]: value };
    setFormData(updatedData);
    setInputValue('');

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < activeSteps.length) {
      setCurrentStepIndex(nextIndex);
      setTimeout(() => addBotMessage(activeSteps[nextIndex].question), 400);
    } else {
      setTimeout(() => {
        addBotMessage(mode === 'valuation' ? "Data collected. Syncing with market databases..." : "Radius scan initiated. Extracting listings...");
        onComplete(updatedData);
      }, 600);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleNext(inputValue);
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl overflow-hidden shadow-glass border border-cyber-border">
      {/* Header */}
      <div className="px-5 py-4 border-b border-cyber-border bg-black/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${mode === 'valuation' ? 'border-cyber-teal text-cyber-teal' : 'border-cyber-lime text-cyber-lime'}`}>
             {mode === 'valuation' ? <Cpu size={16} /> : <Search size={16} />}
          </div>
          <div>
             <h2 className="text-white font-mono text-sm tracking-widest font-bold uppercase">{mode}_INTERFACE</h2>
             <p className={`${mode === 'valuation' ? 'text-cyber-teal' : 'text-cyber-lime'} text-[10px] tracking-wide animate-pulse`}>READY</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed backdrop-blur-sm shadow-lg ${
                msg.sender === 'user'
                  ? mode === 'valuation' ? 'bg-cyber-teal/10 border border-cyber-teal/30 text-cyber-teal rounded-br-none' : 'bg-cyber-lime/10 border border-cyber-lime/30 text-cyber-lime rounded-br-none'
                  : 'bg-cyber-card/80 border border-cyber-border text-cyber-text rounded-bl-none'
              }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-cyber-card/50 border border-cyber-border rounded-2xl rounded-bl-none px-4 py-3 flex items-center space-x-1.5">
                <div className="w-1.5 h-1.5 bg-cyber-lime rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-cyber-lime rounded-full animate-bounce delay-100" />
                <div className="w-1.5 h-1.5 bg-cyber-lime rounded-full animate-bounce delay-200" />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-black/20 border-t border-cyber-border">
        {!isLoading && currentStep && (
          <div className="flex flex-col gap-3">
             {currentStep.type === 'select' ? (
                 <div className="flex flex-wrap gap-2">
                    {currentStep.options?.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleNext(opt)}
                          className="px-4 py-2 bg-cyber-card border border-cyber-border hover:border-cyber-teal text-cyber-text hover:text-cyber-teal rounded-lg text-xs font-mono transition-all"
                        >
                            {opt}
                        </button>
                    ))}
                 </div>
             ) : (
                <div className="relative group">
                    <input
                      type={currentStep.type === 'number' ? 'number' : 'text'}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={currentStep.placeholder}
                      className="w-full pl-4 pr-12 py-3 bg-cyber-black border border-cyber-border rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyber-teal transition-all"
                      autoFocus
                    />
                    <button
                      onClick={() => handleNext(inputValue)}
                      disabled={!inputValue.trim()}
                      className={`absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center rounded transition-colors ${mode === 'valuation' ? 'bg-cyber-teal text-cyber-black' : 'bg-cyber-lime text-cyber-black'}`}
                    >
                      <Send size={16} />
                    </button>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;