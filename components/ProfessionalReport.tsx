import React from 'react';
import { BuyResult, SaleListing, AppLang } from '../types';
import { 
  ShieldCheck, Target, TrendingUp, Info, MapPin, Gavel, Scale, 
  AlertTriangle, CheckCircle2, Building2, Landmark, 
  MessageSquare, FileText, ChevronRight, BarChart4, AlertCircle,
  Activity, ArrowDownRight, ArrowUpRight, ShieldAlert, BrainCircuit,
  Wallet, Sparkles
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

  return (
    <div className="bg-white text-report-text font-sans leading-[1.2] selection:bg-report-blue/10 animate-in fade-in zoom-in duration-500 max-w-5xl mx-auto shadow-2xl border border-slate-200 report-container">
      
      {/* Header - Executive Summary */}
      <header className={`p-12 text-white border-b-8 ${result.isBudgetAlignmentFailure ? 'bg-slate-800 border-neo-pink' : 'bg-report-blue border-neo-neon'}`}>
        <div className="flex justify-between items-start mb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <Landmark size={24} />
               </div>
               <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80">QuantCasa Analytics</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">Valuation Analysis</h1>
            <p className="text-sm font-bold text-slate-300 mt-2 tracking-widest uppercase">Grounded Market Intelligence • v5.3</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Generated On</p>
            <p className="text-lg font-black">{new Date().toISOString().split('T')[0]}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
          <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
            <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest block mb-2">Conclusion</span>
            <div className="text-6xl font-black tracking-tighter text-white mb-4">
              {result.isBudgetAlignmentFailure ? formatPrice(result.suggestedMinimum || 0) : result.fairValue}
            </div>
            <div className="flex gap-4">
              <div className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 ${result.isBudgetAlignmentFailure ? 'bg-neo-pink' : 'bg-emerald-500'}`}>
                {result.isBudgetAlignmentFailure ? <ShieldAlert size={12}/> : <CheckCircle2 size={12} />}
                {result.isBudgetAlignmentFailure ? 'Recalibration Required' : result.recommendation}
              </div>
              <div className="px-4 py-2 bg-neo-neon text-white rounded-lg text-[10px] font-black uppercase">
                Confidence: {result.confidenceScore}%
              </div>
            </div>
          </div>
          <div className="text-right">
             <p className="text-sm font-serif italic text-slate-200 leading-relaxed mb-4">
              "{result.valuationJustification}"
             </p>
             <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase">
               <BrainCircuit size={12} /> Neural Grounding Layer Active
             </div>
          </div>
        </div>
      </header>

      {/* Primary Metrics Grid */}
      <section className="p-12 border-b border-slate-100 bg-report-bg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 text-report-blue mb-3">
                 <Wallet size={16} />
                 <span className="text-[9px] font-black uppercase tracking-widest">Registration Est.</span>
              </div>
              <p className="text-xl font-black">{result.registrationEstimate || 'N/A'}</p>
              <p className="text-[8px] text-slate-500 uppercase mt-1">Stamp Duty + Legal Fees</p>
           </div>
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 text-neo-pink mb-3">
                 <Sparkles size={16} />
                 <span className="text-[9px] font-black uppercase tracking-widest">Appreciation Potential</span>
              </div>
              <p className="text-xl font-black">{result.appreciationPotential || 'Stable'}</p>
              <p className="text-[8px] text-slate-500 uppercase mt-1">3-Year Forecast Signal</p>
           </div>
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 text-neo-gold mb-3">
                 <Activity size={16} />
                 <span className="text-[9px] font-black uppercase tracking-widest">Sentiment Score</span>
              </div>
              <p className="text-xl font-black">{result.sentimentScore}/100</p>
              <p className="text-[8px] text-slate-500 uppercase mt-1">{result.marketSentiment}</p>
           </div>
        </div>
      </section>

      {/* Comparative Matrix */}
      <section className="p-12">
        <div className="flex items-center gap-2 mb-6 text-report-blue">
          <Scale size={20} />
          <h2 className="text-xs font-black uppercase tracking-[0.3em]">Market Grounding Comps</h2>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-report-blue text-white">
              <tr className="text-[9px] font-black uppercase tracking-widest">
                <th className="p-4">Listing Node</th>
                <th className="p-4">Address</th>
                <th className="p-4 text-right">Price Signal</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {result.listings.slice(0, 5).map((l, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-700">{l.title}</td>
                  <td className="p-4 text-slate-500 truncate max-w-[200px]">{l.address}</td>
                  <td className="p-4 text-right font-black text-report-blue">{l.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Strategic Analysis */}
      <section className="p-12 bg-slate-900 text-white">
        <div className="flex items-center gap-2 mb-10">
          <Gavel size={20} className="text-neo-gold" />
          <h2 className="text-xs font-black uppercase tracking-[0.3em]">Tactical Acquisition Strategy</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
           <div className="p-8 bg-white/5 border border-white/10 rounded-3xl">
              <h4 className="text-[10px] font-black uppercase text-neo-gold tracking-widest mb-4">Negotiation Anchor</h4>
              <p className="text-sm font-serif italic leading-relaxed text-slate-300">
                "{result.negotiationScript}"
              </p>
           </div>
           <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center p-6 bg-emerald-500/10 rounded-2xl border-l-4 border-emerald-500">
                 <div>
                    <p className="text-[8px] font-black text-emerald-400 uppercase mb-1">Target Offer Range</p>
                    <p className="text-2xl font-black text-white">{formatPrice(targetOffer)} - {formatPrice(fairValNum)}</p>
                 </div>
              </div>
              <div className="flex justify-between items-center p-6 bg-neo-pink/10 rounded-2xl border-l-4 border-neo-pink">
                 <div>
                    <p className="text-[8px] font-black text-neo-pink uppercase mb-1">Walk-Away Threshold</p>
                    <p className="text-2xl font-black text-white">{formatPrice(walkaway)}</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      <footer className="p-8 bg-report-bg border-t border-slate-100 text-[8px] font-black uppercase tracking-widest text-slate-400 text-center">
        Confidential Asset Intelligence Node • QuantCasa Labs • All Signals Grounded
      </footer>
    </div>
  );
};

export default ProfessionalReport;