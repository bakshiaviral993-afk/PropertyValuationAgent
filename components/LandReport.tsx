// LandReport.tsx - Complete Bug Fixes Applied
import React, { useState, useEffect } from 'react';
import { LandResult, LandListing, AppLang } from '../types';
import { ExternalLink, Map as MapIcon, ImageIcon, Loader2, Zap, Info, Calculator, RefreshCw, TrendingUp, Plus, FileText, AlertCircle } from 'lucide-react';
import { generatePropertyImage } from '../services/geminiService';
import { speak } from '../services/voiceService';
import { parsePrice } from '../services/geminiService';
import GoogleMapView from './GoogleMapView';
import { getMoreListings } from '../services/valuationService';
import confetti from 'canvas-confetti';
import MarketIntelligence from './MarketIntelligence';
import ValuationReport from './ValuationReport';
import RealTimeNews from './RealTimeNews';

interface LandReportProps {
  result: LandResult;
  lang?: AppLang;
  onAnalyzeFinance?: (value: number) => void;
  city?: string;
  area?: string;
  pincode?: string;
  userInput?: {
    plotSize?: number;
    facing?: string;
  };
}

type ViewMode = 'dashboard' | 'map' | 'report';

const formatPrice = (val: any): string => {
  if (val === null || val === undefined) return "";
  const str = String(val);
  const num = parseFloat(str.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return str;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
};

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

const enrichLandListing = (listing: any, area: string, city: string, pincode: string, userPlotSize: number) => {
  const actualSize = listing.size_sqyd || listing.plotSize || userPlotSize;
  const priceNum = parsePrice(listing.price);
  const pricePerSqyd = actualSize && priceNum > 0 
    ? `₹${Math.round(priceNum / actualSize).toLocaleString('en-IN')}/sq.yd.`
    : null;
  
  return {
    ...listing,
    fullAddress: formatFullAddress(listing, area, city, pincode),
    actualSize,
    sizeDisplay: listing.size_sqyd 
      ? `${listing.size_sqyd} sq.yd.` 
      : `~${userPlotSize} sq.yd.`,
    pricePerSqyd,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatFullAddress(listing, area, city, pincode))}`
  };
};

const AIPropertyImage = ({ title, address, type }: { title: string, address: string, type: string }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    setLoading(true);
    const prompt = `Aerial photograph of: ${type} land named ${title} in ${address}`;
    const url = await generatePropertyImage(prompt);
    setImgUrl(url);
    setLoading(false);
  };

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/5 bg-black/40 group mb-4">
      <img src={imgUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${title}`} alt={title} className={`w-full h-full object-cover transition-all ${imgUrl ? 'opacity-100' : 'opacity-20 grayscale'}`} />
      {!imgUrl && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button onClick={handleGenerate} disabled={loading} className="px-4 py-2 bg-orange-500 text-white rounded-full text-[10px] font-black uppercase hover:bg-orange-600 transition-all">
            {loading ? <Loader2 size={12} className="animate-spin" /> : 'AI REVIEW'}
          </button>
        </div>
      )}
    </div>
  );
};

