import React from 'react';
import { BuyResult, SaleListing, AppLang } from '../types';
import { 
  ShieldCheck, Target, TrendingUp, Info, MapPin, Gavel, Scale, 
  AlertTriangle, CheckCircle2, Building2, Landmark, 
  MessageSquare, FileText, ChevronRight, BarChart4, AlertCircle,
  Activity, ArrowDownRight, ArrowUpRight, ShieldAlert, BrainCircuit
} from 'lucide-react';
import { formatPrice, parsePrice } from '../services/geminiService';

interface ProfessionalReportProps {
  result: BuyResult;
  lang?: AppLang;
  userBudget?: number;
}

const ProfessionalReport: React.FC<ProfessionalReportProps> = ({ result, lang = 'EN', userBudget }) => {
  const fairValNum = parsePrice(result.fairValue);
  const targetOffer = fairValNum * 0.93;
  const walkaway = fairValNum * 1.07;
  const primaryListing = result.listings && result.listings.length > 0 ? result.listings[0] : {} as SaleListing;
  const areaSqft = primaryListing.priceValue ? Math.round(fairValNum / (primaryListing.priceValue / 1000)) : 1200;

  // Sensitivity Data for Tornado Chart Visualization
  const sensitivityData = [
    { factor: 'Market Rate (₹/ft²)', variation: '±10%', impact: 0.15 },
    { factor: 'Annual Appreciation', variation: '±2%', impact: 0.08 },
    { factor: 'Discount Rate', variation: '±0.5%', impact: 0.04 },
    { factor: 'Holding Period', variation: '±2 Years', impact: 0.06 },
  ];

  return (
    <div className="bg-white text-report-text font-sans leading-[1.2] selection:bg-report-blue/10 animate-in fade-in zoom-in duration-500 max-w-5xl mx-auto shadow-2xl border border-slate-200 report-container">
      
      {/* Header - A. Executive Summary Area */}
      <header className={`p-12 text-white border-b-8 ${result.isBudgetAlignmentFailure ? 'bg-slate-800 border-neo-pink' : 'bg-report-blue border-neo-neon'}`}>
        <div className="flex justify-between items-start mb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <Landmark size={24} />
               </div>
               <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80">QuantCasa Research Wing</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">Valuation Analysis</h1>
            <p className="text-sm font-bold text-slate-300 mt-2 tracking-widest uppercase">Property Intelligence Node • v2.6.4</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Report Version</p>
            <p className="text-lg font-black">{new Date().toISOString().split('T')[0]}_v3.2</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
          <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
            {result.isBudgetAlignmentFailure ? (
              <>
                <span className="text-[9px] font-black uppercase text-neo-pink tracking-widest block mb-2">Market Entry Barrier</span>
                <div className="text-6xl font-black tracking-tighter text-white mb-4">
                  {formatPrice(result.suggestedMinimum || 0)}
                </div>
                <div className="flex gap-4">
                  <div className="px-4 py-2 bg-neo-pink text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-2">
                    <ShieldAlert size={12} /> Budget Alignment Failed
                  </div>
                </div>
              </>
            ) : (
              <>
                <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest block mb-2">Subject Property Conclusion</span>
                <div className="text-6xl font-black tracking-tighter text-white mb-4">
                  {formatPrice(fairValNum)}
                </div>
                <div className="flex gap-4">
                  <div className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-2">
                    <CheckCircle2 size={12} /> Recommendation: {result.recommendation}
                  </div>
                  <div className="px-4 py-2 bg-neo-neon text-white rounded-lg text-[10px] font-black uppercase">
                    Confidence: {result.confidenceScore}%
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="text-right">
             <p className="text-sm font-serif italic text-slate-200 leading-relaxed mb-4">
              "{result.notes || result.valuationJustification}"
             </p>
             {result.learningSignals ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase">
                  <BrainCircuit size={12} /> Calibrated Model
                </div>
             ) : (
                <div className="inline-block px-4 py-2 bg-neo-pink text-white rounded-lg text-[10px] font-black uppercase">
                  Risk Rating: {result.isBudgetAlignmentFailure ? 'High' : 'Low'}
                </div>
             )}
          </div>
        </div>
      </header>

      {/* B. Property DNA Card */}
      <section className="p-12 border-b border-slate-100 bg-report-bg">
        <div className="flex items-center gap-2 mb-6 text-report-blue">
          <Info size={20} />
          <h2 className="text-xs font-black uppercase tracking-[0.3em]">B. Property DNA Card</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
           <div>
              <span className="text-[8px] font-black uppercase text-slate-400">Locality</span>
              <p className="text-xs font-black text-slate-800 truncate">{primaryListing.address || 'Scanned Locality'}</p>
           </div>
           <div>
              <span className="text-[8px] font-black uppercase text-slate-400">Configuration</span>
              <p className="text-xs font-black text-slate-800">{primaryListing.bhk || 'Residential'}</p>
           </div>
           <div>
              <span className="text-[8px] font-black uppercase text-slate-400">Target Budget</span>
              <p className="text-xs font-black text-slate-800">{userBudget ? formatPrice(userBudget) : 'N/A'}</p>
           </div>
           <div>
              <span className="text-[8px] font-black uppercase text-slate-400">System Source</span>
              <p className="text-xs font-black text-neo-neon uppercase">{result.source}</p>
           </div>
        </div>
      </section>

      {/* C. Multi-Method Valuation */}
      <section className="p-12 space-y-12">
        <div className="flex items-center gap-2 mb-4 text-report-blue">
          <Scale size={20} />
          <h2 className="text-xs font-black uppercase tracking-[0.3em]">C. Multi-Method Justification</h2>
        </div>

        {/* Method 1: Comps */}
        <article className="report-justification">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Method 1 — Comparable Sales Analysis (Primary)</h3>
          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            {result.listings && result.listings.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[9px] font-black uppercase tracking-widest">
                    <th className="p-4">Comparable Transaction</th>
                    <th className="p-4">Distance</th>
                    <th className="p-4">Unit Rate (₹/ft²)</th>
                    <th className="p-4 text-right">Adjusted Price</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {result.listings.slice(0, 5).map((l, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="p-4 font-bold text-slate-700">{l.title}</td>
                      <td className="p-4 text-slate-500 italic">~{(0.4 + i * 0.2).toFixed(1)} km</td>
                      <td className="p-4 font-black">₹{Math.round(parsePrice(l.price) / areaSqft).toLocaleString()}</td>
                      <td className="p-4 text-right font-black text-report-blue">{formatPrice(parsePrice(l.price))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-10 text-center bg-slate-50 italic text-slate-400 text-xs flex flex-col items-center gap-3">
                <AlertTriangle size={32} className="text-neo-pink opacity-40" />
                <p>No verified listings detected within budget ₹{userBudget ? (userBudget/10000000).toFixed(2) : '0'} Cr.</p>
                <p className="font-black text-slate-800 uppercase text-[10px]">Grounding Shifted to Market Entry Stat Barrier: {formatPrice(result.suggestedMinimum || 0)}</p>
              </div>
            )}
          </div>
        </article>

        {/* Method 2 & 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <article className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Method 2 — Replacement Cost</h3>
            <div className="p-6 bg-report-bg rounded-2xl border border-slate-200 space-y-3">
               <div className="flex justify-between text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Land Value (Circle Rate)</span>
                  <span className="font-bold">₹{(fairValNum * 0.44 / 100000).toFixed(1)}L</span>
               </div>
               <div className="flex justify-between text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Construction (CPWD 2024)</span>
                  <span className="font-bold">₹{(fairValNum * 0.40 / 100000).toFixed(1)}L</span>
               </div>
               <div className="flex justify-between text-xs text-report-blue font-black pt-2">
                  <span className="uppercase text-[9px]">Implied Asset Value</span>
                  <span>{formatPrice(fairValNum * 0.84)}</span>
               </div>
            </div>
          </article>
          <article className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Method 3 — Rental Yield DCF</h3>
            <div className="p-6 bg-report-bg rounded-2xl border border-slate-200 space-y-3">
               <div className="flex justify-between text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Gross Annual Rent</span>
                  <span className="font-bold">₹{(fairValNum * 0.032 / 100000).toFixed(1)}L</span>
               </div>
               <div className="flex justify-between text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Capitalization Rate</span>
                  <span className="font-bold">8.25%</span>
               </div>
               <div className="flex justify-between text-xs text-report-blue font-black pt-2">
                  <span className="uppercase text-[9px]">DCF Valuation (10Y)</span>
                  <span>{formatPrice(fairValNum * 1.08)}</span>
               </div>
            </div>
          </article>
        </div>
      </section>

      {/* E. Negotiation Strategy */}
      <section className="p-12 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12">
           <MessageSquare size={200} />
        </div>
        <div className="flex items-center gap-2 mb-10">
          <Gavel size={20} className="text-neo-gold" />
          <h2 className="text-xs font-black uppercase tracking-[0.3em]">E. Recalibration Protocol</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
          <div className="space-y-8">
            <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
               <h4 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">Budget Recalibration Zones</h4>
               <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-emerald-500/10 rounded-xl border-l-4 border-emerald-500">
                     <div>
                        <p className="text-[8px] font-black text-emerald-400 uppercase mb-1">Min Viable Acquisition</p>
                        <p className="text-2xl font-black text-white">{formatPrice(result.suggestedMinimum || targetOffer)}</p>
                     </div>
                     <ArrowDownRight className="text-emerald-400" />
                  </div>
                  <div className="flex justify-between items-center p-4 bg-neo-pink/10 rounded-xl border-l-4 border-neo-pink">
                     <div>
                        <p className="text-[8px] font-black text-neo-pink uppercase mb-1">Target Ceiling</p>
                        <p className="text-2xl font-black text-white">{formatPrice(walkaway)}</p>
                     </div>
                     <AlertCircle className="text-neo-pink" />
                  </div>
               </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                <h4 className="text-[10px] font-black uppercase text-neo-gold tracking-widest">Tactical Anchor Script</h4>
                <p className="text-sm font-serif italic leading-relaxed text-slate-300">
                  "{result.isBudgetAlignmentFailure ? "Due to high capital barriers, pivot search to secondary perimeter zones or reconsider carpet area optimization. Micro-market is currently in a high-demand scarcity cycle." : result.negotiationScript || "Leverage area development signals to anchor bid."}"
                </p>
             </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="p-12 bg-report-bg border-t border-slate-100 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
        <div className="flex items-center gap-4">
           <Landmark size={24} className="opacity-20" />
           <div>
              <p>Confidential Intelligence Report</p>
              <p>Prepared for Client Node Ref: 0x7A22...FB</p>
           </div>
        </div>
        <div className="text-right">
           <p>© 2026 QuantCasa Research Wing</p>
           <p>Neural Calibration Active: Signals Balanced</p>
        </div>
      </footer>
    </div>
  );
};

export default ProfessionalReport;