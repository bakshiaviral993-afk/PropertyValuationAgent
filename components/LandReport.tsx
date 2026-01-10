
import React, { useState, useEffect, useRef } from 'react';
import { LandResult, LandListing, AppLang } from '../types';
import { Map, ExternalLink, Globe, LayoutDashboard, Map as MapIcon, Bookmark, ImageIcon, Loader2, Zap, Info, Calculator, BarChart3, HardHat, Gavel, Target, ShieldAlert, MessageSquare } from 'lucide-react';
import { generatePropertyImage } from '../services/geminiService';
import { speak } from '../services/voiceService';
import { parsePrice } from '../services/geminiService';

interface LandReportProps {
  result: LandResult;
  lang?: AppLang;
  onAnalyzeFinance?: (value: number) => void;
}

const formatPrice = (val: any): string => {
  if (val === null || val === undefined) return "";
  const str = String(val);
  const num = parseFloat(str.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return str;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
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
    const prompt = `Aerial real estate photograph of: ${type} land named ${title} located in ${address}`;
    const url = await generatePropertyImage(prompt);
    setImgUrl(url);
    setLoading(false);
  };

  const placeholderUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${title}&backgroundColor=13161B&shapeColor=FFAE42`;

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
            className="flex items-center gap-2 px-4 py-2 bg-orange-100 border border-orange-200 rounded-full text-orange-700 text-[10px] font-bold hover:bg-orange-500 hover:text-white transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />} 
            {loading ? 'GENERATING...' : 'AI PREVIEW'}
          </button>
        </div>
      )}
    </div>
  );
};

const DashboardMap = ({ listings = [] }: { listings?: LandListing[] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    const L = (window as any).L;
    if (!mapRef.current || !L) return;
    if (mapInstance.current) mapInstance.current.remove();
    const safeListings = listings || [];
    const avgLat = safeListings.length > 0 ? safeListings.reduce((acc, l) => acc + (l.latitude || 0), 0) / safeListings.length : 19.0760;
    const avgLng = safeListings.length > 0 ? safeListings.reduce((acc, l) => acc + (l.longitude || 0), 0) / safeListings.length : 72.8777;
    const map = L.map(mapRef.current, { zoomControl: false }).setView([avgLat, avgLng], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
    safeListings.forEach((item, idx) => {
      if (item.latitude && item.longitude) {
        L.marker([item.latitude, item.longitude]).addTo(map).bindTooltip(item.title);
      }
    });
    mapInstance.current = map;
    return () => { if (mapInstance.current) mapInstance.current.remove(); };
  }, [listings]);

  return (
    <div className="relative w-full h-[400px] rounded-3xl overflow-hidden border border-white/10 shadow-soft">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

const LandReport: React.FC<LandReportProps> = ({ result, lang = 'EN', onAnalyzeFinance }) => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'map'>('dashboard');
  const listings = result.listings || [];

  useEffect(() => {
    const landValue = result.landValue;
    let cleanVal = landValue;
    if (typeof landValue === 'object') {
      cleanVal = (landValue as any).value || (landValue as any).text || JSON.stringify(landValue);
    }
    const landText = formatPrice(cleanVal);
    const speechText = lang === 'HI' 
      ? `इस प्लॉट का अनुमानित बाजार मूल्य ${landText} है।`
      : `The estimated market value for this plot is ${landText}.`;
    speak(speechText, lang === 'HI' ? 'hi-IN' : 'en-IN');
  }, [result.landValue, lang]);

  const landValNum = parsePrice(result.landValue);
  const targetBid = landValNum * 0.90;
  const walkawayCap = landValNum * 1.12;

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-right-8 duration-1000 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-50 rounded-2xl">
            <Calculator size={24} className="text-orange-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Plot Valuation Node</h2>
            <p className="text-sm text-gray-500 font-black uppercase tracking-widest text-[9px]">Strict Grounding Engine</p>
          </div>
        </div>
        
        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 no-pdf-export">
          <button onClick={() => setViewMode('dashboard')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all tracking-widest ${viewMode === 'dashboard' ? 'bg-orange-500 text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>
            DASHBOARD
          </button>
          <button onClick={() => setViewMode('map')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all tracking-widest ${viewMode === 'map' ? 'bg-orange-500 text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>
            MAP VIEW
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-[32px] p-6 border border-white/10 shadow-glass-3d border-t-2 border-t-orange-500 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Total Fair Value</span>
            <div className="text-2xl font-black text-white">{formatPrice(result.landValue)}</div>
          </div>
          {onAnalyzeFinance && (
            <button 
              onClick={() => onAnalyzeFinance(landValNum)}
              className="mt-4 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-500 text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all w-full flex items-center justify-center gap-2"
            >
              <HardHat size={12} /> ROI Simulator
            </button>
          )}
        </div>
        <div className="bg-white/5 rounded-[32px] p-6 border border-white/10 shadow-glass-3d">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Rate Breakdown</span>
          <div className="text-xl font-black text-white">{result.perSqmValue}</div>
        </div>
        <div className="bg-white/5 rounded-[32px] p-6 border border-white/10 shadow-glass-3d">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Yield (Proj)</span>
          <div className="text-2xl font-black text-emerald-500">{result.devROI}</div>
        </div>
        <div className="bg-white/5 rounded-[32px] p-6 border border-white/10 shadow-glass-3d">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Confidence</span>
          <div className="text-2xl font-black text-white">{result.confidenceScore}%</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-10 scrollbar-hide">
        {viewMode === 'dashboard' ? (
          <div className="space-y-8">
            {/* NEW: Plot Acquisition Hub */}
            <div className="bg-neo-gold/5 border border-neo-gold/20 rounded-[48px] p-10 shadow-gold-glow">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-neo-gold/10 rounded-2xl text-neo-gold">
                    <Gavel size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Plot Acquisition Node</h3>
                    <p className="text-[10px] text-neo-gold font-black uppercase tracking-[0.4em]">Strategic_Bidding_Enabled</p>
                  </div>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                  <div className="flex-1 md:flex-none p-4 bg-neo-bg/50 border border-neo-gold/20 rounded-2xl">
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1">Aggressive Bid</span>
                    <div className="text-lg font-black text-neo-gold">{formatPrice(targetBid)}</div>
                  </div>
                  <div className="flex-1 md:flex-none p-4 bg-neo-bg/50 border border-neo-pink/20 rounded-2xl">
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1 text-neo-pink">Price Cap</span>
                    <div className="text-lg font-black text-neo-pink">{formatPrice(walkawayCap)}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-neo-gold">
                    <MessageSquare size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Tactical Strategy</span>
                  </div>
                  <div className="p-6 bg-black/40 border border-white/5 rounded-3xl text-sm text-gray-300 leading-relaxed italic">
                    "{result.negotiationStrategy || "Identify and highlight existing encumbrances or boundary complexities to justify the aggressive target bid."}"
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-neo-pink">
                    <ShieldAlert size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Acquisition Risks</span>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex gap-3 text-xs text-gray-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-neo-gold mt-1.5 shadow-gold-glow shrink-0" />
                      <span>{result.zoningAnalysis || "Mixed-use zoning profile"} suggests potential conversion delays. Price in the regulatory friction.</span>
                    </li>
                    <li className="flex gap-3 text-xs text-gray-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-neo-pink mt-1.5 shadow-pink-glow shrink-0" />
                      <span>Immediately abandon deal if per-sqft cost exceeds {formatPrice(walkawayCap / (landValNum/parsePrice(result.perSqmValue)))} due to ROI dilution.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 shadow-glass-3d border-l-4 border-l-orange-500">
              <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                <Zap size={18} className="text-orange-500" /> Grounded Justification
              </h3>
              <p className="text-gray-400 leading-relaxed italic text-sm">
                "{result.valuationJustification}"
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((item, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-[32px] p-6 shadow-glass-3d hover:border-orange-500/30 transition-all group">
                  <AIPropertyImage title={item.title} address={item.address} type="Plot" />
                  <div className="mb-4">
                    <h4 className="font-black text-white truncate">{item.title}</h4>
                    <p className="text-[10px] text-gray-500 truncate mt-1 font-bold uppercase tracking-widest">{item.address}</p>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-xl font-black text-orange-500">{formatPrice(item.price)}</span>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.size}</span>
                    </div>
                  </div>
                  <a href={item.sourceUrl} target="_blank" rel="noopener" className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-500 transition-all">
                    Verify Listing <ExternalLink size={14} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <DashboardMap listings={listings} />
        )}
      </div>
    </div>
  );
};

export default LandReport;
