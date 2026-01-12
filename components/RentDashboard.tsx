
import React, { useState, useEffect } from 'react';
import { RentResult, RentalListing, AppLang } from '../types';
import { 
  MapPin, ExternalLink, Building2, Loader2, BarChart3, LayoutGrid,
  Receipt, TrendingUp, RefreshCw, Sparkles, CheckCircle, AlertCircle, Map as MapIcon, Info
} from 'lucide-react';
import { generatePropertyImage } from '../services/geminiService';
import { speak } from '../services/voiceService';
import MarketStats from './MarketStats';
import { parsePrice, calculateListingStats } from '../utils/listingProcessor';
import GoogleMapView from './GoogleMapView';

interface RentDashboardProps {
  result: RentResult;
  lang?: AppLang;
  onAnalyzeFinance?: () => void;
  userBudget?: number;
}

const formatPriceDisplay = (val: any): string => {
  if (val === null || val === undefined) return "N/A";
  let cleanVal = String(val);
  if (cleanVal.includes('₹') || cleanVal.toLowerCase().includes('lakh')) return cleanVal;
  const num = parseFloat(cleanVal.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return cleanVal;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
};

const AIPropertyImage = ({ title, address, type }: { title: string, address: string, type: string }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const RENT_PLACEHOLDERS = [
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop'
  ];

  const handleGenerate = async (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    setLoading(true);
    const prompt = `Beautiful interior of a ${type} rental home in ${address}. Bright, minimalist, 4k.`;
    const url = await generatePropertyImage(prompt);
    setImgUrl(url);
    setLoading(false);
  };

  const placeholder = RENT_PLACEHOLDERS[Math.abs(title.length) % RENT_PLACEHOLDERS.length];

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/5 bg-black/40 group mb-4">
      <img src={imgUrl || placeholder} alt={title} className={`w-full h-full object-cover transition-all duration-1000 ${!imgUrl ? 'opacity-30 grayscale group-hover:opacity-50' : 'opacity-100'}`} />
      {!imgUrl && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button onClick={handleGenerate} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase hover:scale-105 transition-all">
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} {loading ? 'SYNTHESIZING...' : 'AI PREVIEW'}
          </button>
        </div>
      )}
    </div>
  );
};

