
import React, { useState, useEffect, useRef } from 'react';
import { LandResult, LandListing, AppLang } from '../types';
import { Map, ExternalLink, Globe, LayoutDashboard, Map as MapIcon, Bookmark, ImageIcon, Loader2, Zap, Info } from 'lucide-react';
import { generatePropertyImage } from '../services/geminiService';
import { speak } from '../services/voiceService';

interface LandReportProps {
  result: LandResult;
  lang?: AppLang;
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

const LandReport: React.FC<LandReportProps> = ({ result, lang = 'EN' }) => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'map'>('dashboard');
  const listings = result.listings || [];

  useEffect(() => {
    const landText = formatPrice(result.landValue);
    const speechText = lang === 'HI' 
      ? `इस प्लॉट का अनुमानित बाजार मूल्य ${landText} है।`
      : `The estimated market value for this plot is ${landText}.`;
    
    speak(speechText, lang === 'HI' ? 'hi-IN' : 'en-IN');
  }, [result.landValue, lang]);

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-right-8 duration-1000">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-50 rounded-2xl">
            <Map size={24} className="text-orange-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Land Intel</h2>
            <p className="text-sm text-gray-500 font-black uppercase tracking-widest text-[9px]">ROI-Focused Plot Analysis</p>
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
        <div className="bg-white/5 rounded-[32px] p-6 border border-white/10 shadow-glass-3d">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Total Valuation</span>
          <div className="text-2xl font-black text-white">{formatPrice(result.landValue)}</div>
        </div>
        <div className="bg-white/5 rounded-[32px] p-6 border border-white/10 shadow-glass-3d">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Per Sqm</span>
          <div className="text-2xl font-black text-white">{formatPrice(result.perSqmValue)}</div>
        </div>
        <div className="bg-white/5 rounded-[32px] p-6 border border-white/10 shadow-glass-3d">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Dev ROI</span>
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
            <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 shadow-glass-3d border-l-4 border-l-orange-500">
              <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                <Zap size={18} className="text-orange-500" /> Strategic Analysis
              </h3>
              <p className="text-gray-400 leading-relaxed italic text-sm">
                "{result.valuationJustification}"
              </p>
              <div className="mt-6 pt-6 border-t border-white/5 flex items-center gap-6">
                <div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Zoning Status</span>
                  <span className="text-xs font-black text-white uppercase mt-1 block">{result.zoningAnalysis}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Strategy</span>
                  <span className="text-xs font-black text-white uppercase mt-1 block">{result.negotiationStrategy}</span>
                </div>
              </div>
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
                  <a href={item.sourceUrl} target="_blank" rel="noopener" className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-500 transition-all">
                    View Plot <ExternalLink size={14} />
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
