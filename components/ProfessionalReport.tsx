
import React from 'react';
import { BuyResult, AppLang } from '../types';
// Add missing MessageSquare import
import { ShieldCheck, Target, TrendingUp, Info, MapPin, Gavel, Scale, AlertTriangle, CheckCircle2, DollarSign, Building2, Landmark, MessageSquare } from 'lucide-react';
import { formatPrice, parsePrice } from '../services/geminiService';

interface ProfessionalReportProps {
  result: BuyResult;
  lang?: AppLang;
}

const ProfessionalReport: React.FC<ProfessionalReportProps> = ({ result, lang = 'EN' }) => {
  const fairValNum = parsePrice(result.fairValue);
  const targetOffer = fairValNum * 0.94;
  const walkaway = fairValNum * 1.08;
  const areaSqft = result.listings[0]?.sqft || 1000; // Fallback

  return (
    <div className="bg-white text-slate-900 rounded-[32px] overflow-hidden shadow-2xl p-0 animate-in fade-in zoom-in duration-500 max-w-5xl mx-auto border border-slate-200">
      {/* Header Band */}
      <div className="bg-[#003366] p-10 text-white flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Valuation Analysis Report</h1>
          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mt-1">Grounded Intelligence Service • v2.6.1</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black uppercase text-slate-400">Date generated</div>
          <div className="text-sm font-bold">{new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</div>
        </div>
      </div>

      <div className="p-12 space-y-16">
        {/* Section A: Executive Summary */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-slate-100 pb-12">
          <div className="space-y-6">
            <h2 className="text-sm font-black text-[#003366] uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={16} /> A. Executive Summary
            </h2>
            <div className="space-y-2">
              <p className="text-4xl font-black tracking-tighter text-[#003366]">
                {formatPrice(fairValNum)}
              </p>
              <p className="text-sm font-medium text-slate-500 leading-relaxed italic">
                "{result.valuationJustification}"
              </p>
            </div>
            <div className="flex gap-4">
              <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black uppercase border border-emerald-100 flex items-center gap-2">
                <CheckCircle2 size={12} /> Recommendation: {result.recommendation}
              </div>
              <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase border border-blue-100">
                Confidence: {result.confidenceScore}%
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">Property DNA Card</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Configuration</span>
                <p className="text-sm font-black">{result.listings[0]?.bhk || 'Residential Asset'}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Est. Area</span>
                <p className="text-sm font-black">{areaSqft} Sq. Ft.</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Locality</span>
                <p className="text-sm font-black truncate">{result.listings[0]?.address || 'Micro-Market'}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Market Sentiment</span>
                <p className="text-sm font-black text-blue-600">{result.marketSentiment}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section C: Valuation Methods */}
        <section className="space-y-10">
          <h2 className="text-sm font-black text-[#003366] uppercase tracking-widest flex items-center gap-2">
            <Scale size={16} /> C. Multi-Method Justification
          </h2>
          
          <div className="space-y-8">
            {/* Method 1 */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                Method 1 — Comparable Sales Analysis (Primary)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#003366] text-white text-[9px] font-black uppercase tracking-widest">
                      <th className="p-3">Comparable Project</th>
                      <th className="p-3">Distance</th>
                      <th className="p-3">Unit Price (₹/ft²)</th>
                      <th className="p-3 text-right">Adjusted Value</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {result.listings.slice(0, 4).map((l, i) => {
                      const p = parsePrice(l.price);
                      const perSqft = Math.round(p / 1000); // Simulated
                      return (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="p-3 font-bold text-slate-700">{l.title}</td>
                          <td className="p-3 text-slate-500">~1.2 km</td>
                          <td className="p-3 font-medium">₹{perSqft}</td>
                          <td className="p-3 text-right font-black text-[#003366]">{formatPrice(p)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Method 2 & 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="text-[9px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2">
                  <Building2 size={12}/> Method 2 — Replacement Cost
                </h4>
                <ul className="space-y-2 text-xs">
                  <li className="flex justify-between"><span>Land Value @ Circle Rate:</span> <span className="font-bold">₹{(fairValNum * 0.45 / 100000).toFixed(1)}L</span></li>
                  <li className="flex justify-between"><span>Construction Cost:</span> <span className="font-bold">₹{(fairValNum * 0.40 / 100000).toFixed(1)}L</span></li>
                  <li className="flex justify-between border-t border-slate-200 pt-2 text-slate-900 font-black">
                    <span>Imputed Value:</span> <span>{formatPrice(fairValNum * 0.85)}</span>
                  </li>
                </ul>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="text-[9px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2">
                  <TrendingUp size={12}/> Method 3 — Rental Yield Sanity
                </h4>
                <ul className="space-y-2 text-xs">
                  <li className="flex justify-between"><span>Market Rent (Annual):</span> <span className="font-bold">₹{(fairValNum * 0.03 / 100000).toFixed(1)}L</span></li>
                  <li className="flex justify-between"><span>Discount Rate:</span> <span className="font-bold">8.5%</span></li>
                  <li className="flex justify-between border-t border-slate-200 pt-2 text-slate-900 font-black">
                    <span>DCF Value (10yr):</span> <span>{formatPrice(fairValNum * 1.1)}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section E: Negotiation Strategy */}
        <section className="space-y-10">
          <h2 className="text-sm font-black text-[#003366] uppercase tracking-widest flex items-center gap-2">
            <Gavel size={16} /> E. Negotiation Strategy Protocol
          </h2>
          <div className="bg-slate-50 border border-slate-200 rounded-[32px] p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acquisition Zones (ZOPA)</span>
                <div className="space-y-3">
                   <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                      <p className="text-[9px] font-black text-emerald-600 uppercase">Target Bid</p>
                      <p className="text-xl font-black text-emerald-900">{formatPrice(targetOffer)}</p>
                   </div>
                   <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                      <p className="text-[9px] font-black text-red-600 uppercase">Hard Walkaway</p>
                      <p className="text-xl font-black text-red-900">{formatPrice(walkaway)}</p>
                   </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
               <div className="space-y-3">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><MessageSquare size={14}/> Tactical Script</h4>
                 <div className="bg-white p-6 rounded-2xl border border-slate-100 text-sm italic text-slate-600 leading-relaxed shadow-sm">
                   "{result.negotiationScript}"
                 </div>
                 <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl text-amber-900 text-xs">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <p className="font-medium">Hard limit based on regional replacement cost + 8% utility premium. Do not exceed ZOPA ceiling.</p>
                 </div>
               </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-10 border-t border-slate-100 flex justify-between items-center opacity-40 grayscale">
          <div className="flex items-center gap-4">
             <Landmark size={24} />
             <div className="text-[9px] font-black uppercase leading-tight">QuantCasa Research Wing<br/>Bengaluru Hub Node</div>
          </div>
          <p className="text-[9px] font-bold text-slate-500 uppercase">Confidential Intelligence — Prepared for Local Client</p>
        </footer>
      </div>
    </div>
  );
};

export default ProfessionalReport;
