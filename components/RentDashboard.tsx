import React, { useState, useEffect, useRef } from 'react';
import { RentResult, RentalListing } from '../types';
import { 
  MapPin, ExternalLink, Zap, Globe, TrendingUp, Calculator, Info, Layers, Map as MapIcon, Building2, LayoutDashboard, Bookmark, ImageIcon, Loader2
} from 'lucide-react';
import { generatePropertyImage } from '../services/geminiService';

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
    
    const tileUrl = layerType === 'map' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

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
    <div className="relative w-full h-[400px] rounded-3xl overflow-hidden border border-gray-100 shadow-soft">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-[1000]">
        <button onClick={() => setLayerType('map')} className={`p-2 rounded-xl border transition-all ${layerType === 'map' ? 'bg-emerald-500 text-white border-emerald-500 shadow-brand' : 'bg-white text-gray-500 border-gray-100'}`}><Layers size={16} /></button>
        <button onClick={() => setLayerType('sat')} className={`p-2 rounded-xl border transition-all ${layerType === 'sat' ? 'bg-emerald-500 text-white border-emerald-500 shadow-brand' : 'bg-white text-gray-500 border-gray-100'}`}><Globe size={16} /></button>
      </div>
    </div>
  );
};

interface RentDashboardProps {
  result: RentResult;
}

const RentDashboard: React.FC<RentDashboardProps> = ({ result }) => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'map'>('dashboard');
  const listings = result.listings || [];

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 rounded-2xl">
            <Building2 size={24} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Rental Intel</h2>
            <p className="text-sm text-gray-500">Market-verified monthly estimates</p>
          </div>
        </div>
        
        <div className="flex bg-gray-100 rounded-2xl p-1 border border-gray-200">
          <button onClick={() => setViewMode('dashboard')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'dashboard' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            DASHBOARD
          </button>
          <button onClick={() => setViewMode('map')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'map' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            MAP VIEW
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-soft">
          <span className="text-xs font-black text-emerald-500 uppercase tracking-widest block mb-1">Monthly Rent</span>
          <div className="text-4xl font-black text-gray-900 tracking-tighter">{result.rentalValue}</div>
        </div>
        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-soft">
          <span className="text-xs font-black text-blue-500 uppercase tracking-widest block mb-1">Projected Yield</span>
          <div className="text-4xl font-black text-gray-900 tracking-tighter">{result.yieldPercentage}</div>
        </div>
        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-soft">
          <span className="text-xs font-black text-orange-500 uppercase tracking-widest block mb-1">Confidence</span>
          <div className="text-4xl font-black text-gray-900 tracking-tighter">{result.confidenceScore}%</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-10 scrollbar-hide">
        {viewMode === 'dashboard' ? (
          <div className="space-y-8">
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-soft">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Info size={20} className="text-emerald-500" /> Market Reasoning
              </h3>
              <p className="text-gray-600 leading-relaxed italic">
                "{result.valuationJustification}"
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {listings.map((item, idx) => (
                <div key={idx} className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-soft hover:shadow-brand transition-all group">
                  <AIPropertyImage title={item.title} address={item.address} type={item.bhk} />
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900">{item.title}</h4>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><MapPin size={12}/> {item.address}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-emerald-600">{item.rent}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Verified</div>
                    </div>
                  </div>
                  <a href={item.sourceUrl} target="_blank" rel="noopener" className="w-full py-3 rounded-2xl bg-gray-50 border border-gray-100 text-gray-600 text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-all">
                    View Details <ExternalLink size={14} />
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

export default RentDashboard;