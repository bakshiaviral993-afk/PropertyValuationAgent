
import React, { useState, useEffect } from 'react';
import { RentResult, RentalListing, AppLang } from '../types';
import { 
  MapPin, ExternalLink, Building2, Loader2, BarChart3, LayoutGrid,
  Receipt, TrendingUp, RefreshCw, Sparkles, CheckCircle, AlertCircle, Map as MapIcon, Info, Plus
} from 'lucide-react';
import { generatePropertyImage, formatRent } from '../services/geminiService';
import { speak } from '../services/voiceService';
import MarketStats from './MarketStats';
import { parsePrice, calculateListingStats } from '../utils/listingProcessor';
import GoogleMapView from './GoogleMapView';
import { getMoreListings } from '../services/valuationService';
// @ts-ignore
import confetti from 'canvas-confetti';
import MarketIntelligence from './MarketIntelligence';


/* Define RentDashboardProps interface to fix "Cannot find name 'RentDashboardProps'" error */
interface RentDashboardProps {
  result: RentResult;
  lang?: AppLang;
  onAnalyzeFinance?: () => void;
  userBudget?: number;
}

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
  
  const [allListings, setAllListings] = useState<RentalListing[]>(result.listings || []);
  const [isDeepScanning, setIsDeepScanning] = useState(false);

  useEffect(() => {
    setAllListings(result.listings || []);
  }, [result.listings]);

  const fairValueNum = parsePrice(result.rentalValue);
  const isAboveBudget = userBudget && fairValueNum > userBudget * 1.1;

  useEffect(() => {
    const rentText = formatRent(fairValueNum);
    const speechText = lang === 'HI' 
      ? `आपके क्षेत्र के लिए अनुमानित किराया ${rentText} प्रति माह है।`
      : `The estimated rental value for your area is ${rentText} per month.`;
    speak(speechText, lang === 'HI' ? 'hi-IN' : 'en-IN');
  }, [result.rentalValue, lang]);

  const handleDeepScan = async () => {
    if (isDeepScanning) return;
    setIsDeepScanning(true);
    setIsSearchingPincode(true);
    
    try {
      const city = allListings[0]?.address?.split(',').pop()?.trim() || 'Unknown City';
      const area = allListings[0]?.address?.split(',')[0]?.trim() || '';
      
      const more = await getMoreListings({
        city,
        area,
        propertyType: allListings[0]?.bhk || 'Residential',
        size: 1100,
        mode: 'rent'
      });
      
      const formattedMore: RentalListing[] = more.map(l => ({
        title: l.project,
        rent: formatRent(parsePrice(l.monthlyRent || l.price)),
        address: `${l.project}, ${area}, ${city}`,
        sourceUrl: 'https://www.nobroker.in',
        bhk: allListings[0]?.bhk || 'Residential',
        qualityScore: 8,
        latitude: l.latitude,
        longitude: l.longitude,
        facing: 'Any'
      }));

      const uniqueNew = formattedMore.filter(nm => !allListings.some(al => al.title === nm.title));
      setAllListings(prev => [...prev, ...uniqueNew]);
      
      confetti({ particleCount: 100, spread: 50, origin: { y: 0.8 } });
    } catch (e) {
      console.error("Deep Scan Failed:", e);
    } finally {
      setIsDeepScanning(false);
      setIsSearchingPincode(false);
    }
  };

  const listingPrices = allListings.map(l => parsePrice(l.rent));
  const listingStats = calculateListingStats(listingPrices);

  const mapNodes = [
    { title: "Grounded Node", price: formatRent(fairValueNum), address: allListings[0]?.address || "Selected Area", lat: allListings[0]?.latitude, lng: allListings[0]?.longitude, isSubject: true },
    ...allListings.slice(1).map(l => ({
      title: l.title,
      price: formatRent(parsePrice(l.rent)),
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
                  {formatRent(fairValueNum)}
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
              {/* Market Intelligence */}
    <MarketIntelligence
      result={result}
      accentColor={isAboveBudget ? 'neo-pink' : 'emerald-500'}
    />


              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {allListings.map((item, idx) => {
                  const itemRentVal = parsePrice(item.rent);
                  const isMatch = userBudget && itemRentVal <= userBudget * 1.05;
                  
                  return (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-[32px] p-6 shadow-glass-3d hover:border-emerald-500/30 transition-all group relative overflow-hidden animate-in zoom-in duration-500">
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
                          <div className="text-xl font-black text-emerald-500">{formatRent(itemRentVal)}</div>
                        </div>
                      </div>
                      <a href={item.sourceUrl} target="_blank" rel="noopener" className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500 hover:border-emerald-500 transition-all">
                        Verify Source <ExternalLink size={14} />
                      </a>
                    </div>
                  );
                })}
              </div>

              {allListings.length > 0 && (
                <div className="flex flex-col items-center gap-6 py-10">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Extended Lease Network Detected</p>
                  <button 
                    onClick={handleDeepScan}
                    disabled={isDeepScanning}
                    className="px-12 py-5 bg-white/5 border border-white/10 rounded-full text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-500 hover:border-emerald-500 transition-all flex items-center gap-3 shadow-neo-glow group active:scale-95 disabled:opacity-50"
                  >
                    {isDeepScanning ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} className="group-hover:rotate-90 transition-transform" />}
                    {isDeepScanning ? 'Performing Deep Spatial Scan...' : 'See More Properties'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* Add default export to fix "Module 'file:///components/RentDashboard' has no default export" error */
export default RentDashboard;
