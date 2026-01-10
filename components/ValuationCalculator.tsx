import React, { useState } from 'react';
import { Calculator, X, AlertTriangle, CheckCircle2, TrendingDown, Landmark, Building2, MapIcon, ArrowRight } from 'lucide-react';

interface ValuationCalculatorProps {
  onClose?: () => void;
}

const ValuationCalculator: React.FC<ValuationCalculatorProps> = ({ onClose }) => {
  const [tab, setTab] = useState<'buy' | 'rent' | 'land'>('buy');
  const [formData, setFormData] = useState({
    propertyType: '2 BHK',
    sqft: 950,
    city: 'Pune Wagholi',
    landSize: 1000,
    expectedPrice: 0
  });
  const [result, setResult] = useState<any>(null);
  const [showWalkaway, setShowWalkaway] = useState(false);

  // New Heuristic Weights based on user prompt logic
  const rule_weight = 0.85;
  const confidence_weight = 0.92;

  const calculateBuyValue = () => {
    const isWagholi = formData.city.toLowerCase().includes('wagholi');
    
    // 1. Market Rule Price
    const baseRate = isWagholi ? 6800 : 8500;
    const rule_price = (formData.sqft * baseRate * 1.08) / 100000;
    
    // 2. Guideline Rate (Govt Reference)
    const guidelineRate = isWagholi ? 4500 : 5500;
    const guidelineValue = (formData.sqft * guidelineRate) / 100000;

    // 3. Mock ML Price (Simulated intelligence layer)
    const ml_price = rule_price * (0.95 + Math.random() * 0.1);

    /**
     * ADVANCED VALUATION ENGINE:
     * final = max(guidelineRate * area, ML_price * confidence_weight, rule_price * rule_weight)
     */
    const final = Math.max(
      guidelineValue,
      ml_price * confidence_weight,
      rule_price * rule_weight
    );

    return Math.round(final * 100) / 100;
  };

  const calculateRentValue = () => {
    const monthlyRate = formData.city.toLowerCase().includes('wagholi') ? 22 : 28;
    const monthly = formData.sqft * monthlyRate;
    const annual = monthly * 12;
    return { monthly: Math.round(monthly), annual: Math.round(annual) };
  };

  const calculateLandValue = () => {
    const isWagholi = formData.city.toLowerCase().includes('wagholi');
    const ratePerSqyd = isWagholi ? 4500 : 6500;
    const rule_price = (formData.landSize * ratePerSqyd) / 100000;
    const guidelineRate = isWagholi ? 3200 : 4200;
    const guidelineValue = (formData.landSize * guidelineRate) / 100000;
    
    const final = Math.max(guidelineValue, rule_price * rule_weight);
    return Math.round(final * 100) / 100;
  };

  const handleCalculate = () => {
    const calc = tab === 'rent' ? calculateRentValue() : 
                 tab === 'land' ? calculateLandValue() : calculateBuyValue();
    setResult(calc);
    
    if (tab === 'buy' && formData.expectedPrice > (calc as number) * 1.1) {
      setShowWalkaway(true);
    } else {
      setShowWalkaway(false);
    }
  };

  const getNegotiationScript = (calcValue: number, expected: number) => {
    const diff = Math.round((expected / calcValue - 1) * 100);
    return `💰 Estimated: ₹${calcValue}L | Asked: ₹${expected}L (+${diff}%)\n\n📋 Script:\n"Market comps in ${formData.city} show ₹${calcValue}L avg. Can we meet at ₹${Math.round(calcValue * 1.05)}L?"\n\n❌ Walkaway if >₹${Math.round(calcValue * 1.1)}L`;
  };

  return (
    <div className="w-full max-w-2xl bg-neo-bg border border-white/10 rounded-[48px] p-8 md:p-12 shadow-neo-glow relative overflow-hidden">
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-neo-neon/10 rounded-2xl text-neo-neon shadow-neo-glow">
            <Calculator size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Quick Calc</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em] font-black opacity-60">Hybrid Intelligence Node v2.1</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl hover:bg-neo-pink hover:text-white transition-all text-gray-500">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-8">
        {(['buy', 'rent', 'land'] as const).map(t => (
          <button 
            key={t} 
            onClick={() => { setTab(t); setResult(null); setShowWalkaway(false); }}
            className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${
              tab === t ? 'bg-neo-neon border-neo-neon text-white shadow-neo-glow' : 'bg-white/5 border-white/5 text-gray-500 hover:text-white'
            }`}
          >
            {t === 'buy' && <Landmark size={14}/>}
            {t === 'rent' && <Building2 size={14}/>}
            {t === 'land' && <MapIcon size={14}/>}
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-6 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Asset Configuration</label>
            <select 
              value={formData.propertyType} 
              onChange={e => setFormData({...formData, propertyType: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-neo-neon outline-none"
            >
              <option className="bg-neo-bg">1 BHK</option>
              <option className="bg-neo-bg">2 BHK</option>
              <option className="bg-neo-bg">3 BHK</option>
              <option className="bg-neo-bg">Villa/Plot</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
              {tab === 'land' ? 'Plot Area (Sq.Yds)' : 'Carpet Area (Sq.Ft)'}
            </label>
            <input 
              type="number" 
              placeholder="e.g. 1000"
              value={tab === 'land' ? formData.landSize : formData.sqft} 
              onChange={e => setFormData({...formData, [tab === 'land' ? 'landSize' : 'sqft']: Number(e.target.value)})}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-neo-neon outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Micro-Market / Locality</label>
          <input 
            type="text" 
            placeholder="e.g. Pune Wagholi" 
            value={formData.city} 
            onChange={e => setFormData({...formData, city: e.target.value})}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-neo-neon outline-none"
          />
        </div>
        
        {tab === 'buy' && (
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Expected Asking Price (Lakhs)</label>
            <input 
              type="number" 
              placeholder="e.g. 75" 
              value={formData.expectedPrice || ''} 
              onChange={e => setFormData({...formData, expectedPrice: Number(e.target.value)})}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-neo-neon outline-none"
            />
          </div>
        )}
      </div>

      <button 
        onClick={handleCalculate} 
        className="w-full py-6 bg-neo-neon text-white rounded-[24px] text-sm font-black uppercase tracking-widest shadow-neo-glow hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 border-t border-white/20"
      >
        Calculate Value <ArrowRight size={18} />
      </button>

      {result && (
        <div className="mt-10 p-8 bg-white/5 border border-emerald-500/20 rounded-[32px] animate-in zoom-in duration-300">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 size={20} className="text-emerald-500" />
            <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest">Calculated Estimate</h3>
          </div>
          
          {tab === 'rent' ? (
            <div className="space-y-1">
              <div className="text-4xl font-black text-white">₹{result.monthly.toLocaleString()} <span className="text-xs text-gray-500">/MO</span></div>
              <div className="text-sm text-gray-400 font-bold uppercase tracking-widest">Annual Yield: ₹{result.annual.toLocaleString()}</div>
            </div>
          ) : (
            <div className="text-4xl font-black text-white">₹{result} <span className="text-xs text-gray-500">LAKH</span></div>
          )}
          
          {tab === 'buy' && formData.expectedPrice > 0 && (
            <div className={`mt-6 p-4 rounded-2xl flex items-center gap-3 border ${
              formData.expectedPrice > (result as number) * 1.1 
                ? 'bg-neo-pink/10 border-neo-pink/20 text-neo-pink' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
            }`}>
              {formData.expectedPrice > (result as number) * 1.1 ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              <span className="text-[10px] font-black uppercase tracking-widest">
                {formData.expectedPrice > (result as number) * 1.1 ? 'Caution: Asset Overpriced' : 'Verified: Fair Market Deal'}
              </span>
            </div>
          )}
        </div>
      )}

      {showWalkaway && (
        <div className="mt-6 p-8 bg-neo-pink/10 border border-neo-pink/20 rounded-[32px] animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 mb-4 text-neo-pink">
            <TrendingDown size={20} />
            <h4 className="text-xs font-black uppercase tracking-widest">Walk-Away Strategy</h4>
          </div>
          <pre className="text-xs text-gray-200 font-mono whitespace-pre-wrap bg-black/40 p-4 rounded-2xl border border-white/5 leading-relaxed">
            {getNegotiationScript(result, formData.expectedPrice)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ValuationCalculator;