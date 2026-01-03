
import React from 'react';
import { BuyResult } from '../types';
import { MapPin, ExternalLink, TrendingUp, Calculator, Globe, MessageSquare, ShieldCheck, Zap, SearchCheck } from 'lucide-react';

interface BuyDashboardProps {
  result: BuyResult;
}

const BuyDashboard: React.FC<BuyDashboardProps> = ({ result }) => {
  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 overflow-y-auto pr-2 scrollbar-thin">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-3xl p-6 border-l-4 border-l-cyber-teal bg-cyber-teal/5 relative">
          <div className="absolute top-4 right-4">
             <span className={`px-4 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase shadow-glass ${
                result.recommendation === 'Good Buy' ? 'bg-cyber-lime text-black border-cyber-lime' :
                result.recommendation === 'Overpriced' ? 'bg-red-500 text-white border-red-500' :
                'bg-cyber-teal text-black border-cyber-teal'
             }`}>
                <Zap size={10} className="inline mr-1" /> {result.recommendation}
             </span>
          </div>
          <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-cyber-teal text-cyber-black rounded-lg"><Calculator size={20} /></div>
             <h3 className="text-sm font-mono font-bold text-white uppercase tracking-widest">Resale Fair Value</h3>
          </div>
          <div className="space-y-4">
            <div className="p-5 bg-black/40 rounded-2xl border border-white/10 shadow-inner overflow-hidden">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1 block">Algorithm Fair Value</span>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-cyber-teal tracking-tighter break-words max-w-full">{result.fairValue}</div>
              <div className="text-[10px] font-mono text-gray-600 mt-1">Range: {result.valuationRange}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                <span className="text-[9px] font-mono text-gray-600 uppercase block">Registration Est.</span>
                <span className="text-[10px] sm:text-xs font-mono font-bold text-white break-words">{result.registrationEstimate}</span>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                <span className="text-[9px] font-mono text-gray-600 uppercase block">5Y Appreciation</span>
                <span className="text-[10px] sm:text-xs font-mono font-bold text-cyber-lime break-words">{result.appreciationPotential}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 border-l-4 border-l-cyber-lime bg-cyber-lime/5">
          <h3 className="text-sm font-mono font-bold text-white mb-4 flex items-center gap-2">
            <MessageSquare size={16} className="text-cyber-lime" /> Negotiation Playbook
          </h3>
          <div className="bg-black/60 p-5 rounded-2xl border border-cyber-lime/20 h-[calc(100%-48px)] flex flex-col">
              <p className="text-[11px] text-gray-300 font-mono leading-relaxed italic whitespace-pre-wrap flex-1">
                  {result.negotiationScript}
              </p>
              <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase">
                    <ShieldCheck size={12} className="text-cyber-teal" /> Verified Comps
                </div>
                <div className="text-[10px] font-mono text-cyber-lime">{result.confidenceScore}% Confidence</div>
              </div>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6 border border-white/5">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-mono font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <Globe size={18} className="text-cyber-teal" /> Web Scanned & Budget Matched
          </h3>
          <div className="flex items-center gap-2 px-3 py-1 bg-cyber-teal/10 border border-cyber-teal/30 rounded-lg text-[9px] font-mono text-cyber-teal uppercase animate-pulse">
            <SearchCheck size={12} /> Live Scan Active
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.listings.map((item, idx) => (
            <div key={idx} className="group bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:border-cyber-teal/40 transition-all relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 mr-4">
                  <h4 className="font-bold text-white text-sm truncate">{item.title}</h4>
                  <p className="text-[10px] text-gray-500 mt-1 truncate">{item.address}</p>
                </div>
                <div className="text-right">
                  <div className="text-base sm:text-lg font-mono font-bold text-cyber-teal break-words">{item.price}</div>
                  <div className="text-[8px] text-cyber-lime font-mono uppercase font-bold tracking-tighter">Budget Verified</div>
                </div>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-4">
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] text-gray-400 font-mono">{item.bhk}</span>
                  {item.emiEstimate && <span className="px-2 py-0.5 rounded bg-cyber-teal/10 text-[9px] text-cyber-teal font-mono">EMI: {item.emiEstimate}</span>}
                </div>
                <a 
                  href={item.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-cyber-teal text-cyber-black rounded-lg hover:bg-white transition-all text-[9px] font-bold font-mono shadow-neon-teal"
                >
                  SECURE_SOURCE <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BuyDashboard;
