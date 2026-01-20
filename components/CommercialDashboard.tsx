// CommercialDashboard.tsx - With All Bug Fixes Applied
import React, { useState, useEffect } from 'react';
import { CommercialResult, AppLang } from '../types';
import {
  MapPin, ExternalLink, Building, Loader2, BarChart3, LayoutGrid,
  TrendingUp, Plus, FileText, AlertCircle, Briefcase
} from 'lucide-react';
import { formatPrice } from '../services/geminiService';
import { speak } from '../services/voiceService';
import MarketStats from './MarketStats';
import { parsePrice, calculateListingStats } from '../utils/listingProcessor';
import GoogleMapView from './GoogleMapView';
import { getMoreListings } from '../services/valuationService';
import confetti from 'canvas-confetti';
import MarketIntelligence from './MarketIntelligence';
import ValuationReport from './ValuationReport';
import RealTimeNews from './RealTimeNews';

interface CommercialDashboardProps {
  result: CommercialResult;
  lang?: AppLang;
  onAnalyzeFinance?: () => void;
  city: string;
  area: string;
  pincode?: string;
  userInput?: {
    type?: string;
    sqft?: number;
  };
}

type ViewMode = 'dashboard' | 'stats' | 'map' | 'report';

const formatFullAddress = (listing: any, area: string, city: string, pincode: string): string => {
  const parts = [];
  
  if (listing.project || listing.title) {
    parts.push(listing.project || listing.title);
  }
  
  if (listing.locality && listing.locality !== area) {
    parts.push(listing.locality);
  }
  
  if (area) parts.push(area);
  if (city) parts.push(city);
  if (pincode) parts.push(`PIN: ${pincode}`);
  
  const uniqueParts = [...new Set(parts.filter(p => p && p.trim()))];
  return uniqueParts.join(', ');
};

const enrichListingData = (listing: any, userSqft: number) => {
  const actualSqft = listing.builtUpArea || listing.carpetArea || listing.superArea || userSqft;
  const priceNum = parsePrice(listing.price);
  const pricePerSqft = actualSqft && priceNum > 0 
    ? `₹${Math.round(priceNum / actualSqft).toLocaleString('en-IN')}/sq.ft.`
    : null;
  
  return {
    ...listing,
    actualSqft,
    sqftDisplay: listing.builtUpArea 
      ? `${listing.builtUpArea} sq.ft. (Built-up)` 
      : listing.carpetArea 
        ? `${listing.carpetArea} sq.ft. (Carpet)` 
        : listing.superArea
          ? `${listing.superArea} sq.ft. (Super)`
          : `~${userSqft} sq.ft.`,
    pricePerSqft
  };
};

