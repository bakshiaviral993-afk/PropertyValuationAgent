
import React, { useState } from 'react';
import { X, ChevronRight, Zap, Target, Calculator, Bookmark, MousePointer2 } from 'lucide-react';

interface TutorialOverlayProps {
  onClose: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);

  const tutorialSteps = [
    {
      icon: <Zap className="text-cyber-teal" size={32} />,
      title: "NEURAL_LINK_ESTABLISHED",
      description: "Welcome to QuantCasa. I am your AI analyst. I perform real-time market grounding to find verified property values across the globe.",
      hint: "Let's explore your tactical console."
    },
    {
      icon: <Target className="text-cyber-orange" size={32} />,
      title: "MULTI_MODAL_SEARCH",
      description: "Switch between BUY, SELL, RENT, or LAND modes in the top navigation. Each mode uses a specialized neural model for valuation.",
      hint: "Top bar houses your primary mode switches."
    },
    {
      icon: <MousePointer2 className="text-cyber-teal" size={32} />,
      title: "INTERACTIVE_CHAT_WIZARD",
      description: "Input parameters through our conversational interface. We support voice input, locality pickers, and precision price sliders.",
      hint: "The panel on the left is your data entry hub."
    },
    {
      icon: <Calculator className="text-cyber-lime" size={32} />,
      title: "FINANCE_SIMULATOR",
      description: "Access the FINANCE module to simulate EMIs, Stamp Duty, and Registration charges with high-precision regulatory data.",
      hint: "Analyze the fiscal feasibility of any asset."
    },
    {
      icon: <Bookmark className="text-cyber-teal" size={32} />,
      title: "SAVED_INTELLIGENCE",
      description: "Bookmark any research report to your local cache. Access them anytime through the Bookmark icon in the header.",
      hint: "Never lose a high-value signal again."
    }
  ];

  const currentStep = tutorialSteps[step];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-cyber-black/80 backdrop-blur-md animate-in fade-in duration-500">
      <div className="max-w-md w-full glass-panel rounded-[32px] p-8 border border-white/10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
          {currentStep.icon}
        </div>
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-500 transition-all"
        >
          <X size={20} />
        </button>

        <div className="mb-8 flex flex-col items-center text-center">
          <div className="p-5 rounded-[24px] bg-white/5 border border-white/10 mb-6 shadow-neon-teal transition-transform hover:scale-110 duration-500">
            {currentStep.icon}
          </div>
          <h2 className="text-xl font-mono font-bold text-white uppercase tracking-widest mb-4">
            {currentStep.title}
          </h2>
          <p className="text-sm text-gray-400 font-mono leading-relaxed mb-6">
            {currentStep.description}
          </p>
          <div className="px-4 py-2 rounded-lg bg-cyber-teal/10 border border-cyber-teal/20 text-[10px] font-mono text-cyber-teal uppercase tracking-widest">
            {currentStep.hint}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-1.5">
            {tutorialSteps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1 rounded-full transition-all ${i === step ? 'w-6 bg-cyber-teal' : 'w-2 bg-white/10'}`} 
              />
            ))}
          </div>

          <button 
            onClick={() => {
              if (step < tutorialSteps.length - 1) setStep(step + 1);
              else onClose();
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyber-teal text-cyber-black font-bold text-xs font-mono shadow-neon-teal hover:bg-white transition-all active:scale-95"
          >
            {step === tutorialSteps.length - 1 ? 'START_MISSION' : 'NEXT_SIGNAL'} <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;
