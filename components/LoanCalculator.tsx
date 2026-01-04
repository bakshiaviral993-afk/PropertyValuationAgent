
import React, { useState, useEffect } from 'react';
import { Calculator, Landmark, ShieldCheck, Zap, Info, Wallet, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface LoanCalculatorProps {
  initialValue?: number;
}

const LoanCalculator: React.FC<LoanCalculatorProps> = ({ initialValue = 10000000 }) => {
  const [propertyValue, setPropertyValue] = useState(initialValue);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(8.7);
  const [tenureYears, setTenureYears] = useState(20);

  const [loanResult, setLoanResult] = useState({
    monthlyEmi: 0,
    totalInterest: 0,
    totalPayment: 0,
    stampDuty: 0,
    registration: 0,
    legalCharges: 0,
    totalInitialCash: 0,
    loanAmount: 0
  });

  useEffect(() => {
    const loanAmount = propertyValue * (1 - downPaymentPercent / 100);
    const monthlyRate = interestRate / (12 * 100);
    const numberOfPayments = tenureYears * 12;

    const emi = 
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    const totalPayment = emi * numberOfPayments;
    const totalInterest = totalPayment - loanAmount;

    // Legal & Statuary Logic
    const stampDuty = propertyValue * 0.06; // Maharashtra Average
    const registration = Math.min(propertyValue * 0.01, 30000); // Capped at 30k
    const legalCharges = propertyValue * 0.005 > 50000 ? 50000 : Math.max(propertyValue * 0.005, 15000);
    
    const downPaymentAmount = propertyValue * (downPaymentPercent / 100);
    const totalInitialCash = downPaymentAmount + stampDuty + registration + legalCharges;

    setLoanResult({
      monthlyEmi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalPayment: Math.round(totalPayment),
      stampDuty: Math.round(stampDuty),
      registration: Math.round(registration),
      legalCharges: Math.round(legalCharges),
      totalInitialCash: Math.round(totalInitialCash),
      loanAmount: Math.round(loanAmount)
    });
  }, [propertyValue, downPaymentPercent, interestRate, tenureYears]);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString()}`;
  };

  const chartData = [
    { name: 'Principal', value: loanResult.loanAmount },
    { name: 'Interest', value: loanResult.totalInterest },
  ];

  const COLORS = ['#00F6FF', '#FFAE42'];

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-right-8 duration-1000 overflow-hidden relative">
      <div className="flex justify-between items-center gap-4 bg-white/5 border border-white/5 p-3 rounded-2xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyber-orange/10 border border-cyber-orange/20">
            <Calculator size={16} className="text-cyber-orange" />
          </div>
          <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">Finance_Simulator_V2</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-10 scrollbar-thin">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="space-y-8 glass-panel rounded-3xl p-8 border border-white/5">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono text-gray-500 uppercase">Property Value</label>
                <span className="text-sm font-bold text-white font-mono">{formatCurrency(propertyValue)}</span>
              </div>
              <input 
                type="range" min="1000000" max="100000000" step="100000"
                value={propertyValue} onChange={(e) => setPropertyValue(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyber-orange"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono text-gray-500 uppercase">Down Payment (%)</label>
                <span className="text-sm font-bold text-white font-mono">{downPaymentPercent}%</span>
              </div>
              <input 
                type="range" min="10" max="90" step="5"
                value={downPaymentPercent} onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyber-orange"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono text-gray-500 uppercase">Interest Rate (Annual %)</label>
                <span className="text-sm font-bold text-white font-mono">{interestRate}%</span>
              </div>
              <input 
                type="range" min="5" max="15" step="0.1"
                value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyber-orange"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono text-gray-500 uppercase">Tenure (Years)</label>
                <span className="text-sm font-bold text-white font-mono">{tenureYears} Y</span>
              </div>
              <input 
                type="range" min="5" max="30" step="1"
                value={tenureYears} onChange={(e) => setTenureYears(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyber-orange"
              />
            </div>
          </div>

          {/* Results Display */}
          <div className="space-y-6">
            <div className="glass-panel rounded-3xl p-8 border-l-4 border-l-cyber-orange bg-cyber-orange/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-cyber-orange text-black rounded-lg"><Landmark size={20} /></div>
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-widest">Monthly EMI Projection</h3>
              </div>
              <div className="text-5xl font-mono font-bold text-cyber-orange text-glow-orange tracking-tighter mb-2">
                ₹{loanResult.monthlyEmi.toLocaleString()}
              </div>
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Recurring Liability per Month</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel rounded-2xl p-6 border border-white/5 bg-white/[0.02]">
                <div className="text-[9px] font-mono text-gray-500 uppercase mb-2">Total Interest</div>
                <div className="text-lg font-mono font-bold text-white">{formatCurrency(loanResult.totalInterest)}</div>
              </div>
              <div className="glass-panel rounded-2xl p-6 border border-white/5 bg-white/[0.02]">
                <div className="text-[9px] font-mono text-gray-500 uppercase mb-2">Loan Amount</div>
                <div className="text-lg font-mono font-bold text-white">{formatCurrency(loanResult.loanAmount)}</div>
              </div>
            </div>

            <div className="relative w-full h-[220px] glass-panel rounded-3xl border border-white/5 p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            isAnimationActive={true}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0D0F12', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            itemStyle={{ color: '#FFFFFF', fontFamily: 'JetBrains Mono', fontSize: '10px' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-gray-500 uppercase font-mono">Total_Pay</span>
                    <span className="text-xs font-bold text-white font-mono">{formatCurrency(loanResult.totalPayment)}</span>
                </div>
            </div>
          </div>
        </div>

        {/* Legal & Stamp Duty Logic Section */}
        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-cyber-lime" />
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-widest">Closing Costs & Legal Projection</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel rounded-3xl p-6 border border-cyber-lime/20 bg-cyber-lime/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5"><Zap size={40} /></div>
               <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Stamp Duty (Projected)</div>
               <div className="text-xl font-mono font-bold text-cyber-lime">{formatCurrency(loanResult.stampDuty)}</div>
               <p className="text-[8px] text-gray-500 mt-2 font-mono italic">*Calculated at ~6% market baseline.</p>
            </div>
            <div className="glass-panel rounded-3xl p-6 border border-white/5 bg-white/[0.02]">
               <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Registration Charges</div>
               <div className="text-xl font-mono font-bold text-white">{formatCurrency(loanResult.registration)}</div>
               <p className="text-[8px] text-gray-500 mt-2 font-mono italic">*Market capped at standard government ceiling.</p>
            </div>
            <div className="glass-panel rounded-3xl p-6 border border-white/5 bg-white/[0.02]">
               <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Legal & Processing</div>
               <div className="text-xl font-mono font-bold text-white">{formatCurrency(loanResult.legalCharges)}</div>
               <p className="text-[8px] text-gray-500 mt-2 font-mono italic">*Includes documentation and verification flow.</p>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-8 border border-cyber-lime/40 bg-cyber-lime/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyber-lime text-black rounded-2xl"><Wallet size={24} /></div>
              <div>
                <h4 className="text-sm font-mono font-bold text-white uppercase tracking-widest">Net Initial Cash Required</h4>
                <p className="text-[10px] text-gray-400 font-mono mt-1">Down Payment + Closing Costs + Legal Reserves</p>
              </div>
            </div>
            <div className="text-right">
               <div className="text-3xl font-mono font-bold text-cyber-lime text-glow-lime">{formatCurrency(loanResult.totalInitialCash)}</div>
               <div className="text-[9px] font-mono text-gray-500 uppercase mt-1">Total_Out_of_Pocket</div>
            </div>
          </div>
          
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-start gap-3">
            <Info size={16} className="text-cyber-orange shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-400 font-mono leading-relaxed uppercase">
              * This is a neural simulation. Actual home loan eligibility is subject to KYC, Credit Score (CIBIL), and specific banking policy variations. Legal charges vary by advocate cluster.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanCalculator;
