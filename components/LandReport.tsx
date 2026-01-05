import React, { useState, useEffect, useRef } from 'react';
import { LandResult, LandListing } from '../types';
import { Map, ExternalLink, Globe, LayoutDashboard, Map as MapIcon, Bookmark, ImageIcon, Loader2, Zap, Info } from 'lucide-react';
import { generatePropertyImage } from '../services/geminiService';

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
    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-100 bg-gray-50 group mb-4">
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
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

    safeListings.forEach((item, idx) => {
      if (item.latitude && item.longitude) {
        L.marker([item.latitude, item.longitude]).addTo(map).bindTooltip(item.title);
      }
    });

    mapInstance.current = map;
    return () => { if (mapInstance.current) mapInstance.current.remove(); };
  }, [listings]);

  return (
    <div className="relative w-full h-[400px] rounded-3xl overflow-hidden border border-gray-100 shadow-soft">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

interface LandReportProps {
  result: LandResult;
}

const LandReport: React.FC<LandReportProps> = ({ result }) => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'map'>('dashboard');
  const listings = result.listings || [];

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-right-8 duration-1000">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-50 rounded-2xl">
            <Map size={24} className="text-orange-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Land Intel</h2>
            <p className="text-sm text-gray-500">ROI-focused plot valuation</p>
          </div>
        </div>
        
        <div className="flex bg-gray-100 rounded-2xl p-1 border border-gray-200">
          <button onClick={() => setViewMode('dashboard')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'dashboard' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            DASHBOARD
          </button>
          <button onClick={() => setViewMode('map')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'map' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            MAP VIEW
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-soft">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Total Valuation</span>
          <div className="text-2xl font-black text-gray-900">{result.landValue}</div>
        </div>
        <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-soft">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Per Sqm</span>
          <div className="text-2xl font-black text-gray-900">{result.perSqmValue}</div>
        </div>
        <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-soft">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Dev ROI</span>
          <div className="text-2xl font-black text-emerald-600">{result.devROI}</div>
        </div>
        <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-soft">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Confidence</span>
          <div className="text-2xl font-black text-gray-900">{result.confidenceScore}%</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-10 scrollbar-hide">
        {viewMode === 'dashboard' ? (
          <div className="space-y-8">
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-soft border-l-4 border-l-orange-500">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap size={20} className="text-orange-500" /> Strategic Analysis
              </h3>
              <p className="text-gray-600 leading-relaxed italic">
                "{result.valuationJustification}"
              </p>
              <div className="mt-6 pt-6 border-t border-gray-50 flex items-center gap-6">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Zoning Status</span>
                  <span className="text-sm font-bold text-gray-900">{result.zoningAnalysis}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Strategy</span>
                  <span className="text-sm font-bold text-gray-900">{result.negotiationStrategy}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((item, idx) => (
                <div key={idx} className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-soft hover:shadow-brand transition-all group">
                  <AIPropertyImage title={item.title} address={item.address} type="Plot" />
                  <div className="mb-4">
                    <h4 className="font-bold text-gray-900 line-clamp-1">{item.title}</h4>
                    <p className="text-xs text-gray-400 truncate mt-1">{item.address}</p>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-lg font-black text-orange-600">{item.price}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{item.size}</span>
                    </div>
                  </div>
                  <a href={item.sourceUrl} target="_blank" rel="noopener" className="w-full py-3 rounded-2xl bg-gray-50 border border-gray-100 text-gray-600 text-sm font-bold flex items-center justify-center gap-2 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-100 transition-all">
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