const RentDashboard: React.FC<RentDashboardProps> = ({ result, lang = 'EN', onAnalyzeFinance, userBudget }) => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'stats' | 'map'>('dashboard');
  const [isSearchingPincode, setIsSearchingPincode] = useState(false);
  const listings = result.listings || [];

  const fairValueNum = parsePrice(result.rentalValue);
  const isAboveBudget = userBudget && fairValueNum > userBudget * 1.1;

  useEffect(() => {
    const rentText = formatPriceDisplay(result.rentalValue);
    const speechText = lang === 'HI' 
      ? `आपके क्षेत्र के लिए अनुमानित किराया ${rentText} प्रति माह है।`
      : `The estimated rental value for your area is ${rentText} per month.`;
    speak(speechText, lang === 'HI' ? 'hi-IN' : 'en-IN');
  }, [result.rentalValue, lang]);

  const listingPrices = result.listings?.map(l => parsePrice(l.rent)) || [];
  const listingStats = calculateListingStats(listingPrices);

  const mapNodes = [
    { title: "Grounded Node", price: result.rentalValue, address: result.listings[0]?.address || "Selected Area", lat: result.listings[0]?.latitude, lng: result.listings[0]?.longitude, isSubject: true },
    ...(result.listings || []).slice(1).map(l => ({
      title: l.title,
      price: formatPriceDisplay(l.rent),
      address: l.address,
      lat: l.latitude,
      lng: l.longitude
    }))
  ];

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
      {isSearchingPincode && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 bg-emerald-500 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-neo-glow flex items-center gap-3 animate-bounce">
          <RefreshCw size={14} className="animate-spin" /> Updating rental indices...
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 rounded-2xl border border-emerald-500/20 text-emerald-500 shadow-sm">
            <Building2 size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Lease Analysis</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black opacity-60">Verified Valuation Node</p>
          </div>
        </div>
        
        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 overflow-x-auto scrollbar-hide no-pdf-export">
          <button onClick={() => setViewMode('dashboard')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 shrink-0 ${viewMode === 'dashboard' ? 'bg-emerald-500 text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>
            <LayoutGrid size={12} /> Live Deck
          </button>
          <button onClick={() => setViewMode('map')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 shrink-0 ${viewMode === 'map' ? 'bg-emerald-500 text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>
            <MapIcon size={12} /> Map View
          </button>
          <button onClick={() => setViewMode('stats')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 shrink-0 ${viewMode === 'stats' ? 'bg-emerald-500 text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>
            <BarChart3 size={12} /> Statistics
          </button>
        </div>
      </div>

      {viewMode === 'stats' && listingStats && <MarketStats stats={listingStats} prices={listingPrices} labelPrefix="Monthly Rent" />}
      {viewMode === 'map' && <GoogleMapView nodes={mapNodes} />}
      {viewMode === 'dashboard' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`bg-white/5 rounded-[32px] p-8 border shadow-glass-3d border-t-4 flex flex-col justify-between transition-all ${isAboveBudget ? 'border-t-neo-pink border-neo-pink/20' : 'border-t-emerald-500 border-white/10'}`}>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Receipt size={14} className={isAboveBudget ? 'text-neo-pink' : 'text-emerald-500'} />
                  <span className={`text-[10px] font-black uppercase tracking-widest block ${isAboveBudget ? 'text-neo-pink' : 'text-emerald-500'}`}>Est. Monthly Rent</span>
                </div>
                <div className="text-4xl font-black text-white tracking-tighter">
                  {formatPriceDisplay(result.rentalValue)}
                </div>
                <div className="mt-2 flex items-center gap-2">
                   {isAboveBudget ? (
                     <span className="px-3 py-1 bg-neo-pink/10 text-neo-pink text-[8px] font-black uppercase rounded-lg flex items-center gap-1.5 border border-neo-pink/20">
                       <AlertCircle size={10} /> Above Target
                     </span>
                   ) : (
                     <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase rounded-lg flex items-center gap-1.5 border border-emerald-500/20">
                       <CheckCircle size={10} /> Within Budget
                     </span>
                   )}
                </div>
              </div>
              {onAnalyzeFinance && (
                <button onClick={() => { setIsSearchingPincode(true); setTimeout(() => { onAnalyzeFinance(); setIsSearchingPincode(false); }, 800); }} className="mt-6 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all w-full flex items-center justify-center gap-2">
                  <TrendingUp size={12}/> Fiscal Simulator
                </button>
              )}
            </div>
            <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 shadow-glass-3d border-t-4 border-t-blue-500">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-2">Projected Yield</span>
              <div className="text-4xl font-black text-white tracking-tighter">{result.yieldPercentage || "3.5%"}</div>
              <p className="text-[9px] text-gray-500 mt-2 font-bold uppercase">Asset Efficiency Signal</p>
            </div>
            <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 shadow-glass-3d border-t-4 border-t-orange-500">
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block mb-2">Confidence Score</span>
              <div className="text-4xl font-black text-white tracking-tighter">{result.confidenceScore}%</div>
              <p className="text-[9px] text-gray-500 mt-2 font-bold uppercase">Grounding Probability</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 pb-10 scrollbar-hide">
            <div className="space-y-8">
              {(result.valuationJustification || result.notes) && (
                <div className={`bg-white/5 rounded-[32px] p-8 border border-white/10 border-l-4 shadow-glass-3d ${isAboveBudget ? 'border-l-neo-pink' : 'border-l-emerald-500'}`}>
                  <h3 className="text-xs font-black text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                    <Info size={18} className={isAboveBudget ? 'text-neo-pink' : 'text-emerald-500'} /> Market Context
                  </h3>
                  <p className="text-gray-300 leading-relaxed italic text-sm">"{result.valuationJustification} {result.notes}"</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {listings.map((item, idx) => {
                  const itemRent = parsePrice(item.rent);
                  const isMatch = userBudget && itemRent <= userBudget * 1.05;
                  
                  return (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-[32px] p-6 shadow-glass-3d hover:border-emerald-500/30 transition-all group relative overflow-hidden">
                      {isMatch && (
                        <div className="absolute top-6 right-6 z-10 px-3 py-1 bg-emerald-500 text-white text-[8px] font-black uppercase rounded-full shadow-neo-glow animate-in zoom-in">
                          Budget Match
                        </div>
                      )}
                      <AIPropertyImage title={item.title} address={item.address} type={item.bhk} />
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className="font-black text-white truncate uppercase">{item.title}</h4>
                          <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-1 font-bold uppercase tracking-widest truncate"><MapPin size={12}/> {item.address}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xl font-black text-emerald-500">{formatPriceDisplay(item.rent)}</div>
                        </div>
                      </div>
                      <a href={item.sourceUrl} target="_blank" rel="noopener" className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500 hover:border-emerald-500 transition-all">
                        Verify Source <ExternalLink size={14} />
                      </a>
                    </div>
                  );
                })}
              </div>

              {listings.length === 0 && !isSearchingPincode && (
                <div className="text-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10">
                   <Building2 size={48} className="mx-auto text-gray-600 mb-6 opacity-20" />
                   <p className="text-gray-500 font-black uppercase tracking-widest text-xs">No hyper-local listings found for this budget node.</p>
                   <p className="text-[10px] text-gray-600 uppercase mt-2">Try expanding search radius or adjusting budget parameters.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RentDashboard;
