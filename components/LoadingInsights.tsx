
import React, { useState, useEffect } from 'react';
import { Info, TrendingUp, Zap, Newspaper, Building, Search, Globe, Database, BrainCircuit } from 'lucide-react';

const INSIGHTS = [
  { icon: <Globe size={18}/>, type: 'Grounding', text: "Accessing live real estate indices for Mumbai West and Bandra..." },
  { icon: <Search size={18}/>, type: 'Indexing', text: "Scanning 50+ verified listings from MagicBricks, 99acres, and Housing.com..." },
  { icon: <Database size={18}/>, type: 'Analytics', text: "Comparing floor rise premiums and building age depreciation algorithms..." },
  { icon: <BrainCircuit size={18}/>, type: 'Synthesis', text: "Applying Vastu premium adjustments and connectivity scores..." },
  { icon: <Newspaper size={18}/>, type: 'Context', text: "Detecting upcoming infrastructure signals (Metro Line 3 Phase 1)..." },
  { icon: <TrendingUp size={18}/>, type: 'Market', text: "Evaluating rental yield trends for IT hubs vs Residential corridors..." }
];

const LoadingInsights: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % INSIGHTS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-[#1a1a2e]/60 backdrop-blur-xl rounded-[32px] p-8 border border-neo-neon/30 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden relative group shadow-neo-glow">
      <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 transition-transform group-hover:scale-125 duration-1000">
        {React.cloneElement(INSIGHTS[index].icon as React.ReactElement, { size: 100 })}
      </div>
      
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-neo-neon to-neo-pink text-white flex items-center justify-center shadow-neo-glow animate-pulse">
          {INSIGHTS[index].icon}
        </div>
        <span className="text-[10px] font-black text-neo-neon uppercase tracking-[0.3em]">
          INTELLIGENCE_LAYER • {INSIGHTS[index].type}
        </span>
      </div>
      
      <p className="text-base font-medium text-gray-200 leading-relaxed min-h-[60px] animate-in slide-in-from-right-4 duration-700">
        "{INSIGHTS[index].text}"
      </p>
      
      <div className="mt-6 flex gap-2">
        {INSIGHTS.map((_, i) => (
          <div 
            key={i} 
            className={`h-1 rounded-full transition-all duration-700 ${i === index ? 'w-10 bg-neo-neon shadow-neo-glow' : 'w-2 bg-white/10'}`} 
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingInsights;
