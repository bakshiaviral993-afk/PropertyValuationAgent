import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { ShieldCheck, Info, TrendingUp, AlertTriangle, CheckCircle2, Building2, Wallet, Coins, RefreshCw, Sparkles, ArrowRight, Zap } from "lucide-react";
import { calculateLoanApproval, LoanApprovalResult } from "../services/loanService";
import CibilCoach from "./CibilCoach";

interface Props {
  fairValuePrice: number;
  lang?: 'EN' | 'HI';
}

export default function LoanApprovalAIScreen({ fairValuePrice, lang = 'EN' }: Props) {
  const [form, setForm] = useState({
    income: "",
    existingEmi: "",
    credit: "750",
    requested: "",
    propertyValue: fairValuePrice?.toString() || "",
    employmentType: "salaried"
  });

  const [result, setResult] = useState<LoanApprovalResult | null>(null);
  const [emiGraph, setEmiGraph] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCibilCoach, setShowCibilCoach] = useState(false);

  useEffect(() => {
    if (fairValuePrice) {
      setForm(f => ({ 
        ...f, 
        propertyValue: fairValuePrice.toString(), 
        requested: Math.round(fairValuePrice * 0.8).toString() 
      }));
    }
  }, [fairValuePrice]);

  function update(name: string, value: string) {
    setForm(f => ({ ...f, [name]: value }));
  }

  function generateEmiCurve(principal: number) {
    const rates = [8, 8.5, 9, 9.5, 10, 11, 12];
    const data = rates.map(r => ({
      rate: r + "%",
      emi: Math.round((principal * (r / 1200)) / (1 - Math.pow(1 + r / 1200, -240)))
    }));
    setEmiGraph(data);
  }

  async function submit() {
    setLoading(true);
    try {
        const res = await calculateLoanApproval({
          incomeMonthly: +form.income,
          existingEMI: +form.existingEmi || 0,
          creditScore: +form.credit,
          propertyValue: +form.propertyValue,
          requestedAmount: +form.requested,
          employmentType: form.employmentType
        });
        setResult(res);
        generateEmiCurve(+form.requested);
    } catch (e) {
        console.error("Simulation failed:", e);
    } finally {
        setLoading(false);
    }
  }

  if (showCibilCoach) {
    return (
      <div className="h-[600px] w-full">
        <CibilCoach 
          currentScore={+form.credit} 
          lang={lang === 'HI' ? 'HI' : 'EN'} 
          onClose={() => setShowCibilCoach(false)} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white/5 rounded-[40px] p-8 md:p-10 border border-white/10 shadow-glass-3d space-y-8">
           <div className="flex items-center gap-3">
             <ShieldCheck size={20} className="text-neo-neon"/>
             <h3 className="text-xs font-black text-white uppercase tracking-[0.4em]">Financial Profiling</h3>
           </div>

           <div className="grid grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Monthly Net Income</label>
               <input 
                 className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-neo-neon outline-none" 
                 placeholder="e.g. 150000"
                 value={form.income} onChange={e=>update("income",e.target.value)} 
               />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Existing Monthly EMIs</label>
               <input 
                 className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-neo-neon outline-none" 
                 placeholder="e.g. 20000"
                 value={form.existingEmi} onChange={e=>update("existingEmi",e.target.value)} 
               />
             </div>
           </div>

           <div className="grid grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">CIBIL / Credit Score</label>
               <input 
                 className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-neo-neon outline-none" 
                 placeholder="300-900"
                 value={form.credit} onChange={e=>update("credit",e.target.value)} 
               />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Employment Type</label>
               <select 
                 className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-neo-neon outline-none"
                 value={form.employmentType} onChange={e=>update("employmentType",e.target.value)}
               >
                 <option value="salaried" className="bg-neo-bg">Salaried</option>
                 <option value="self-employed" className="bg-neo-bg">Self-Employed</option>
               </select>
             </div>
           </div>

           <div className="space-y-2">
             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Requested Loan Amount</label>
             <input 
               className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-neo-neon outline-none" 
               placeholder="e.g. 6500000"
               value={form.requested} onChange={e=>update("requested",e.target.value)} 
             />
           </div>

           <button 
             onClick={submit}
             disabled={loading || !form.income}
             className="w-full py-6 bg-neo-neon text-white rounded-[24px] text-sm font-black uppercase tracking-widest shadow-neo-glow hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 border-t border-white/20 disabled:opacity-30"
           >
             {loading ? "Processing Algorithm..." : "Run Approval Node"}
           </button>
        </div>

        <div className="space-y-6">
          {result ? (
            <div className="bg-white/5 rounded-[40px] p-8 border border-white/10 shadow-glass-3d space-y-6 animate-in zoom-in duration-300">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-white tracking-tighter uppercase">Lending Decision</h3>
                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-neo-glow border ${
                  result.decision === "Approved" ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" :
                  result.decision === "Conditional" ? "bg-neo-gold/10 border-neo-gold text-neo-gold" : "bg-neo-pink/10 border-neo-pink text-neo-pink"
                }`}>
                  {result.decision === "Approved" ? "🟢 Approved" : result.decision === "Conditional" ? "🟡 Conditional" : "🔴 Rejected"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Max Eligible</span>
                    <div className="text-lg font-black text-white">₹{result.maxLoanAmount.toLocaleString()}</div>
                 </div>
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Approval Probability</span>
                    <div className="text-lg font-black text-neo-neon">{(result.approvalProbability*100).toFixed(0)}%</div>
                 </div>
              </div>

              {/* Only show Credit Repair AI if the score is actually problematic (< 750) */}
              {+form.credit < 750 && (
                <div className="bg-neo-pink/5 border border-neo-pink/20 rounded-3xl p-6 flex flex-col gap-4">
                   <div className="flex items-center gap-3 text-neo-pink">
                      <Zap size={20} className="animate-pulse shadow-pink-glow" />
                      <h4 className="text-xs font-black uppercase tracking-widest">Credit Enhancement Node</h4>
                   </div>
                   <p className="text-xs text-gray-400 leading-relaxed font-medium">
                     Your CIBIL score of <strong>{form.credit}</strong> can be improved for better interest rates. Launch our AI to build a personalized 90-day recovery roadmap.
                   </p>
                   <button 
                    onClick={() => setShowCibilCoach(true)}
                    className="w-full py-4 bg-neo-pink text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-pink-glow hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                   >
                     Launch Credit Repair AI <ArrowRight size={14} />
                   </button>
                </div>
              )}

              {+form.credit >= 750 && result.decision !== "Approved" && (
                <div className="bg-neo-gold/5 border border-neo-gold/20 rounded-3xl p-6 flex flex-col gap-4">
                   <div className="flex items-center gap-3 text-neo-gold">
                      <TrendingUp size={20} />
                      <h4 className="text-xs font-black uppercase tracking-widest">Capacity Bottleneck</h4>
                   </div>
                   <p className="text-xs text-gray-400 leading-relaxed font-medium">
                     Your credit score is excellent, but your current income-to-EMI ratio is high. Consider increasing tenure or including a co-applicant.
                   </p>
                </div>
              )}

              <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-3">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-neo-gold"/>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Decision Justification</span>
                </div>
                <ul className="space-y-2">
                    {result.reasons.length > 0 ? result.reasons.map((r:string,i:number)=>(
                        <li key={i} className="text-xs text-gray-400 flex gap-3 leading-relaxed">
                            <div className="w-1.5 h-1.5 rounded-full bg-neo-pink mt-1.5 shrink-0" />
                            {r}
                        </li>
                    )) : (
                        <li className="text-xs text-emerald-500 font-bold flex gap-3 leading-relaxed">
                             <CheckCircle2 size={14} className="shrink-0" />
                             Financial profile matches all primary risk appetite markers.
                        </li>
                    )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="h-full bg-white/5 rounded-[40px] border border-white/5 border-dashed flex flex-col items-center justify-center p-12 text-center opacity-30">
               <Wallet size={64} className="mb-6" />
               <p className="text-sm font-black uppercase tracking-widest text-gray-500">Run Node to view decision metrics</p>
            </div>
          )}

          {emiGraph.length > 0 && (
            <div className="bg-white/5 rounded-[40px] p-8 border border-white/10 shadow-glass-3d h-[300px]">
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">EMI Sensitivity by Rate (20Y)</h4>
              <div className="w-full h-full">
                <ResponsiveContainer width="100%" height="80%">
                    <LineChart data={emiGraph}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis 
                            dataKey="rate" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} 
                        />
                        <YAxis hide />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="emi" stroke="#585FD8" strokeWidth={3} dot={{ r: 4, fill: '#585FD8' }} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      <MultiBankSimulator 
        propertyValue={+form.propertyValue} 
        requested={+form.requested} 
        credit={+form.credit} 
      />
    </div>
  );
}

function MultiBankSimulator({ propertyValue, requested, credit }: { propertyValue: number, requested: number, credit: number }) {
  const banks = [
    { name: "HDFC Bank", ltv: 0.80, minScore: 720, rate: "8.55%" },
    { name: "ICICI Bank", ltv: 0.75, minScore: 700, rate: "8.70%" },
    { name: "SBI Home", ltv: 0.83, minScore: 680, rate: "8.45%" },
    { name: "Axis Bank", ltv: 0.78, minScore: 710, rate: "8.75%" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 size={20} className="text-neo-gold"/>
        <h3 className="text-xs font-black text-white uppercase tracking-[0.4em]">Multi-Bank Signal Check</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {banks.map(b => {
          const maxAllowed = propertyValue * b.ltv;
          const status =
            credit < b.minScore ? "Rejected" :
            requested > maxAllowed ? "Conditional" : "Approved";

          return (
            <div key={b.name} className="bg-white/5 rounded-[32px] p-6 border border-white/10 hover:border-neo-neon/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-black text-white">{b.name}</h4>
                <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${
                  status === "Approved" ? "bg-emerald-500/10 text-emerald-500" :
                  status === "Conditional" ? "bg-neo-gold/10 text-neo-gold" : "bg-neo-pink/10 text-neo-pink"
                }`}>
                  {status}
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Max Funding</span>
                  <div className="text-sm font-black text-white">₹{Math.round(maxAllowed/100000).toLocaleString()}L</div>
                </div>
                <div className="flex justify-between items-center border-t border-white/5 pt-3">
                  <div>
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Min CIBIL</span>
                    <div className="text-xs font-black text-white">{b.minScore}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">ROI Starts</span>
                    <div className="text-xs font-black text-neo-neon">{b.rate}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}