const CommercialDashboard: React.FC<CommercialDashboardProps> = ({
  result,
  lang = 'EN',
  onAnalyzeFinance,
  city,
  area,
  pincode = '',
  userInput
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [allListings, setAllListings] = useState(result.listings || []);
  const [isDeepScanning, setIsDeepScanning] = useState(false);

  const userSqft = userInput?.sqft || 2000;

  useEffect(() => {
    const enriched = (result.listings || []).map(l => enrichListingData(l, userSqft));
    setAllListings(enriched);
  }, [result.listings, userSqft]);

  const commercialValueNum = parsePrice(result.businessInsights || result.fairValue);

  useEffect(() => {
    const valueText = formatPrice(commercialValueNum);
    const speechText = lang === 'HI'
      ? `व्यावसायिक संपत्ति का मूल्य ${valueText} है।`
      : `The commercial property value is ${valueText}.`;
    speak(speechText, lang === 'HI' ? 'hi-IN' : 'en-IN');
  }, [result.businessInsights, lang]);

  const handleDeepScan = async () => {
    if (isDeepScanning) return;
    setIsDeepScanning(true);

    try {
      const more = await getMoreListings({
        city,
        area,
        propertyType: userInput?.type || 'Commercial',
        size: userSqft,
        mode: 'commercial'
      });

      const formattedMore = more.map(l => enrichListingData({
        title: l.project || "Commercial Property",
        price: formatPrice(parsePrice(l.price || l.totalPrice)),
        address: formatFullAddress(l, area, city, pincode),
        sourceUrl: l.url || 'https://www.99acres.com',
        type: userInput?.type || 'Commercial',
        qualityScore: 8,
        latitude: l.latitude,
        longitude: l.longitude,
        builtUpArea: l.builtUpArea,
        carpetArea: l.carpetArea,
        locality: l.locality
      }, userSqft));

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
    {
      title: "Your Commercial Property",
      price: result.businessInsights || result.fairValue,
      address: `${area}, ${city}${pincode ? ', PIN: ' + pincode : ''}`,
      lat: allListings[0]?.latitude || 18.52,
      lng: allListings[0]?.longitude || 73.86,
      isSubject: true
    },
    ...allListings.map(l => ({
      title: l.title,
      price: l.price,
      address: formatFullAddress(l, area, city, pincode),
      lat: l.latitude,
      lng: l.longitude,
      sqft: l.actualSqft,
      pricePerSqft: l.pricePerSqft
    }))
  ];

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 shadow-lg">
            <Briefcase size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Commercial Analysis</h2>
            <p className="text-[10px] text-gray-500 uppercase font-black opacity-60">{area}, {city}</p>
          </div>
        </div>

        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 overflow-x-auto scrollbar-hide">
          <button onClick={() => setViewMode('dashboard')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === 'dashboard' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
            <LayoutGrid size={12} /> Deck
          </button>
          <button onClick={() => setViewMode('map')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === 'map' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
            <MapPin size={12} /> Map
          </button>
          <button onClick={() => setViewMode('stats')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === 'stats' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
            <BarChart3 size={12} /> Stats
          </button>
          <button onClick={() => setViewMode('report')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === 'report' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
            <FileText size={12} /> Report
          </button>
        </div>
      </div>

      {viewMode === 'stats' && <MarketStats stats={listingStats} prices={listingPrices} labelPrefix="Price" />}
      {viewMode === 'map' && <GoogleMapView nodes={mapNodes} />}
      {viewMode === 'report' && (
        <ValuationReport 
          mode="commercial"
          result={result}
          city={city}
          area={area}
          pincode={pincode}
          userInput={userInput}
        />
      )}

      {viewMode === 'dashboard' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 rounded-[32px] p-8 border shadow-glass-3d border-t-4 border-t-emerald-500 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-emerald-500 uppercase block mb-1">Fair Market Value</span>
                <div className="text-4xl font-black text-white tracking-tighter">{result.businessInsights || result.fairValue}</div>
              </div>
              {onAnalyzeFinance && (
                <button onClick={onAnalyzeFinance} className="mt-6 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all w-full flex items-center justify-center gap-2">
                  <TrendingUp size={12} /> ROI Calculator
                </button>
              )}
            </div>

            <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 shadow-glass-3d">
              <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">Property Type</span>
              <div className="text-2xl font-black text-white tracking-tighter">{userInput?.type || 'Commercial'}</div>
            </div>

            <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 shadow-glass-3d">
              <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">Listings Found</span>
              <div className="text-4xl font-black text-white tracking-tighter">{allListings.length}</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 pb-10 scrollbar-hide">
            <div className="space-y-8">
              <MarketIntelligence result={result} accentColor="emerald-500" />

              {/* Real-time News */}
              <RealTimeNews city={city} area={area} mode="commercial" />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allListings.length > 0 ? (
                  allListings.map((item, idx) => {
                    const fullAddress = formatFullAddress(item, area, city, pincode);
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
                    
                    return (
                      <div
                        key={idx}
                        className="bg-white/5 border border-white/10 rounded-[32px] p-6 shadow-glass-3d hover:border-emerald-500/40 transition-all"
                      >
                        <h4 className="font-black text-white truncate">{item.title || 'Commercial Property'}</h4>
                        
                        {item.actualSqft && (
                          <p className="text-sm text-blue-400 font-bold mt-1">
                            {item.sqftDisplay}
                          </p>
                        )}
                        
                        <p className="text-xl font-black text-emerald-500 mt-2">{item.price || 'N/A'}</p>
                        
                        {item.pricePerSqft && (
                          <p className="text-xs text-gray-400 mt-1">{item.pricePerSqft}</p>
                        )}
                        
                        <a 
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-400 hover:text-blue-400 transition-colors mt-2 block underline decoration-dotted cursor-pointer line-clamp-2"
                          title="View on Google Maps"
                        >
                          📍 {fullAddress}
                        </a>
                        
                        {item.latitude && item.longitude && (
                          <p className="text-xs text-gray-500 mt-1">
                            Lat: {item.latitude.toFixed(4)} | Lng: {item.longitude.toFixed(4)}
                          </p>
                        )}
                        
                        {item.sourceUrl && (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-block px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
                          >
                            View Full Listing →
                          </a>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-20 text-gray-400 bg-white/5 rounded-[40px] border border-dashed border-white/10">
                    <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-bold text-lg">No commercial listings found</p>
                    <p className="text-sm mt-2">Showing market estimate only. Try a more specific location.</p>
                    <p className="text-sm mt-4 font-bold">Estimated range: {formatPrice(commercialValueNum * 0.8)} - {formatPrice(commercialValueNum * 1.2)}</p>
                  </div>
                )}
              </div>

              {allListings.length > 0 && (
                <div className="flex flex-col items-center gap-6 py-10">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Extended Commercial Network Detected</p>
                  <button
                    onClick={handleDeepScan}
                    disabled={isDeepScanning}
                    className="px-12 py-5 bg-white/5 border border-white/10 rounded-full text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-500 hover:border-emerald-500 transition-all flex items-center gap-3 shadow-lg group active:scale-95 disabled:opacity-50"
                  >
                    {isDeepScanning ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} className="group-hover:rotate-90 transition-transform" />}
                    {isDeepScanning ? 'Scanning Commercial Market...' : 'See More Properties'}
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

export default CommercialDashboard;
