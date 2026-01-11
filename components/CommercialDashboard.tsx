import React, { useEffect, useState } from 'react';
import { CommercialResult, CommercialListing, AppLang, CommercialRequest } from '../types';
import { 
  Briefcase, TrendingUp, MapPin, ExternalLink, Globe, Info, 
  Layers, ShoppingBag, Loader2, BarChart3, LayoutGrid, Zap, 
  ArrowUpRight, Users, ShieldCheck, CheckCircle2, RefreshCw,
  Coins, Building2, Warehouse, Gavel, Target, ShieldAlert, MessageSquare
} from 'lucide-react';
import { formatPrice, getCommercialAnalysis, parsePrice } from '../services/geminiService';
import { speak } from '../services/voiceService';

interface CommercialDashboardProps {
  result: CommercialResult;
  lang?: AppLang;
  onAnalyzeFinance?: () => void;
  city: string;
  area: string;
  pincode: string;
  initialType: 'Shop' | 'Office' | 'Warehouse';
  initialSqft: number;
}

const CommercialDashboard: React.FC<CommercialDashboardProps> = ({ 
  result: initialResult, lang = 'EN', onAnalyzeFinance, city, area, pincode, initialType, initialSqft
}) => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'stats'>('dashboard');
  const [currentResult, setCurrentResult] = useState<CommercialResult>(initialResult);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSearchingPincode, setIsSearchingPincode] = useState(false);

  useEffect(() => {
    const speechText = lang === 'HI' 
      ? `व्यावसायिक संपत्ति का मूल्य ${currentResult.fairValue} है।`
      : `The commercial valuation is approximately ${currentResult.fairValue}.`;
    speak(speechText, lang === 'HI' ? 'hi-IN' : 'en-IN');
  }, [currentResult.fairValue, lang]);

  const handleIntentChange = async (newIntent: 'Buy' | 'Rent' | 'Lease') => {
    setIsUpdating(true);
    setIsSearchingPincode(true);
    try {
      const freshData = await getCommercialAnalysis({ city, area, pincode, type: initialType, intent: newIntent, sqft: initialSqft });
      setCurrentResult(freshData);
    } finally {
      setIsUpdating(false);
      setIsSearchingPincode(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 relative pb-20">
      {(isSearchingPincode || isUpdating) && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 bg-neo-neon text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-neo-glow flex items-center gap-3 animate-bounce">
          <RefreshCw size={14} className="animate-spin" /> Updating commercial micro-market nodes...
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-neo-neon/10 rounded-2xl text-neo-neon shadow-neo-glow">
            {initialType === 'Shop' ? <ShoppingBag size={24}/> : <Building2 size={24}/>}
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{initialType} Assets</h2>
            <p className="text-[10px] text-gray-500 uppercase font-black opacity-60">{area}, {city}</p>
          </div>
        </div>
        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
          <button onClick={() => setViewMode('dashboard')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${viewMode === 'dashboard' ? 'bg-neo-neon text-white' : 'text-gray-400'}`}>
            <LayoutGrid size={12} /> Dashboard
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 border-t-2 border-t-neo-neon shadow-glass-3d flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black text-neo-neon uppercase block mb-1">Market Valuation</span>
            <div className="text-4xl font-black text-white tracking-tighter">{currentResult.fairValue}</div>
          </div>
          {onAnalyzeFinance && (
            <button onClick={() => { setIsSearchingPincode(true); setTimeout(() => { onAnalyzeFinance(); setIsSearchingPincode(false); }, 800); }} className="mt-6 px-4 py-2 rounded-xl bg-neo-neon/10 border border-neo-neon/30 text-neo-neon text-[10px] font-black uppercase tracking-widest hover:bg-neo-neon hover:text-white transition-all w-full flex items-center justify-center gap-2">
              <TrendingUp size={12}/> Fiscal Simulator
            </button>
          )}
        </div>
        <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 border-t-2 border-t-emerald-500 shadow-glass-3d">
          <span className="text-[10px] font-black text-emerald-500 uppercase block mb-1">Yield Potential</span>
          <div className="text-4xl font-black text-white tracking-tighter">{currentResult.yieldPotential}</div>
        </div>
        <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 border-t-2 border-t-neo-gold shadow-glass-3d">
          <span className="text-[10px] font-black text-neo-gold uppercase block mb-1">Footfall Score</span>
          <div className="text-4xl font-black text-white tracking-tighter">{currentResult.footfallScore}/100</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 border-l-4 border-l-neo-neon mb-8">
          <h3 className="text-xs font-black text-white mb-4 flex items-center gap-2 uppercase tracking-widest"><Info size={18}/> Business Intelligence</h3>
          <p className="text-gray-300 leading-relaxed italic text-sm">"{currentResult.businessInsights}"</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentResult.listings.map((item, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-[32px] p-6 shadow-glass-3d group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="font-black text-white text-lg truncate uppercase">{item.title}</h4>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{item.address}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-white">{item.price}</div>
                  <div className="text-[8px] text-neo-neon font-black uppercase mt-1">{item.intent} Option</div>
                </div>
              </div>
              <a href={item.sourceUrl} target="_blank" rel="noopener" className="w-full py-4 rounded-2xl bg-neo-neon text-white text-[10px] font-black uppercase flex items-center justify-center gap-2">Verify Listing <ExternalLink size={14} /></a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommercialDashboard;