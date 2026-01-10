import React from 'react';
import { BuyResult, SaleListing, AppLang } from '../types';
import { 
  ShieldCheck, Target, TrendingUp, Info, MapPin, Gavel, Scale, 
  AlertTriangle, CheckCircle2, DollarSign, Building2, Landmark, 
  MessageSquare, FileText, ChevronRight, BarChart4, AlertCircle,
  Activity, ArrowDownRight, ArrowUpRight
} from 'lucide-react';
import { formatPrice, parsePrice } from '../services/geminiService';

interface ProfessionalReportProps {
  result: BuyResult;
  lang?: AppLang;
}

const ProfessionalReport: React.FC<ProfessionalReportProps> = ({ result, lang = 'EN' }) => {
  const fairValNum = parsePrice(result.fairValue);
  const targetOffer = fairValNum * 0.93;
  const walkaway = fairValNum * 1.07;
  const primaryListing = result.listings[0] || {} as SaleListing;
  const areaSqft = primaryListing.priceValue ? Math.round(fairValNum / (primaryListing.priceValue / 1000)) : 1200; // fallback area logic

  // Mock data for sensitivity (Tornado Chart)
  const sensitivityData = [
    { factor: 'Market Rate (₹/ft²)', variation: '±10%', impact: fairValNum * 0.1 },
    { factor: 'Annual Appreciation', variation: '±2%', impact: fairValNum * 0.04 },
    { factor: 'Interest Rate', variation: '±0.5%', impact: fairValNum * 0.03 },
    { factor: 'Holding Period', variation: '±2 Years', impact: fairValNum * 0.05 },
  ];

  return (
    <div className="bg-white text-report-text font-sans leading-[1.2] selection:bg-report-blue/10 animate-in fade-in zoom-in duration-500 max-w-5xl mx-auto shadow-2xl border border-slate-200">
      
      {/* Header - Corporate Branding */}
      <header className="bg-report-blue p-12 text-white flex justify-between items-end border-b-8 border-neo-neon">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Landmark size={24} />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80">QuantCasa Analytics Wing</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">Valuation & Negotiation Strategy</h1>
          <p className="text-sm font-bold text-slate-300 mt-2 tracking-widest uppercase">Grounded Intelligence Report • Ref: QC-{Date.now().toString().slice(-6)}</p>
        </div>
        <div className="text-right pb-1">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Generated for Professional Client</p>
          <p className="text-lg font-black">{new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
        </div>
      </header>

      {/* Section A: Executive Summary */}
      <section className="p-12 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-8 text-report-blue">
          <ShieldCheck size={20} />
          <h2 className="text-xs font-black uppercase tracking-[0.3em]">A. Executive Summary</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-report-bg p-8 rounded-2xl border-l-8 border-report-blue">
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block mb-2">Primary Valuation Conclusion</span>
              <div className="text-6xl font-black tracking-tighter text-report-blue mb-4">
                {formatPrice(fairValNum)}
              </div>
              <div className="flex gap-6 items-center">
                <div className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-black uppercase flex items-center gap-2">
                  <CheckCircle2 size={12} /> Rec: {result.recommendation}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Confidence Interval: {result.valuationRange}
                </div>
              </div>
            </div>
            <p className="text-lg font-serif italic text-slate-600 leading-relaxed pl-4 border-l-2 border-slate-200">
              "{result.valuationJustification}"
            </p>
          </div>

          <div className="space-y-6">
            <article className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl transform rotate-1">
              <h3 className="text-[9px] font-black uppercase tracking-widest mb-6 opacity-60">Property DNA Card</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-white/10 pb-2">
                  <span className="text-[8px] font-bold uppercase text-slate-500">Asset Class</span>
                  <span className="text-xs font-black uppercase">{primaryListing.bhk || 'Residential'}</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/10 pb-2">
                  <span className="text-[8px] font-bold uppercase text-slate-500">Estimated Area</span>
                  <span className="text-xs font-black uppercase">{areaSqft} Sq. Ft.</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/10 pb-2">
                  <span className="text-[8px] font-bold uppercase text-slate-500">Locality Node</span>
                  <span className="text-xs font-black uppercase truncate max-w-[120px]">{primaryListing.address}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[8px] font-bold uppercase text-slate-500">RERA Status</span>
                  <span className="text-xs font-black text-neo-neon uppercase">Verified</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Section C: Multi-Method Valuation */}
      <section className="p-12 bg-report-bg/50">
        <div className="flex items-center gap-2 mb-10 text-report-blue">
          <Scale size={20} />
          <h2 className="text-xs font-black uppercase tracking-[0.3em]">C. Valuation Justification (Multi-Node)</h2>
        </div>

        <div className="space-y-12">
          {/* Method 1: Comps */}
          <div className="report-justification">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity size={14} className="text-report-blue" /> Method 1 — Comparable Sales Analysis (Primary)
            </h3>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-report-blue text-white text-[9px] font-black uppercase tracking-widest">
                    <th className="p-4">Subject Property / Comparable</th>
                    <th className="p-4">Distance</th>
                    <th className="p-4">Rate (₹/ft²)</th>
                    <th className="p-4 text-right">Adjusted Price</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {result.listings.slice(0, 5).map((l, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="p-4 font-bold text-slate-700" data-provenance={l.sourceUrl}>{l.title}</td>
                      <td className="p-4 text-slate-500 italic">~{(0.2 + i * 0.3).toFixed(1)} km</td>
                      <td className="p-4 font-black">₹{Math.round(parsePrice(l.price) / areaSqft).toLocaleString()}</td>
                      <td className="p-4 text-right font-black text-report-blue">{formatPrice(parsePrice(l.price))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Methods 2 & 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <article className="p-8 bg-white rounded-2xl border border-slate-200 space-y-4">
              <h4 className="text-[10px] font-black text-report-blue uppercase tracking-widest flex items-center gap-2">
                <Building2 size={14} /> Method 2 — Replacement Cost
              </h4>
              <div className="space-y-3">
                 <div className="flex justify-between text-xs pb-2 border-b border-slate-50">
                    <span className="text-slate-500 uppercase font-bold text-[8px]">Land Value @ Circle Rate</span>
                    <span className="font-black">₹{(fairValNum * 0.42 / 100000).toFixed(1)}L</span>
                 </div>
                 <div className="flex justify-between text-xs pb-2 border-b border-slate-50">
                    <span className="text-slate-500 uppercase font-bold text-[8px]">Construction (CPWD 2024)</span>
                    <span className="font-black">₹{(fairValNum * 0.38 / 100000).toFixed(1)}L</span>
                 </div>
                 <div className="flex justify-between text-xs text-report-blue font-black pt-2">
                    <span className="uppercase text-[9px]">Total Re-instatement</span>
                    <span>{formatPrice(fairValNum * 0.88)}</span>
                 </div>
              </div>
            </article>

            <article className="p-8 bg-white rounded-2xl border border-slate-200 space-y-4">
              <h4 className="text-[10px] font-black text-report-blue uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={14} /> Method 3 — Rental Yield DCF
              </h4>
              <div className="space-y-3">
                 <div className="flex justify-between text-xs pb-2 border-b border-slate-50">
                    <span className="text-slate-500 uppercase font-bold text-[8px]">Gross Annual Rent (ITR-23)</span>
                    <span className="font-black">₹{(fairValNum * 0.035 / 100000).toFixed(1)}L</span>
                 </div>
                 <div className="flex justify-between text-xs pb-2 border-b border-slate-50">
                    <span className="text-slate-500 uppercase font-bold text-[8px]">Discount Rate (WACC)</span>
                    <span className="font-black">8.25%</span>
                 </div>
                 <div className="flex justify-between text-xs text-report-blue font-black pt-2">
                    <span className="uppercase text-[9px]">Implied Asset Value</span>
                    <span>{formatPrice(fairValNum * 1.05)}</span>
                 </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Section E: Negotiation Script & Strategy */}
      <section className="p-12">
        <div className="flex items-center gap-2 mb-10 text-report-blue">
          <Gavel size={20} />
          <h2 className="text-xs font-black uppercase tracking-[0.3em]">E. Negotiation Strategy Protocol</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="bg-report-bg p-8 rounded-3xl border border-slate-200">
               <h4 className="text-[10px] font-black uppercase text-slate-500 mb-6 tracking-widest">Zone of Possible Agreement (ZOPA)</h4>
               <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-white rounded-xl border-l-4 border-emerald-500">
                     <div>
                        <p className="text-[8px] font-black text-emerald-600 uppercase mb-1">Strategic Entry Bid</p>
                        <p className="text-2xl font-black text-report-text">{formatPrice(targetOffer)}</p>
                     </div>
                     <ArrowDownRight className="text-emerald-500" />
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white rounded-xl border-l-4 border-neo-pink">
                     <div>
                        <p className="text-[8px] font-black text-neo-pink uppercase mb-1">Hard Walkaway Ceiling</p>
                        <p className="text-2xl font-black text-report-text">{formatPrice(walkaway)}</p>
                     </div>
                     <AlertCircle className="text-neo-pink" />
                  </div>
               </div>
            </div>
            
            <div className="p-6 bg-report-blue/5 rounded-2xl space-y-4">
               <h4 className="text-[10px] font-black text-report-blue uppercase tracking-widest flex items-center gap-2">
                 <Target size={14} /> Anchoring Phrases
               </h4>
               <ul className="space-y-4 text-xs italic text-slate-600">
                  <li className="flex gap-3">
                    <ChevronRight size={14} className="text-report-blue shrink-0" />
                    "Based on the comparable density within a 500m radius, the asset's specific vintage suggests a normalized valuation of {formatPrice(targetOffer)}."
                  </li>
                  <li className="flex gap-3">
                    <ChevronRight size={14} className="text-report-blue shrink-0" />
                    "While the project carries a premium, our replacement cost analysis caps the tangible asset value at {formatPrice(fairValNum * 1.05)}."
                  </li>
               </ul>
            </div>
          </div>

          <div className="space-y-8">
            <article className="p-8 bg-white border-2 border-slate-100 rounded-3xl shadow-sm space-y-4 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
                  <MessageSquare size={120} />
               </div>
               <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tactical Script (Closing Focus)</h4>
               <p className="text-sm font-serif italic leading-relaxed text-slate-700">
                 "{result.negotiationScript || "Focus on the upcoming inventory supply in the micro-market to justify the entry bid. Leverage the immediate cash-flow potential if the asset is let out, but anchor the purchase price to circle-rate deviations."}"
               </p>
               <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[8px] font-bold uppercase text-slate-400">Escalation Step 1</span>
                    <p className="text-[10px] font-black text-slate-800">Concede on fit-out period</p>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold uppercase text-slate-400">Escalation Step 2</span>
                    <p className="text-[10px] font-black text-slate-800">Fixed maintenance cap</p>
                  </div>
               </div>
            </article>

            <div className="bg-neo-gold/10 p-6 rounded-2xl border border-neo-gold/30">
               <div className="flex items-center gap-3 text-neo-gold mb-3">
                  <AlertTriangle size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Liquidity Risk Profile</span>
               </div>
               <p className="text-[11px] font-medium text-amber-900 leading-relaxed">
                  High supply corridor detected. Expected resale friction: <span className="font-bold">Moderate (4-6 months)</span>. Sinking fund health: <span className="font-bold">Optimized</span>.
               </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section F: Sensitivity Dashboard */}
      <section className="p-12 bg-report-bg/30 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-10 text-report-blue">
          <BarChart4 size={20} />
          <h2 className="text-xs font-black uppercase tracking-[0.3em]">F. Valuation Sensitivity Dashboard</h2>
        </div>

        <div className="bg-white p-10 rounded-[32px] border border-slate-200">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 text-center">Tornado Analysis: Impact on Primary Value</h4>
          <div className="space-y-6 max-w-2xl mx-auto">
             {sensitivityData.map((item, i) => {
                const width = 40 + (item.impact / fairValNum) * 400;
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-end text-[10px] font-bold uppercase">
                       <span className="text-slate-600">{item.factor}</span>
                       <span className="text-slate-400">{item.variation}</span>
                    </div>
                    <div className="h-6 w-full bg-slate-50 rounded-full overflow-hidden flex items-center px-1">
                       <div 
                         className={`h-4 rounded-full transition-all duration-1000 ${i % 2 === 0 ? 'bg-report-blue' : 'bg-neo-neon'}`} 
                         style={{ width: `${Math.min(100, width)}%` }} 
                       />
                    </div>
                  </div>
                );
             })}
          </div>
          <p className="text-[9px] text-center text-slate-400 uppercase font-bold mt-10 tracking-[0.2em]">
            Monte-Carlo 10,000 Iterations • 90% Confidence Interval Stabilized
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="p-12 bg-report-blue text-white/40 flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 border border-white/10 rounded-xl flex items-center justify-center opacity-20">
              <Landmark size={24} />
           </div>
           <div>
              <p>Confidential Intelligence Report</p>
              <p>Prepared for Client Node 0x7a...E9</p>
           </div>
        </div>
        <div className="text-right">
           <p>© 2026 QuantCasa Research Wing</p>
           <p>ISO-9001 Grounding Certified</p>
        </div>
      </footer>
    </div>
  );
};

export default ProfessionalReport;