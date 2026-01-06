
import React, { useState } from 'react';
import { Compass, Wind, Calendar, Sparkles, MessageSquareText, Info } from 'lucide-react';
import PropertyChat from './PropertyChat';
import PanchangWidget from './PanchangWidget';
import { AppLang } from '../types';

interface HarmonyDashboardProps {
  contextResult?: any;
  lang: AppLang;
}

const HarmonyDashboard: React.FC<HarmonyDashboardProps> = ({ contextResult, lang }) => {
  const [activeTab, setActiveTab] = useState<'vastu' | 'feng-shui' | 'panchang'>('panchang');

  return (
    <div className="h-full flex flex-col gap-10 animate-in fade-in slide-in-from-right-10 duration-1000">
      {/* Tab Selectors */}
      <div className="bg-neo-glass border border-white/10 p-2 rounded-3xl flex gap-2">
        <button 
          onClick={() => setActiveTab('panchang')} 
          className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'panchang' ? 'bg-neo-neon text-white shadow-neo-glow' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
        >
          <Calendar size={18} /> Daily Panchang
        </button>
        <button 
          onClick={() => setActiveTab('vastu')} 
          className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'vastu' ? 'bg-neo-neon text-white shadow-neo-glow' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
        >
          <Compass size={18} /> Vastu Consultant
        </button>
        <button 
          onClick={() => setActiveTab('feng-shui')} 
          className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'feng-shui' ? 'bg-neo-neon text-white shadow-neo-glow' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
        >
          <Wind size={18} /> Feng Shui Master
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-h-0">
          {activeTab === 'panchang' ? (
            <div className="space-y-8 overflow-y-auto h-full pr-2 scrollbar-hide">
              <PanchangWidget lang={lang} />
              
              <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-4 shadow-glass-3d">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="text-neo-pink" size={20} />
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Why Harmony Matters?</h4>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Integrating Vastu, Feng Shui, and Panchang creates a "Holistic Asset Score". 
                  While valuation measures the physical price, harmony measures the spiritual and directional prosperity of the home.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-4 bg-white/5 rounded-2xl">
                    <div className="text-[10px] text-neo-neon font-black uppercase mb-1">Vastu</div>
                    <div className="text-xs text-gray-300">85% Compliance Recommendation</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl">
                    <div className="text-[10px] text-neo-pink font-black uppercase mb-1">Feng Shui</div>
                    <div className="text-xs text-gray-300">Wealth Corner Activation: SE</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <PropertyChat 
              lang={lang} 
              contextResult={contextResult} 
              initialIntent={activeTab} 
            />
          )}
        </div>

        {activeTab === 'panchang' && (
           <div className="w-full lg:w-[350px] shrink-0 space-y-6">
             <div className="bg-neo-neon/10 border border-neo-neon/20 rounded-[40px] p-8 space-y-4">
                <div className="flex items-center gap-2 text-neo-neon mb-2">
                  <Info size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Upcoming Alerts</span>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-neo-neon mt-1.5 shadow-neo-glow" />
                    <p className="text-[11px] text-gray-300 font-medium leading-relaxed">Next Ekadashi on Thursday: Highly auspicious for starting new renovations.</p>
                  </div>
                  <div className="flex gap-4 opacity-50">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mt-1.5" />
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">Amavasya detected in 4 days: Avoid entering new rental agreements.</p>
                  </div>
                </div>
             </div>
             <button 
                onClick={() => setActiveTab('vastu')}
                className="w-full py-6 bg-neo-glass border border-white/10 rounded-[32px] flex items-center justify-center gap-3 text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-white/5 transition-all shadow-glass-3d"
             >
               <MessageSquareText size={18} /> Chat with Specialist
             </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default HarmonyDashboard;
