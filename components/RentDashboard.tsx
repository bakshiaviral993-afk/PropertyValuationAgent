
import React, { useState, useEffect, useRef } from 'react';
import { RentResult, RentalListing, AppLang } from '../types';
import { 
  MapPin, ExternalLink, Globe, Info, Layers, Building2, ImageIcon, Loader2, BarChart3, LayoutGrid,
  Receipt, Wallet, TrendingUp, Gavel, Target, ShieldAlert, MessageSquare
} from 'lucide-react';
import { generatePropertyImage } from '../services/geminiService';
import { speak } from '../services/voiceService';
import MarketStats from './MarketStats';
import { parsePrice, calculateListingStats } from '../utils/listingProcessor';

interface RentDashboardProps {
  result: RentResult;
  lang?: AppLang;
  onAnalyzeFinance?: () => void;
}

const formatPriceDisplay = (val: any): string => {
  if (val === null || val === undefined) return "N/A";
  let cleanVal = val;
  if (typeof val === 'object') {
    cleanVal = val.value || val.text || JSON.stringify(val);
  } else {
    cleanVal = String(val);
  }
  if (cleanVal.includes('₹') || cleanVal.toLowerCase().includes('lakh')) return cleanVal;
  const num = parseFloat(cleanVal.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return cleanVal;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
};

const AIPropertyImage = ({ title, address, type }: { title: string, address: string, type: string }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setLoading(true);
    const prompt = `${type} rental property named ${title} located in ${address}`;
    const url = await generatePropertyImage(prompt);
    setImgUrl(url);
    setLoading(false);
  };

  const placeholderUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${title}&backgroundColor=13161B&shapeColor=B4FF5C`;

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/5 bg-black/40 group mb-4">
      <img 
        src={imgUrl || placeholderUrl} 
        alt={title}
        className={`w-full h-full object-cover transition-all duration-700 ${imgUrl ? 'scale-100' : 'scale-50 opacity-30 grayscale'}`}
      />
      {!imgUrl && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-100 border border-emerald-200 rounded-full text-emerald-700 text-[10px] font-bold hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />} 
            {loading ? 'GENERATING...' : 'AI PREVIEW'}
          </button>
        </div>
      )}
    </div>
  );
};

const DashboardMap = ({ listings = [] }: { listings?: RentalListing[] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [layerType, setLayerType] = useState<'map' | 'sat'>('map');
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    const L = (window as any).L;
    if (!mapRef.current || !L) return;
    if (mapInstance.current) mapInstance.current.remove();
    const safeListings = listings || [];
    const avgLat = safeListings.length > 0 ? safeListings.reduce((acc, l) => acc + (l.latitude || 0), 0) / safeListings.length : 19.0760;
    const avgLng = safeListings.length > 0 ? safeListings.reduce((acc, l) => acc + (l.longitude || 0), 0) / safeListings.length : 72.8777;
    const map = L.map(mapRef.current, { zoomControl: false }).setView([avgLat, avgLng], 13);
    const tileUrl = layerType === 'map' ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    L.tileLayer(tileUrl).addTo(map);
    safeListings.forEach((item, idx) => {
      if (item.latitude && item.longitude) {
        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white font-bold shadow-lg">${idx + 1}</div>`,
          iconSize: [32, 32]
        });
        L.marker([item.latitude, item.longitude], { icon }).addTo(map).bindTooltip(item.title);
      }
    });
    mapInstance.current = map;
    return () => { if (mapInstance.current) mapInstance.current.remove(); };
  }, [listings, layerType]);

  return (
    <div className="relative w-full h-[400px] rounded-3xl overflow-hidden border border-white/10 shadow-soft">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

const RentDashboard: React.FC<RentDashboardProps> = ({ result, lang = 'EN', onAnalyzeFinance }) => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'map' | 'stats'>('dashboard');
  const listings = result.listings || [];

  useEffect(() => {
    const rentText = formatPriceDisplay(result.rentalValue);
    const speechText = lang === 'HI' 
      ? `आपके क्षेत्र के लिए अनुमानित किराया ${rentText} प्रति माह है।`
      : `The estimated rental value for your area is ${rentText} per month.`;
    speak(speechText, lang === 'HI' ? 'hi-IN' : 'en-IN');
  }, [result.rentalValue, lang]);

  const listingPrices = result.listings?.map(l => parsePrice(l.rent)) || [];
  const listingStats = calculateListingStats(listingPrices);
  const displayConfidence = result.confidenceScore < 1 ? Math.round(result.confidenceScore * 100) : result.confidenceScore;

  const rentValueNum = parsePrice(result.rentalValue);
  const targetRent = rentValueNum * 0.92;
  const walkawayRent = rentValueNum * 1.10;

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 rounded-2xl">
            <Building2 size={24} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Rental Intel</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black opacity-60">Verified Valuation Node</p>
          </div>
        </div>
        
        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 no-pdf-export">
          <button onClick={() => setViewMode('dashboard')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === 'dashboard' ? 'bg-emerald-500 text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>
            <LayoutGrid size={12} /> Dashboard
          </button>
          <button onClick={() => setViewMode('stats')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === 'stats' ? 'bg-emerald-500 text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>
            <BarChart3 size={12} /> Stats
          </button>
          <button onClick={() => setViewMode('map')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === 'map' ? 'bg-emerald-500 text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>
            <Globe size={12} /> Map
          </button>
        </div>
      </div>

      {viewMode === 'stats' && listingStats ? (
        <MarketStats stats={listingStats} prices={listingPrices} labelPrefix="Monthly Rent" />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 shadow-glass-3d border-t-2 border-t-emerald-500 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Receipt size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">Monthly Rent</span>
                </div>
                <div className="text-4xl font-black text-white tracking-tighter">
                  {formatPriceDisplay(result.rentalValue)}
                </div>
              </div>
              {onAnalyzeFinance && (
                <button 
                  onClick={onAnalyzeFinance}
                  className="mt-6 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all w-full flex items-center justify-center gap-2"
                >
                  <TrendingUp size={12}/> Fiscal Simulator
                </button>
              )}
            </div>
            <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 shadow-glass-3d border-t-2 border-t-blue-500">
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={14} className="text-blue-500" />
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block">Projected Yield</span>
              </div>
              <div className="text-4xl font-black text-white tracking-tighter">
                {formatPriceDisplay(result.yieldPercentage || "3.5%")}
              </div>
            </div>
            <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 shadow-glass-3d border-t-2 border-t-orange-500">
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block mb-2">Confidence</span>
              <div className="text-4xl font-black text-white tracking-tighter">
                {displayConfidence}%
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 pb-10 scrollbar-hide">
            {viewMode === 'dashboard' ? (
              <div className="space-y-8">
                {/* NEW: Lease Negotiation Hub */}
                <div className="bg-neo-gold/5 border border-neo-gold/20 rounded-[48px] p-10 shadow-gold-glow">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-neo-gold/10 rounded-2xl text-neo-gold">
                        <Target size={28} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Lease Negotiation</h3>
                        <p className="text-[10px] text-neo-gold font-black uppercase tracking-[0.4em]">Leasehold_Optimization</p>
                      </div>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                      <div className="flex-1 md:flex-none p-4 bg-neo-bg/50 border border-neo-gold/20 rounded-2xl">
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1">Neural Bid</span>
                        <div className="text-lg font-black text-neo-gold">₹{Math.round(targetRent).toLocaleString()}/mo</div>
                      </div>
                      <div className="flex-1 md:flex-none p-4 bg-neo-bg/50 border border-neo-pink/20 rounded-2xl">
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1 text-neo-pink">Ceiling</span>
                        <div className="text-lg font-black text-neo-pink">₹{Math.round(walkawayRent).toLocaleString()}/mo</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-neo-gold">
                        <MessageSquare size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Lease Script</span>
                      </div>
                      <div className="p-6 bg-black/40 border border-white/5 rounded-3xl text-sm text-gray-300 leading-relaxed italic">
                        "{result.negotiationScript || "Leverage the area's current vacancy rates and tenant demand scores to anchor your offer below asking."}"
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-neo-pink">
                        <ShieldAlert size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Exit Triggers</span>
                      </div>
                      <ul className="space-y-3">
                        <li className="flex gap-3 text-xs text-gray-400">
                          <div className="w-1.5 h-1.5 rounded-full bg-neo-gold mt-1.5 shadow-gold-glow shrink-0" />
                          <span>Avoid lock-ins exceeding 11 months unless yield is protected via a rent-free fit-out period.</span>
                        </li>
                        <li className="flex gap-3 text-xs text-gray-400">
                          <div className="w-1.5 h-1.5 rounded-full bg-neo-pink mt-1.5 shadow-pink-glow shrink-0" />
                          <span>Walk away if deposit exceeds 6 months or maintenance inclusive exceeds ₹{Math.round(walkawayRent * 1.05).toLocaleString()}.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 shadow-glass-3d border-l-4 border-l-emerald-500">
                  <h3 className="text-xs font-black text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                    <Info size={18} className="text-emerald-500" /> Market Reasoning
                  </h3>
                  <p className="text-gray-300 leading-relaxed italic text-sm">
                    "{formatPriceDisplay(result.valuationJustification) || "Awaiting specific market grounding signals for this locality."}"
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {listings.map((item, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-[32px] p-6 shadow-glass-3d hover:border-emerald-500/30 transition-all group">
                      <AIPropertyImage title={item.title} address={item.address} type={item.bhk} />
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className="font-black text-white truncate">{item.title}</h4>
                          <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-1 font-bold uppercase tracking-widest truncate"><MapPin size={12}/> {item.address}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xl font-black text-emerald-500">{formatPriceDisplay(item.rent)}</div>
                          <div className="text-[8px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1">Grounding_Verified</div>
                        </div>
                      </div>
                      <a href={item.sourceUrl} target="_blank" rel="noopener" className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500 hover:border-emerald-500 transition-all">
                        Verify Source <ExternalLink size={14} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <DashboardMap listings={listings} />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default RentDashboard;
