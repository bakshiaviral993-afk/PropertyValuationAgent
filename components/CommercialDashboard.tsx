import React, { useEffect, useState } from 'react';
import { CommercialResult, CommercialListing, AppLang, CommercialRequest } from '../types';
import { 
  Briefcase, TrendingUp, MapPin, ExternalLink, Globe, Info, 
  Layers, ShoppingBag, Loader2, BarChart3, LayoutGrid, Zap, 
  ArrowUpRight, Users, ShieldCheck, CheckCircle2, RefreshCw,
  Coins, Building2, Warehouse, Gavel, Target, ShieldAlert, MessageSquare, Map as MapIcon, Plus
} from 'lucide-react';
import { formatPrice, getCommercialAnalysis, parsePrice } from '../services/geminiService';
import { speak } from '../services/voiceService';
import GoogleMapView from './GoogleMapView';
import { getMoreListings } from '../services/valuationService';
// @ts-ignore
import confetti from 'canvas-confetti';
import MarketIntelligence from './MarketIntelligence'; // NEW: Import for justification and signals
// Just add to any dashboard:
import React, { useState } from 'react';
import { LayoutGrid, FileText } from 'lucide-react';
import ValuationReport from './ValuationReport';
// Add tab button and view:


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
  const [viewMode, setViewMode] = useState<'dashboard' | 'map'>('dashboard');
  const [currentResult, setCurrentResult] = useState<CommercialResult>(initialResult);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSearchingPincode, setIsSearchingPincode] = useState(false);
  
  const [allListings, setAllListings] = useState<CommercialListing[]>(initialResult.listings || []);
  const [isDeepScanning, setIsDeepScanning] = useState(false);

  useEffect(() => {
    setAllListings(initialResult.listings || []);
  }, [initialResult.listings]);

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

  const handleDeepScan = async () => {
    if (isDeepScanning) return;
    setIsDeepScanning(true);
    setIsSearchingPincode(true);
    
    try {
      const more = await getMoreListings({
        city,
        area,
        propertyType: initialType,
        size: initialSqft,
        mode: 'commercial' // Strict mode for commercial valuations only
      });
      
      const formattedMore: CommercialListing[] = more.map(l => ({
        title: l.project || "Commercial Space",
        price: formatPrice(l.price || l.totalPrice || l.monthlyRent),
        address: `${l.project}, ${area}, ${city}`,
        type: initialType,
        intent: 'Buy', 
        sourceUrl: 'https://www.99acres.com',
        sqft: l.size_sqft || initialSqft,
        latitude: l.latitude,
        longitude: l.longitude
      }));

      const uniqueNew = formattedMore.filter(nm => !allListings.some(al => al.title === nm.title));
      setAllListings(prev => [...prev, ...uniqueNew]);
      
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.8 } });
    } catch (e) {
      console.error("Commercial Deep Scan Failed:", e);
    } finally {
      setIsDeepScanning(false);
      setIsSearchingPincode(false);
    }
  };

  const mapNodes = allListings.map((l, i) => ({
    title: l.title,
    price: typeof l.price === 'string' ? l.price : formatPrice(l.price as any),
    address: l.address,
    lat: l.latitude,
    lng: l.longitude,
    isSubject: i === 0 
  }));

  const fairValueNum = parsePrice(currentResult.fairValue); // NEW: For fallback range calculation

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 relative pb-20">
      {(isSearchingPincode || isUpdating) && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 bg-neo-neon text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-neo-glow flex items-center gap-3 animate-bounce">
          <RefreshCw size={14} className="animate-spin" /> Deep commercial node scan in progress...
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-neo-neon/10 rounded-2xl text-neo-neon shadow-neo-glow">
            {initialType === 'Shop' ? <ShoppingBag size={24}/> : <Building2 size={24}/>}
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{initialType} Assets</h2>
            <p className="text-[10px] text-gray-500 uppercase font-black opacity-60 tracking-widest">{area}, {city}</p>
          </div>
        </div>
        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 overflow-x-auto scrollbar-hide no-pdf-export">
          <button 
            onClick={() => setViewMode('dashboard')} 
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shrink-0 ${viewMode === 'dashboard' ? 'bg-neo-neon text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}
          >
            <LayoutGrid size={12} /> Dashboard
          </button>
          <button 
            onClick={() => setViewMode('map')} 
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shrink-0 ${viewMode === 'map' ? 'bg-neo-neon text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}
          >
            <MapIcon size={12} /> Map View
          </button>
        </div>
      </div>

      {viewMode === 'map' ? (
        <GoogleMapView nodes={mapNodes} />
      ) : (
        <>
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

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {/* NEW: Added MarketIntelligence for justification, signals, and negotiation script */}
            <MarketIntelligence result={currentResult} accentColor="neo-neon" />

            <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 border-l-4 border-l-neo-neon mb-8">
              <h3 className="text-xs font-black text-white mb-4 flex items-center gap-2 uppercase tracking-widest"><Info size={18}/> Business Intelligence</h3>
              <p className="text-gray-300 leading-relaxed italic text-sm">"{currentResult.businessInsights}"</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
              {allListings.map((item, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-[32px] p-8 shadow-glass-3d group hover:border-neo-neon/40 transition-all animate-in fade-in zoom-in duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="font-black text-white text-lg truncate uppercase leading-tight">{item.title}</h4>
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">{item.address}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-white">{typeof item.price === 'string' ? item.price : formatPrice(item.price as any)}</div>
                      <div className="text-[8px] text-neo-neon font-black uppercase mt-1 px-2 py-0.5 bg-neo-neon/10 rounded border border-neo-neon/20">{item.intent} Option</div>
                    </div>
                  </div>
                  <div className="mb-6 grid grid-cols-2 gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">Area: {item.sqft} SQFT</div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">Type: {item.type}</div>
                  </div>
                  <a href={item.sourceUrl} target="_blank" rel="noopener" className="w-full py-4 rounded-2xl bg-neo-neon text-white text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-neo-glow transition-all active:scale-95">Verify Listing <ExternalLink size={14} /></a>
                </div>
              ))}
            </div>

            {allListings.length > 0 && (
              <div className="flex flex-col items-center gap-6 py-10">
                <div className="flex items-center gap-2 mb-2">
                   <div className="h-1 w-20 bg-gradient-to-r from-transparent to-neo-neon/20" />
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Extended Commercial Hub Detected</p>
                   <div className="h-1 w-20 bg-gradient-to-l from-transparent to-neo-neon/20" />
                </div>
                <button 
                  onClick={handleDeepScan}
                  disabled={isDeepScanning}
                  className="px-12 py-5 bg-white/5 border border-white/10 rounded-full text-xs font-black uppercase tracking-widest text-white hover:bg-neo-neon hover:border-neo-neon transition-all flex items-center gap-3 shadow-neo-glow group active:scale-95 disabled:opacity-50"
                >
                  {isDeepScanning ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} className="group-hover:rotate-90 transition-transform" />}
                  {isDeepScanning ? 'Exhaustive Node Scan...' : 'Load All Available Commercial Assets'}
                </button>
              </div>
            )}

            {allListings.length === 0 && !isSearchingPincode && (
              <div className="col-span-full text-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10">
                <Briefcase size={48} className="mx-auto text-gray-600 mb-6 opacity-20" />
                <p className="text-gray-500 font-black uppercase tracking-widest text-xs">No hyper-local commercial listings found.</p>
                {/* NEW: Fallback range based on market trends */}
                <p className="text-sm mt-4 font-bold">Estimated market range in this area: {formatPrice(fairValueNum * 0.8)} - {formatPrice(fairValueNum * 1.2)}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CommercialDashboard;
