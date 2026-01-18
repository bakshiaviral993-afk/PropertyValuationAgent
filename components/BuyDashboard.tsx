import React, { useState, useEffect } from 'react';
import { BuyResult, AppLang } from '../types';
import {
  MapPin, ExternalLink, Home, Loader2, BarChart3, LayoutGrid,
  Receipt, TrendingUp, RefreshCw, Sparkles, CheckCircle, AlertCircle, Map as MapIcon, Info, Plus
} from 'lucide-react';
import { generatePropertyImage, formatPrice } from '../services/geminiService';
import { speak } from '../services/voiceService';
import MarketStats from './MarketStats';
import { parsePrice, calculateListingStats } from '../utils/listingProcessor';
import GoogleMapView from './GoogleMapView';
import { getMoreListings } from '../services/valuationService';
// @ts-ignore
import confetti from 'canvas-confetti';
import MarketIntelligence from './MarketIntelligence';


interface BuyDashboardProps {
  result: BuyResult;
  lang?: AppLang;
  onAnalyzeFinance?: () => void;
  userBudget?: number;
  city: string;
  area: string;
}

const BuyDashboard: React.FC<BuyDashboardProps> = ({
  result,
  lang = 'EN',
  onAnalyzeFinance,
  userBudget,
  city,
  area
}) => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'stats' | 'map'>('dashboard');
  const [allListings, setAllListings] = useState(result.listings || []);
  const [isDeepScanning, setIsDeepScanning] = useState(false);

  useEffect(() => {
    setAllListings(result.listings || []);
  }, [result.listings]);

  const fairValueNum = parsePrice(result.fairValue);
  const isAboveBudget = userBudget && fairValueNum > userBudget * 1.1;

  useEffect(() => {
    const buyText = formatPrice(fairValueNum);
    const speechText = lang === 'HI'
      ? `आपके क्षेत्र के लिए उचित मूल्य ${buyText} है।`
      : `The fair market value for your area is ${buyText}.`;
    speak(speechText, lang === 'HI' ? 'hi-IN' : 'en-IN');
  }, [result.fairValue, lang]);

  const handleDeepScan = async () => {
    if (isDeepScanning) return;
    setIsDeepScanning(true);

    try {
      const more = await getMoreListings({
        city,
        area,
        propertyType: result.listings?.[0]?.bhk || 'Residential',
        size: 1100,
        mode: 'buy'
      });

      const formattedMore = more.map(l => ({
        title: l.project || "Property",
        price: formatPrice(parsePrice(l.price || l.totalPrice)),
        address: `${l.project}, ${area}, ${city}`,
        sourceUrl: 'https://www.99acres.com',
        bhk: result.listings?.[0]?.bhk || 'Residential',
        qualityScore: 8,
        latitude: l.latitude,
        longitude: l.longitude
      }));

      const uniqueNew = formattedMore.filter(nm => !allListings.some(al => al.title === nm.title));
      setAllListings(prev => [...prev, ...uniqueNew]);

      confetti({ particleCount: 100, spread: 50, origin: { y: 0.8 } });
    } catch (e) {
      console.error("Deep Scan Failed:", e);
    } finally {
      setIsDeepScanning(false);
    }
  };

  const listingPrices = allListings.map(l => parsePrice(l.price));
  const listingStats = calculateListingStats(listingPrices);

  const mapNodes = [
    { title: "Subject Property", price: result.fairValue, address: `${area}, ${city}`, lat: allListings[0]?.latitude || 18.52, lng: allListings[0]?.longitude || 73.86, isSubject: true },
    ...allListings.map(l => ({
      title: l.title,
      price: l.price,
      address: l.address,
      lat: l.latitude,
      lng: l.longitude
    }))
  ];

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-neo-neon/10 rounded-2xl text-neo-neon shadow-neo-glow">
            <Home size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Buy Analysis</h2>
            <p className="text-[10px] text-gray-500 uppercase font-black opacity-60">{area}, {city}</p>
          </div>
        </div>

        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 overflow-x-auto scrollbar-hide">
          <button onClick={() => setViewMode('dashboard')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === 'dashboard' ? 'bg-neo-neon text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>
            <LayoutGrid size={12} /> Deck
          </button>
          <button onClick={() => setViewMode('map')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === 'map' ? 'bg-neo-neon text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>
            <MapIcon size={12} /> Map
          </button>
          <button onClick={() => setViewMode('stats')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === 'stats' ? 'bg-neo-neon text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>
            <BarChart3 size={12} /> Stats
          </button>
        </div>
      </div>

      {viewMode === 'stats' && <MarketStats stats={listingStats} prices={listingPrices} labelPrefix="Price" />}
      {viewMode === 'map' && <GoogleMapView nodes={mapNodes} />}

      {viewMode === 'dashboard' && (
        <>
          {/* Your existing valuation cards – unchanged */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`bg-white/5 rounded-[32px] p-8 border shadow-glass-3d border-t-4 flex flex-col justify-between ${isAboveBudget ? 'border-t-neo-pink' : 'border-t-neo-neon'}`}>
              <div>
                <span className="text-[10px] font-black text-neo-neon uppercase block mb-1">Fair Value</span>
                <div className="text-4xl font-black text-white tracking-tighter">{result.fairValue}</div>
              </div>
              {onAnalyzeFinance && (
                <button onClick={onAnalyzeFinance} className="mt-6 px-4 py-2 rounded-xl bg-neo-neon/10 border border-neo-neon/30 text-neo-neon text-[10px] font-black uppercase tracking-widest hover:bg-neo-neon hover:text-white transition-all w-full flex items-center justify-center gap-2">
                  <TrendingUp size={12} /> Fiscal Simulator
                </button>
              )}
            </div>

            {/* ... your other two cards remain unchanged ... */}
          </div>

          {/* Added: Listings section – this was missing in rendering */}
          <div className="flex-1 overflow-y-auto pr-2 pb-10 scrollbar-hide">
            <div className="space-y-8">
              {/* Your existing justification/notes block – unchanged */}
            
              <MarketIntelligence result={result} accentColor="neo-neon" />
              {/* NEW: Listings grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allListings.length > 0 ? (
                  allListings.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white/5 border border-white/10 rounded-[32px] p-6 shadow-glass-3d hover:border-neo-neon/40 transition-all"
                    >
                      <h4 className="font-black text-white truncate">{item.title || 'Property'}</h4>
                      <p className="text-xl font-black text-neo-neon mt-2">{item.price || 'N/A'}</p>
                      <p className="text-sm text-gray-400 mt-1">{item.address || 'Location not available'}</p>
                      {item.latitude && item.longitude && (
                        <p className="text-xs text-gray-500 mt-1">
                          Lat: {item.latitude.toFixed(4)} | Lng: {item.longitude.toFixed(4)}
                        </p>
                      )}
                      {item.sourceUrl && (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener"
                          className="mt-4 inline-block px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neo-neon hover:text-white transition-all"
                        >
                          View Listing
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-20 text-gray-400 bg-white/5 rounded-[40px] border border-dashed border-white/10">
                    <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-bold text-lg">No listings found in fallback mode</p>
                    <p className="text-sm mt-2">Showing market estimate only. Try a more specific location.</p>
                  </div>
                )}
              </div>

              {/* Your existing deep scan button – unchanged */}
              {allListings.length > 0 && (
                <div className="flex flex-col items-center gap-6 py-10">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Extended Lease Network Detected</p>
                  <button
                    onClick={handleDeepScan}
                    disabled={isDeepScanning}
                    className="px-12 py-5 bg-white/5 border border-white/10 rounded-full text-xs font-black uppercase tracking-widest text-white hover:bg-neo-neon hover:border-neo-neon transition-all flex items-center gap-3 shadow-neo-glow group active:scale-95 disabled:opacity-50"
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

export default BuyDashboard;
