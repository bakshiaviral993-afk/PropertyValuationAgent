
import React, { useState, useEffect } from 'react';
import { 
  Calculator, Landmark, ShieldCheck, Zap, Info, Wallet, 
  TrendingUp, ArrowRight, Building2, MapIcon, BarChart3,
  Receipt, HardHat, FileText, Coins, ArrowRightLeft, Percent
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { AppMode } from '../types';

interface LoanCalculatorProps {
  initialValue?: number;
  mode?: AppMode;
}

const LoanCalculator: React.FC<LoanCalculatorProps> = ({ initialValue = 10000000, mode = 'buy' }) => {
  // Common states
  const [propertyValue, setPropertyValue] = useState(initialValue);
  
  // Buy mode states
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(8.7);
  const [tenureYears, setTenureYears] = useState(20);

  // Rent mode states
  const [annualRentEscalation, setAnnualRentEscalation] = useState(5);
  const [securityDepositMonths, setSecurityDepositMonths] = useState(3);
  const [brokerageMonths, setBrokerageMonths] = useState(1);
  const [analysisYears, setAnalysisYears] = useState(10);

  // Land mode states
  const [constructionRate, setConstructionRate] = useState(2800); 
  const [fsiUsed, setFsiUsed] = useState(1.5);
  const [permissionCostSqft, setPermissionCostSqft] = useState(400);

  const [simResult, setSimResult] = useState({
    primaryMetric: 0,
    secondaryMetric: 0,
    tertiaryMetric: 0,
    breakdown: [] as { name: string, value: number, fill: string }[],
    summary: ""
  });

  useEffect(() => {
    if (mode === 'buy' || mode === 'expert') {
      const loanAmount = propertyValue * (1 - downPaymentPercent / 100);
      const monthlyRate = interestRate / (12 * 100);
      const n = tenureYears * 12;
      const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
      const totalPayment = emi * n;
      const totalInterest = totalPayment - loanAmount;

      setSimResult({
        primaryMetric: Math.round(emi),
        secondaryMetric: Math.round(totalInterest),
        tertiaryMetric: Math.round(totalPayment),
        breakdown: [
          { name: 'Principal', value: Math.round(loanAmount), fill: '#585FD8' },
          { name: 'Interest', value: Math.round(totalInterest), fill: '#FF6B9D' }
        ],
        summary: "Buy Mode: Leverage mortgage to build equity. Appreciation over 10 years often offsets interest costs."
      });
    } else if (mode === 'rent') {
      let totalRent = 0;
      let currentRent = propertyValue; 
      const months = analysisYears * 12;
      for (let i = 1; i <= months; i++) {
        totalRent += currentRent;
        if (i % 12 === 0) currentRent *= (1 + annualRentEscalation / 100);
      }
      const upfront = propertyValue * (securityDepositMonths + brokerageMonths);
      
      // Comparison: What if this money was invested?
      const monthlySip = propertyValue * 0.5; // Hypothetical SIP
      const futureWealth = monthlySip * ((Math.pow(1 + 0.01, months) - 1) / 0.01);

      setSimResult({
        primaryMetric: Math.round(totalRent),
        secondaryMetric: Math.round(upfront),
        tertiaryMetric: Math.round(futureWealth),
        breakdown: [
          { name: 'Total Rent', value: Math.round(totalRent), fill: '#10b981' },
          { name: 'Upfront Cost', value: Math.round(upfront), fill: '#34d399' }
        ],
        summary: "Rent Mode: Mobility is key. This analysis shows your total wealth leakage over time vs potential savings investment."
      });
    } else if (mode === 'land') {
      // For land, initialValue is the plot cost
      // We need to estimate building area. If plot size wasn't passed, we assume 1500 sqft base.
      const estimatedPlotSize = 1500; 
      const buildableArea = estimatedPlotSize * fsiUsed;
      const constructionCost = buildableArea * constructionRate;
      const permissionCost = buildableArea * permissionCostSqft;
      const totalProjectCost = propertyValue + constructionCost + permissionCost;
      
      // Revenue estimate based on 2x cost (market avg)
      const projectedRevenue = totalProjectCost * 1.6;
      const netProfit = projectedRevenue - totalProjectCost;

      setSimResult({
        primaryMetric: Math.round(totalProjectCost),
        secondaryMetric: Math.round(netProfit),
        tertiaryMetric: Math.round((netProfit / totalProjectCost) * 100),
        breakdown: [
          { name: 'Construction', value: Math.round(constructionCost), fill: '#f97316' },
          { name: 'Land & Fees', value: Math.round(propertyValue + permissionCost), fill: '#fb923c' }
        ],
        summary: "Land Mode: Wealth is generated through conversion. Optimizing FSI and construction quality drives project yield."
      });
    }
  }, [propertyValue, downPaymentPercent, interestRate, tenureYears, annualRentEscalation, securityDepositMonths, brokerageMonths, analysisYears, constructionRate, fsiUsed, permissionCostSqft, mode, initialValue]);

  const themeColor = mode === 'rent' ? 'text-emerald-500' : mode === 'land' ? 'text-orange-500' : 'text-neo-neon';
  const accentColor = mode === 'rent' ? 'bg-emerald-500' : mode === 'land' ? 'bg-orange-500' : 'bg-neo-neon';
  const accentBorder = mode === 'rent' ? 'border-emerald-500/20' : mode === 'land' ? 'border-orange-500/20' : 'border-neo-neon/20';

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white/5 rounded-[40px] p-10 border border-white/10 shadow-glass-3d space-y-8">
           <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.4em] flex items-center gap-2">
             <Coins size={14} className={themeColor}/> Configuration Nodes
           </h3>
           
           {mode === 'rent' ? (
             <>
               <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span>Monthly Rent (Base)</span> <span className="text-emerald-500">₹{propertyValue.toLocaleString()}</span>
                  </div>
                  <input type="range" min="5000" max="500000" step="1000" value={propertyValue} onChange={(e)=>setPropertyValue(Number(e.target.value))} className="w-full accent-emerald-500"/>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <span>Annual Hike</span> <span className="text-emerald-500">{annualRentEscalation}%</span>
                    </div>
                    <input type="range" min="0" max="15" step="1" value={annualRentEscalation} onChange={(e)=>setAnnualRentEscalation(Number(e.target.value))} className="w-full accent-emerald-500"/>
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <span>Timeline</span> <span className="text-emerald-500">{analysisYears} Yr</span>
                    </div>
                    <input type="range" min="1" max="20" step="1" value={analysisYears} onChange={(e)=>setAnalysisYears(Number(e.target.value))} className="w-full accent-emerald-500"/>
                 </div>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span>Security Deposit (Months)</span> <span className="text-emerald-500">{securityDepositMonths} Mo</span>
                  </div>
                  <input type="range" min="1" max="12" step="1" value={securityDepositMonths} onChange={(e)=>setSecurityDepositMonths(Number(e.target.value))} className="w-full accent-emerald-500"/>
               </div>
             </>
           ) : mode === 'land' ? (
             <>
               <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span>Land Cost (Input)</span> <span className="text-orange-500">₹{(propertyValue/10000000).toFixed(2)} Cr</span>
                  </div>
                  <input type="range" min="1000000" max="100000000" step="500000" value={propertyValue} onChange={(e)=>setPropertyValue(Number(e.target.value))} className="w-full accent-orange-500"/>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span>Construction Rate</span> <span className="text-orange-500">₹{constructionRate} /sqft</span>
                  </div>
                  <input type="range" min="1800" max="8000" step="100" value={constructionRate} onChange={(e)=>setConstructionRate(Number(e.target.value))} className="w-full accent-orange-500"/>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span>Utilized FSI</span> <span className="text-orange-500">{fsiUsed}</span>
                  </div>
                  <input type="range" min="0.5" max="4.0" step="0.1" value={fsiUsed} onChange={(e)=>setFsiUsed(Number(e.target.value))} className="w-full accent-orange-500"/>
               </div>
             </>
           ) : (
             <>
               <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span>Asset Value</span> <span className="text-neo-neon">₹{(propertyValue/10000000).toFixed(2)} Cr</span>
                  </div>
                  <input type="range" min="1000000" max="200000000" step="500000" value={propertyValue} onChange={(e)=>setPropertyValue(Number(e.target.value))} className="w-full accent-neo-neon"/>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <span>Rate</span> <span className="text-neo-neon">{interestRate}%</span>
                    </div>
                    <input type="range" min="6" max="14" step="0.1" value={interestRate} onChange={(e)=>setInterestRate(Number(e.target.value))} className="w-full accent-neo-neon"/>
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <span>Tenure</span> <span className="text-neo-neon">{tenureYears} Y</span>
                    </div>
                    <input type="range" min="5" max="30" step="1" value={tenureYears} onChange={(e)=>setTenureYears(Number(e.target.value))} className="w-full accent-neo-neon"/>
                 </div>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span>Down Payment</span> <span className="text-neo-neon">{downPaymentPercent}%</span>
                  </div>
                  <input type="range" min="5" max="80" step="5" value={downPaymentPercent} onChange={(e)=>setDownPaymentPercent(Number(e.target.value))} className="w-full accent-neo-neon"/>
               </div>
             </>
           )}
        </div>

        <div className="bg-white/5 rounded-[40px] p-10 border border-white/5 shadow-glass-3d flex flex-col items-center justify-center">
           <div className="w-full h-[280px]">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie 
                   data={simResult.breakdown} 
                   innerRadius={80} 
                   outerRadius={110} 
                   paddingAngle={8} 
                   dataKey="value"
                   stroke="none"
                 >
                   {simResult.breakdown.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.fill} />
                   ))}
                 </Pie>
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff' }}
                   itemStyle={{ color: '#fff' }}
                 />
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="text-center mt-6">
             <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">
               {mode === 'rent' ? `Total Rent Outflow (${analysisYears}Y)` : mode === 'land' ? 'Total Development Cost' : 'Estimated Monthly EMI'}
             </span>
             <div className="text-4xl font-black text-white tracking-tighter">
               ₹{mode === 'buy' ? simResult.primaryMetric.toLocaleString() : (simResult.primaryMetric / 10000000).toFixed(2) + ' Cr'}
             </div>
           </div>
        </div>
      </div>

      <div className={`p-10 rounded-[40px] border-l-4 shadow-glass-3d bg-white/5 border-white/10 ${mode === 'rent' ? 'border-l-emerald-500' : mode === 'land' ? 'border-l-orange-500' : 'border-l-neo-neon'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <div className="space-y-2">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">
              {mode === 'rent' ? 'Initial Cash Required' : mode === 'land' ? 'Project Alpha (Profit)' : 'Total Interest Burden'}
            </span>
            <div className={`text-2xl font-black ${themeColor}`}>
              ₹{mode === 'land' ? (simResult.secondaryMetric / 10000000).toFixed(2) + ' Cr' : (simResult.secondaryMetric / 100000).toFixed(1) + ' Lakhs'}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">
              {mode === 'rent' ? 'SIP Potential' : mode === 'land' ? 'Yield On Cost' : 'Total Acquisition Cost'}
            </span>
            <div className={`text-2xl font-black text-white`}>
              {mode === 'land' ? simResult.tertiaryMetric + '%' : '₹' + (simResult.tertiaryMetric / 10000000).toFixed(2) + ' Cr'}
            </div>
          </div>
          <div className="space-y-3">
             <div className="flex items-center gap-2">
               <Zap size={14} className={themeColor}/>
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Fiscal Summary</span>
             </div>
             <p className="text-xs text-gray-400 leading-relaxed font-medium">
               {simResult.summary}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanCalculator;
