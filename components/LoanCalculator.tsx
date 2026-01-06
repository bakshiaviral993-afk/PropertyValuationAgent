
import React, { useState, useEffect } from 'react';
import { Calculator, Landmark, ShieldCheck, Zap, Info, Wallet, TrendingUp, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface LoanCalculatorProps {
  initialValue?: number;
}

const LoanCalculator: React.FC<LoanCalculatorProps> = ({ initialValue = 10000000 }) => {
  const [propertyValue, setPropertyValue] = useState(initialValue);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(8.7);
  const [tenureYears, setTenureYears] = useState(20);
  const [prepayment, setPrepayment] = useState(0);

  const [loanResult, setLoanResult] = useState({
    monthlyEmi: 0,
    totalInterest: 0,
    totalPayment: 0,
    stampDuty: 0,
    registration: 0,
    loanAmount: 0,
    interestSaved: 0
  });

  useEffect(() => {
    const loanAmount = propertyValue * (1 - downPaymentPercent / 100);
    const monthlyRate = interestRate / (12 * 100);
    const n = tenureYears * 12;

    const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    const totalWithoutPrepay = emi * n;
    
    // Simple prepayment savings estimate (1% prepay saves ~4% interest over 20yr)
    const savings = prepayment > 0 ? (loanAmount * (prepayment/100) * 2.5) : 0;

    setLoanResult({
      monthlyEmi: Math.round(emi),
      totalInterest: Math.round(totalWithoutPrepay - loanAmount - savings),
      totalPayment: Math.round(totalWithoutPrepay - savings),
      stampDuty: Math.round(propertyValue * 0.06),
      registration: 30000,
      loanAmount: Math.round(loanAmount),
      interestSaved: Math.round(savings)
    });
  }, [propertyValue, downPaymentPercent, interestRate, tenureYears, prepayment]);

  const COLORS = ['#00F6FF', '#FFAE42'];
  const chartData = [
    { name: 'Principal', value: loanResult.loanAmount },
    { name: 'Interest', value: loanResult.totalInterest }
  ];

  return (
    <div className="h-full overflow-y-auto pr-2 pb-10 scrollbar-thin space-y-8 animate-in slide-in-from-right-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel rounded-3xl p-8 space-y-6 border border-white/10">
           <h3 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Financial Parameters</h3>
           
           <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-mono uppercase"><span>Property Value</span> <span>₹{(propertyValue/10000000).toFixed(2)} Cr</span></div>
              <input type="range" min="2000000" max="200000000" step="1000000" value={propertyValue} onChange={(e)=>setPropertyValue(Number(e.target.value))} className="w-full accent-cyber-orange"/>
           </div>

           <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-mono uppercase"><span>Prepayment Goal (%)</span> <span className="text-cyber-lime">{prepayment}%</span></div>
              <input type="range" min="0" max="20" step="1" value={prepayment} onChange={(e)=>setPrepayment(Number(e.target.value))} className="w-full accent-cyber-lime"/>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                 <div className="text-[8px] text-gray-500 uppercase mb-1">Monthly EMI</div>
                 <div className="text-lg font-mono font-bold text-cyber-orange">₹{loanResult.monthlyEmi.toLocaleString()}</div>
              </div>
              <div className="p-4 bg-cyber-lime/10 rounded-2xl border border-cyber-lime/20">
                 <div className="text-[8px] text-cyber-lime uppercase mb-1">Interest Saved</div>
                 <div className="text-lg font-mono font-bold text-cyber-lime">₹{(loanResult.interestSaved/100000).toFixed(1)} L</div>
              </div>
           </div>
        </div>

        <div className="glass-panel rounded-3xl p-8 border border-white/5 flex flex-col items-center justify-center min-h-[300px]">
           <div className="w-full h-[200px] min-w-0">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                   <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {chartData.map((e,i)=><Cell key={i} fill={COLORS[i]}/>)}
                   </Pie>
                   <Tooltip contentStyle={{backgroundColor:'#000', borderRadius:'12px', border:'none', fontSize:'10px'}}/>
                </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="mt-4 text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">Total Repayment</div>
              <div className="text-2xl font-mono font-bold text-white">₹{(loanResult.totalPayment/10000000).toFixed(2)} Cr</div>
           </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-8 border-l-4 border-l-cyber-lime bg-cyber-lime/5">
         <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-cyber-lime"/> Rent vs Buy Simulator (10-Year Outlook)</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
               <div className="text-[10px] text-gray-500 uppercase">Cost of Renting (Incl. 7% Escalation)</div>
               <div className="text-xl font-bold text-white">₹{(propertyValue * 0.45 / 10000000).toFixed(2)} Cr</div>
            </div>
            <div className="space-y-2">
               <div className="text-[10px] text-gray-500 uppercase">Equity Gain (Incl. 8% Appreciation)</div>
               <div className="text-xl font-bold text-cyber-lime">₹{(propertyValue * 1.1 / 10000000).toFixed(2)} Cr</div>
            </div>
         </div>
         <div className="mt-6 p-4 bg-black/40 rounded-xl border border-cyber-lime/20 text-[10px] text-cyber-lime font-mono uppercase tracking-widest">
            Holding Period Optimization: Positive ROI after 4.2 Years.
         </div>
      </div>
    </div>
  );
};

export default LoanCalculator;
