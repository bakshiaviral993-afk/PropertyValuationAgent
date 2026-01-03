
import React from 'react';
import { RentResult } from '../types';
import { 
  MapPin, ExternalLink, Zap, Terminal, Globe, MessageSquare, TrendingUp, Calculator, AlertTriangle
} from 'lucide-react';

interface RentDashboardProps {
  result: RentResult;
}

const RentDashboard: React.FC<RentDashboardProps> = ({ result }) => {
  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 overflow-y-auto pr-2 scrollbar-thin">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-3xl p-6 border-l-4 border-l-cyber-teal bg-cyber-teal/5 relative">
            {result.rentOutAlert && (
                <div className="absolute -top-3 -right-3 px-3 py-1 bg-cyber-lime text-black text-[9px] font-bold font-mono rounded-full shadow-neon-teal animate-bounce flex items-center gap-1">
                    <Zap size={10} /> RENT_OUT_NOW
                </div>
            )}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-cyber-teal text-cyber-black rounded-lg"><TrendingUp size={20} /></div>
                <h2 className="text-sm font-mono font-bold text-white uppercase tracking-widest">Rental Yield Intelligence</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-black/40 rounded-2xl border border-cyber-teal/20">
                    <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1 block">Projected Yield</span>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-cyber-teal break-words">{result.yieldPercentage}</div>
                </div>
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                    <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1 block">Demand Score</span>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-white">{result.tenantDemandScore}/100</div>
                </div>
            </div>

            <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                <h4 className="text-[10px] font-mono text-gray-400 uppercase mb-2 flex items-center gap-2">
                    <Calculator size={12} className="text-cyber-teal" /> Deposit Analysis
                </h4>
                <p className="text-[11px] text-white font-mono leading-relaxed">{result.depositCalc}</p>
            </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 border-l-4 border-l-cyber-lime bg-cyber-lime/5">
            <h3 className="text-sm font-mono font-bold text-white mb-4 flex items-center gap-2">
                <MessageSquare size={16} className="text-cyber-lime" /> Negotiation Strategy
            </h3>
            <div className="bg-black/60 p-5 rounded-2xl border border-cyber-lime/20 h-[calc(100%-40px)] flex flex-col">
                <p className="text-[11px] text-gray-300 font-mono leading-relaxed italic whitespace-pre-wrap flex-1">
                    {result.negotiationScript}
                </p>
                <div className="mt-4 pt-4 border-t border-white/5 text-[9px] text-gray-500 font-mono uppercase">
                    Confidence Interval: {result.confidenceScore}% Accuracy
                </div>
            </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6 border border-white/5">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
                <Globe size={18} className="text-cyber-teal" />
                <h3 className="text-sm font-mono font-bold text-white tracking-widest uppercase">Locality Market Comps</h3>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.listings.map((item, idx) => (
                <div key={idx} className="group bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:border-cyber-lime/40 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 mr-4 overflow-hidden">
                            <h4 className="font-bold text-white text-sm truncate">{item.title}</h4>
                            <p className="text-[10px] text-gray-500 mt-1 truncate">{item.address}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm sm:text-base font-mono font-bold text-cyber-lime break-words">{item.rent}</div>
                            <div className="text-[8px] text-gray-600 uppercase">Within 5km</div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/5 pt-4">
                        <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] text-gray-400 font-mono">{item.bhk}</span>
                        <a 
                          href={item.sourceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-lime text-cyber-black text-[9px] font-mono font-bold hover:bg-white transition-all shadow-neon-teal"
                        >
                            SECURE_SOURCE <ExternalLink size={10} />
                        </a>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default RentDashboard;