const LandReport: React.FC<LandReportProps> = ({ 
  result, 
  lang = 'EN', 
  onAnalyzeFinance,
  city = '',
  area = '',
  pincode = '',
  userInput
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [isSearchingPincode, setIsSearchingPincode] = useState(false);
  const [allListings, setAllListings] = useState<LandListing[]>(result.listings || []);
  const [isDeepScanning, setIsDeepScanning] = useState(false);

  const userPlotSize = userInput?.plotSize || 1000;
  const extractedCity = city || allListings[0]?.address?.split(',').pop()?.trim() || 'Unknown City';
  const extractedArea = area || allListings[0]?.address?.split(',')[0]?.trim() || '';

  useEffect(() => {
    const enriched = (result.listings || []).map(l => 
      enrichLandListing(l, extractedArea, extractedCity, pincode, userPlotSize)
    );
    setAllListings(enriched);
  }, [result.listings, userPlotSize]);

  useEffect(() => {
    const landValueStr = typeof result.landValue === 'string' ? result.landValue : formatPrice(result.landValue);
    const speechText = lang === 'HI' ? `प्लॉट का मूल्य ${landValueStr} है।` : `The plot's market value is ${landValueStr}.`;
    speak(speechText, lang === 'HI' ? 'hi-IN' : 'en-IN');
  }, [result.landValue, lang]);

  const handleDeepScan = async () => {
    if (isDeepScanning) return;
    setIsDeepScanning(true);
    setIsSearchingPincode(true);
    
    try {
      const more = await getMoreListings({
        city: extractedCity,
        area: extractedArea,
        propertyType: 'Plot',
        size: userPlotSize,
        mode: 'land'
      });
      
      const formattedMore = more.map(l => enrichLandListing({
        title: l.project || "Land Parcel",
        price: formatPrice(l.totalPrice || l.price),
        size: `${l.size_sqyd || userPlotSize} sqyd`,
        address: l.address || '',
        sourceUrl: l.url || 'https://www.99acres.com',
        latitude: l.latitude,
        longitude: l.longitude,
        facing: userInput?.facing || 'East',
        size_sqyd: l.size_sqyd,
        locality: l.locality
      }, extractedArea, extractedCity, pincode, userPlotSize));

      const uniqueNew = formattedMore.filter(nm => !allListings.some(al => al.title === nm.title));
      setAllListings(prev => [...prev, ...uniqueNew]);
      
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.8 } });
    } catch (e) {
      console.error("Land Deep Scan Failed:", e);
    } finally {
      setIsDeepScanning(false);
      setIsSearchingPincode(false);
    }
  };

  const mapNodes = allListings.map((l, i) => ({
    title: l.title,
    price: l.price,
    address: l.fullAddress || l.address,
    lat: l.latitude,
    lng: l.longitude,
    isSubject: i === 0,
    sqft: l.actualSize,
    pricePerSqft: l.pricePerSqyd
  }));

  const fairValueNum = parsePrice(result.landValue);

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-right-8 duration-1000 pb-20">
      {isSearchingPincode && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 bg-orange-500 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-neo-glow flex items-center gap-3 animate-bounce">
          <RefreshCw size={14} className="animate-spin" /> Deep land registry scan in progress...
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-50 rounded-2xl">
            <Calculator size={24} className="text-orange-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Plot Valuation Node</h2>
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Strict Grounding Engine</p>
          </div>
        </div>
        
        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 no-pdf-export overflow-x-auto scrollbar-hide">
          <button onClick={() => setViewMode('dashboard')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest shrink-0 ${viewMode === 'dashboard' ? 'bg-orange-500 text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>
            DASHBOARD
          </button>
          <button onClick={() => setViewMode('map')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest shrink-0 ${viewMode === 'map' ? 'bg-orange-500 text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>
            MAP VIEW
          </button>
          <button onClick={() => setViewMode('report')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest shrink-0 ${viewMode === 'report' ? 'bg-orange-500 text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>
            REPORT
          </button>
        </div>
      </div>

      {viewMode === 'map' && <GoogleMapView nodes={mapNodes} />}
      
      {viewMode === 'report' && (
        <ValuationReport 
          mode="land"
          result={result}
          city={extractedCity}
          area={extractedArea}
          pincode={pincode}
          userInput={userInput}
        />
      )}

      {viewMode === 'dashboard' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-[32px] p-6 border border-white/10 border-t-2 border-t-orange-500 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">Total Fair Value</span>
                <div className="text-2xl font-black text-white">{typeof result.landValue === 'string' ? result.landValue : formatPrice(result.landValue)}</div>
              </div>
              {onAnalyzeFinance && (
                <button onClick={() => { setIsSearchingPincode(true); setTimeout(() => { onAnalyzeFinance(parsePrice(result.landValue)); setIsSearchingPincode(false); }, 800); }} className="mt-4 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[8px] font-black uppercase flex items-center gap-2 hover:bg-orange-500 hover:text-white transition-all">
                  <TrendingUp size={10}/> Simulator
                </button>
              )}
            </div>
            <div className="bg-white/5 rounded-[32px] p-6 border border-white/10">
              <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">Rate Breakdown</span>
              <div className="text-xl font-black text-white">{result.perSqmValue}</div>
            </div>
            <div className="bg-white/5 rounded-[32px] p-6 border border-white/10">
              <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">Yield (Proj)</span>
              <div className="text-2xl font-black text-emerald-500">{result.devROI}</div>
            </div>
            <div className="bg-white/5 rounded-[32px] p-6 border border-white/10">
              <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">Confidence</span>
              <div className="text-2xl font-black text-white">{result.confidenceScore}%</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-10 scrollbar-hide">
            <div className="space-y-8">
              <MarketIntelligence result={result} accentColor="orange-500" />

              {/* Real-time News */}
              <RealTimeNews city={extractedCity} area={extractedArea} mode="land" />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allListings.map((item, idx) => {
                  const fullAddress = item.fullAddress || formatFullAddress(item, extractedArea, extractedCity, pincode);
                  const mapsUrl = item.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
                  
                  return (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-[32px] p-6 group shadow-glass-3d animate-in fade-in zoom-in duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                      <AIPropertyImage title={item.title} address={fullAddress} type="Plot" />
                      <div className="mb-4">
                        <h4 className="font-black text-white truncate uppercase">{item.title}</h4>
                        
                        {item.actualSize && (
                          <p className="text-sm text-blue-400 font-bold mt-1">
                            {item.sizeDisplay}
                          </p>
                        )}
                        
                        <p className="text-xl font-black text-orange-500 mt-2">
                          {typeof item.price === 'string' ? item.price : formatPrice(item.price)}
                        </p>
                        
                        {item.pricePerSqyd && (
                          <p className="text-xs text-gray-400 mt-1">{item.pricePerSqyd}</p>
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
                      </div>
                      <a href={item.sourceUrl} target="_blank" rel="noopener" className="w-full py-4 rounded-2xl bg-white/5 text-white text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-orange-500 transition-all border border-white/10">Verify Listing <ExternalLink size={14} /></a>
                    </div>
                  );
                })}
              </div>

              {allListings.length > 0 && (
                <div className="flex flex-col items-center gap-6 py-10">
                  <div className="flex items-center gap-2 mb-2">
                     <div className="h-1 w-20 bg-gradient-to-r from-transparent to-orange-500/20" />
                     <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Extended Land Registry Network</p>
                     <div className="h-1 w-20 bg-gradient-to-l from-transparent to-orange-500/20" />
                  </div>
                  <button 
                    onClick={handleDeepScan}
                    disabled={isDeepScanning}
                    className="px-12 py-5 bg-white/5 border border-white/10 rounded-full text-xs font-black uppercase tracking-widest text-white hover:bg-orange-500 hover:border-orange-500 transition-all flex items-center gap-3 shadow-neo-glow group active:scale-95 disabled:opacity-50"
                  >
                    {isDeepScanning ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} className="group-hover:rotate-90 transition-transform" />}
                    {isDeepScanning ? 'Syncing Land Registries...' : 'Load All Available Plots & Parcels'}
                  </button>
                </div>
              )}

              {allListings.length === 0 && !isSearchingPincode && (
                <div className="text-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10">
                   <MapIcon size={48} className="mx-auto text-gray-600 mb-6 opacity-20" />
                   <p className="text-gray-500 font-black uppercase tracking-widest text-xs">No active land listings detected in this micro-market.</p>
                   <p className="text-sm mt-4 font-bold">Estimated market range: {formatPrice(fairValueNum * 0.8)} - {formatPrice(fairValueNum * 1.2)}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LandReport;
