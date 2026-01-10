
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
  // Passing location context to allow internal re-querying
  city: string;
  area: string;
  pincode: string;
  initialType: 'Shop' | 'Office' | 'Warehouse';
  initialSqft: number;
}

const CommercialDashboard: React.FC<CommercialDashboardProps> = ({ 
  result: initialResult, 
  lang = 'EN', 
  onAnalyzeFinance,
  city,
  area,
  pincode,
  initialType,
  initialSqft
}) => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'stats'>('dashboard');
  const [currentResult, setCurrentResult] = useState<CommercialResult>(initialResult);
  const [currentIntent, setCurrentIntent] = useState<'Buy' | 'Rent' | 'Lease'>(initialResult.listings[0]?.intent || 'Buy');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const speechText = lang === 'HI' 
      ? `इस क्षेत्र के व्यावसायिक संपत्तियों का बाजार मूल्य लगभग ${currentResult.fairValue} है।`
      : `The estimated commercial market value for your search is approximately ${currentResult.fairValue}.`;
    speak(speechText, lang === 'HI' ? 'hi-IN' : 'en-IN');
  }, [currentResult.fairValue, lang]);

  const handleIntentChange = async (newIntent: 'Buy' | 'Rent' | 'Lease') => {
    if (newIntent === currentIntent) return;
    setIsUpdating(true);
    setCurrentIntent(newIntent);
    
    try {
      const req: CommercialRequest = {
        city,
        area,
        pincode,
        type: initialType,
        intent: newIntent,
        sqft: initialSqft
      };
      const freshData = await getCommercialAnalysis(req);
      setCurrentResult(freshData);
    } catch (e) {
      console.error("Failed to re-sync commercial data", e);
    } finally {
      setIsUpdating(false);
    }
  };

  const getSubIcon = () => {
    if (initialType === 'Shop') return <ShoppingBag size={24} />;
    if (initialType === 'Office') return <Building2 size={24} />;
    return <Warehouse size={24} />;
  };

  const fairValNum = parsePrice(currentResult.fairValue);
  const targetOffer = fairValNum * 0.94;
  const walkawayCap = fairValNum * 1.08;

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 relative pb-20">
      {isUpdating && (
        <div className="absolute inset-0 bg-neo-bg/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 rounded-[48px]">
          <Loader2 className="text-neo-neon animate-spin" size={48} />
          <p className="text-[10px] font-black text-neo-neon uppercase tracking-[0.4em]">Re-Syncing Market Nodes...</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-neo-neon/10 rounded-2xl text-neo-neon shadow-neo-glow">
            {getSubIcon()}
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{initialType} Assets</h2>
            <div className="flex items-center gap-2">
              <MapPin size={10} className="text-neo-neon" />
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black opacity-60">{area}, {city}</p>
            </div>
          </div>
        </div>
        
        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
          <button onClick={() => setViewMode('dashboard')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === 'dashboard' ? 'bg-neo-neon text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>
            <LayoutGrid size={12} /> Results
          </button>
          <button onClick={() => setViewMode('stats')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === 'stats' ? 'bg-neo-neon text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>
            <BarChart3 size={12} /> Analysis
          </button>
        </div>
      </div>

      {/* Internal Intent Toggles */}
      <div className="bg-white/5 border border-white/10 p-2 rounded-[32px] flex gap-2">
        {(['Buy', 'Rent', 'Lease'] as const).map(intent => (
          <button
            key={intent}
            onClick={() => handleIntentChange(intent)}
            className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
              currentIntent === intent 
                ? 'bg-neo-neon border-neo-neon text-white shadow-neo-glow' 
                : 'bg-transparent border-transparent text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            {intent} {initialType}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 shadow-glass-3d border-t-2 border-t-neo-neon">
          <div className="flex items-center gap-2 mb-2">
            <Coins size={14} className="text-neo-neon" />
            <span className="text-[10px] font-black text-neo-neon uppercase tracking-widest block">Market Valuation</span>
          </div>
          <div className="text-4xl font-black text-white tracking-tighter">
            {currentResult.fairValue}
          </div>
        </div>
        <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 shadow-glass-3d border-t-2 border-t-emerald-500">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">Yield Potential</span>
          </div>
          <div className="text-4xl font-black text-white tracking-tighter">
            {currentResult.yieldPotential}
          </div>
        </div>
        <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 shadow-glass-3d border-t-2 border-t-neo-gold">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-neo-gold" />
            <span className="text-[10px] font-black text-neo-gold uppercase tracking-widest block">Footfall Score</span>
          </div>
          <div className="text-4xl font-black text-white tracking-tighter">
            {currentResult.footfallScore}/100
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-10 scrollbar-hide">
        <div className="space-y-8">
          {/* NEW: Commercial Negotiation Hub */}
          <div className="bg-neo-gold/5 border border-neo-gold/20 rounded-[48px] p-10 shadow-gold-glow">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-neo-gold/10 rounded-2xl text-neo-gold">
                  <Target size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Yield-Preservation Matrix</h3>
                  <p className="text-[10px] text-neo-gold font-black uppercase tracking-[0.4em]">Commercial_Acquisition_Engine</p>
                </div>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <div className="flex-1 md:flex-none p-4 bg-neo-bg/50 border border-neo-gold/20 rounded-2xl">
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1">Floor Bid</span>
                  <div className="text-lg font-black text-neo-gold">{formatPrice(targetOffer)}</div>
                </div>
                <div className="flex-1 md:flex-none p-4 bg-neo-bg/50 border border-neo-pink/20 rounded-2xl">
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1 text-neo-pink">Hard Ceiling</span>
                  <div className="text-lg font-black text-neo-pink">{formatPrice(walkawayCap)}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-neo-gold">
                  <MessageSquare size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Negotiation Script</span>
                </div>
                <div className="p-6 bg-black/40 border border-white/5 rounded-3xl text-sm text-gray-300 leading-relaxed italic">
                  "{currentResult.negotiationScript || "Target the lease fit-out duration and early termination clauses as your primary leverage points in this sector."}"
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-neo-pink">
                  <ShieldAlert size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Deal Breakers</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-xs text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-neo-gold mt-1.5 shadow-gold-glow shrink-0" />
                    <span>Commercial footprint in this zone is sensitive to {currentResult.footfallScore < 50 ? 'low' : 'high'} footfall. Anchor offer to footfall indices.</span>
                  </li>
                  <li className="flex gap-3 text-xs text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-neo-pink mt-1.5 shadow-pink-glow shrink-0" />
                    <span>Walk away immediately if the CAM (Common Area Maintenance) inclusive exceeds 15% of base valuation.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 shadow-glass-3d border-l-4 border-l-neo-neon">
            <h3 className="text-xs font-black text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
              <Info size={18} className="text-neo-neon" /> Regional Dynamics
            </h3>
            <p className="text-gray-300 leading-relaxed italic text-sm">
              "{currentResult.businessInsights}"
            </p>
            <div className="mt-6 p-4 bg-neo-neon/5 border border-neo-neon/20 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-neo-neon" />
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Confidence: {currentResult.confidenceScore}%</p>
              </div>
              <button className="text-[9px] font-black text-neo-neon uppercase tracking-widest flex items-center gap-1 hover:underline">
                <RefreshCw size={10} /> Live Data Source
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentResult.listings.map((item, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-[32px] p-6 shadow-glass-3d hover:border-neo-neon/30 transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-black text-white text-lg truncate uppercase">{item.title}</h4>
                    <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-1 font-bold uppercase tracking-widest truncate"><MapPin size={12}/> {item.address}</p>
                    <div className="flex gap-2 mt-3">
                       <span className="px-2 py-0.5 bg-neo-neon/10 text-neo-neon text-[8px] font-black uppercase rounded border border-neo-neon/20">{item.type}</span>
                       <span className="px-2 py-0.5 bg-white/5 text-gray-500 text-[8px] font-black uppercase rounded border border-white/10">{item.sqft} SQFT</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-black text-white">{item.price}</div>
                    <div className="text-[8px] text-neo-neon font-black uppercase tracking-[0.2em] mt-1">{item.intent} Option</div>
                  </div>
                </div>
                <div className="flex gap-3">
                   <a href={item.sourceUrl} target="_blank" rel="noopener" className="flex-1 py-4 rounded-2xl bg-neo-neon text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-neo-glow transition-all">
                     Verify Listing <ExternalLink size={14} />
                   </a>
                   {onAnalyzeFinance && (
                     <button onClick={onAnalyzeFinance} className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-gray-400 hover:text-white transition-all">
                       <ArrowUpRight size={20} />
                     </button>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommercialDashboard;
