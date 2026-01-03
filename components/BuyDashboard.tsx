
import React, { useState, useEffect } from 'react';
import { BuyResult } from '../types';
import { 
  MapPin, ExternalLink, TrendingUp, Calculator, Globe, 
  MessageSquare, ShieldCheck, Zap, SearchCheck, Percent, 
  Clock, Wallet, Landmark, Building2
} from 'lucide-react';

interface BuyDashboardProps {
  result: BuyResult;
  buyType?: 'New Buy' | 'Resale';
}

const BuyDashboard: React.FC<BuyDashboardProps> = ({ result, buyType }) => {
  // Parse numeric value from fairValue string (e.g., "₹85.00 L" or "₹1.20 Cr")
  const parseValue = (valStr: string): number => {
    const cleanStr = valStr.replace(/[₹, ]/g, '');
    if (cleanStr.includes('Cr')) {
      return parseFloat(cleanStr.replace('Cr', '')) * 10000000;
    }
    if (cleanStr.includes('L')) {
      return parseFloat(cleanStr.replace('L', '')) * 100000;
    }
    return parseFloat(cleanStr) || 0;
  };

  const initialPrincipal = parseValue(result.fairValue);
  
  // Mortgage State
  const [loanAmount, setLoanAmount] = useState(Math.round(initialPrincipal * 0.8)); // Default 80% LTV
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);
  const [emi, setEmi] = useState(0);

  useEffect(() => {
    const p = loanAmount;
    const r = interestRate / 12 / 100;
    const n = tenure * 12;
    if (r === 0) {
      setEmi(p / n);
    } else {
      const emiValue = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      setEmi(Math.round(emiValue));
    }
  }, [loanAmount, interestRate, tenure]);

  const formatPrice = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString()}`;
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 overflow-y-auto pr-2 pb-10 scrollbar-thin">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fair Value Panel */}
        <div className="glass-panel rounded-3xl p-6 border-l-4 border-l-cyber-teal bg-cyber-teal/5 relative flex flex-col min-h-[250px]">
          <div className="absolute top-4 right-4 flex gap-2 z-10">
             {buyType && (
               <span className="px-3 py-1.5 rounded-full bg-cyber-black border border-white/10 text-[9px] font-mono font-bold text-cyber-teal uppercase flex items-center gap-1 shadow-glass">
                  {buyType === 'New Buy' ? <Building2 size={10} /> : <Landmark size={10} />}
                  {buyType}
               </span>
             )}
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
             <h3 className="text-sm font-mono font-bold text-white uppercase tracking-widest">
               {buyType === 'New Buy' ? 'Primary Market' : 'Resale'} Fair Value
             </h3>
          </div>
          <div className="space-y-4 flex-1">
            <div className="p-5 bg-black/40 rounded-2xl border border-white/10 shadow-inner flex flex-col justify-center min-h-[100px]">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1 block">Algorithm Fair Value</span>
              <div className="text-3xl sm:text-4xl font-mono font-bold text-cyber-teal tracking-tighter break-words leading-tight text-glow-teal">{result.fairValue}</div>
              <div className="text-[10px] font-mono text-gray-600 mt-1">Range: {result.valuationRange}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                <span className="text-[9px] font-mono text-gray-600 uppercase block">Registration Est.</span>
                <span className="text-xs font-mono font-bold text-white break-words">{result.registrationEstimate}</span>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                <span className="text-[9px] font-mono text-gray-600 uppercase block">5Y Appreciation</span>
                <span className="text-xs font-mono font-bold text-cyber-lime break-words">{result.appreciationPotential}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mortgage Calculator Widget */}
        <div className="glass-panel rounded-3xl p-6 border-l-4 border-l-cyber-orange bg-cyber-orange/5 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-cyber-orange text-black rounded-lg"><Wallet size={20} /></div>
             <h3 className="text-sm font-mono font-bold text-white uppercase tracking-widest">Mortgage Protocol</h3>
          </div>
          
          <div className="space-y-6 flex-1">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono text-gray-500 uppercase">Loan Amount</label>
                <span className="text-xs font-mono font-bold text-cyber-orange">{formatPrice(loanAmount)}</span>
              </div>
              <input 
                type="range" 
                min={initialPrincipal * 0.1} 
                max={initialPrincipal * 1.5} 
                step={50000}
                value={loanAmount}
                onChange={(e) => setLoanAmount(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyber-orange"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-mono text-gray-600 uppercase flex items-center gap-1"><Percent size={10}/> Rate</label>
                  <span className="text-[10px] font-mono text-white">{interestRate}%</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="15" 
                  step="0.1" 
                  value={interestRate} 
                  onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyber-teal"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-mono text-gray-600 uppercase flex items-center gap-1"><Clock size={10}/> Tenure</label>
                  <span className="text-[10px] font-mono text-white">{tenure} Yrs</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="30" 
                  step="1" 
                  value={tenure} 
                  onChange={(e) => setTenure(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyber-lime"
                />
              </div>
            </div>

            <div className="p-4 bg-black/40 rounded-2xl border border-cyber-orange/20 mt-auto flex justify-between items-center shadow-inner">
               <div>
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">Estimated Monthly EMI</span>
                  <div className="text-2xl font-mono font-bold text-cyber-orange tracking-tighter text-glow-orange">₹{emi.toLocaleString()}</div>
               </div>
               <div className="text-right">
                  <Landmark size={24} className="text-cyber-orange opacity-40 inline-block" />
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6 border-l-4 border-l-cyber-lime bg-cyber-lime/5">
        <h3 className="text-sm font-mono font-bold text-white mb-4 flex items-center gap-2">
          <MessageSquare size={16} className="text-cyber-lime" /> Negotiation Playbook
        </h3>
        <div className="bg-black/60 p-5 rounded-2xl border border-cyber-lime/20 flex flex-col min-h-[120px]">
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
            <div key={idx} className="group bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:border-cyber-teal/40 transition-all relative">
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex justify-between items-start gap-4">
                  <h4 className="font-bold text-white text-sm truncate flex-1 uppercase tracking-tight">{item.title}</h4>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-mono font-bold text-cyber-teal leading-none">{item.price}</div>
                    <div className="text-[7px] text-cyber-lime font-mono uppercase font-bold tracking-widest mt-1">Verified</div>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 truncate">{item.address}</p>
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
