
import React, { useState, useEffect, useRef } from 'react';
import { LandResult, LandListing } from '../types';
import { Map, Zap, Layers, Globe, MessageSquare, ExternalLink, Info, Database, LayoutDashboard, Map as MapIcon, Navigation, Bookmark, Compass, Image as ImageIcon, Loader2 } from 'lucide-react';
import { generatePropertyImage } from '../services/geminiService';

const AIPropertyImage = ({ title, address, type }: { title: string, address: string, type: string }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setLoading(true);
    const prompt = `Aerial professional real estate photograph of: ${type} land parcel named ${title} located in ${address}`;
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
            className="flex items-center gap-2 px-4 py-2 bg-cyber-orange/10 border border-cyber-orange/30 rounded-full text-cyber-orange text-[10px] font-mono font-bold hover:bg-cyber-orange hover:text-black transition-all shadow-neon-orange disabled:opacity-50"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />} 
            {loading ? 'GENERATING_PREVIEW...' : 'AI_RENDER_PREVIEW'}
          </button>
        </div>
      )}
      {imgUrl && (
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded text-[8px] font-mono text-cyber-orange">
          AI_GENERATED
        </div>
      )}
    </div>
  );
};

const DashboardMap = ({ listings }: { listings: LandListing[] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [layerType, setLayerType] = useState<'map' | 'sat'>('map');
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    const L = (window as any).L;
    if (!mapRef.current || !L) return;
    if (mapInstance.current) mapInstance.current.remove();

    const avgLat = listings.length > 0 ? listings.reduce((acc, l) => acc + l.latitude, 0) / listings.length : 19.0760;
    const avgLng = listings.length > 0 ? listings.reduce((acc, l) => acc + l.longitude, 0) / listings.length : 72.8777;

    const map = L.map(mapRef.current, { zoomControl: false }).setView([avgLat, avgLng], 13);
    
    const tileUrl = layerType === 'map' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    L.tileLayer(tileUrl, { attribution: '' }).addTo(map);

    const clusters = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 40,
      iconCreateFunction: (cluster: any) => {
        return L.divIcon({
          html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-cyber-orange/90 text-black font-bold font-mono text-xs border-2 border-white shadow-[0_0_15px_#FFAE42]">${cluster.getChildCount()}</div>`,
          className: 'custom-cluster-icon',
          iconSize: [32, 32]
        });
      }
    });

    listings.forEach((item, idx) => {
      const compIcon = L.divIcon({
        className: 'comp-marker-icon',
        html: `<div class="w-6 h-6 -ml-3 -mt-3 bg-cyber-orange border-2 border-cyber-black rounded-full shadow-[0_0_10px_#FFAE42] flex items-center justify-center text-[10px] text-cyber-black font-bold font-mono group transition-transform hover:scale-125">${idx + 1}</div>`,
        iconSize: [0, 0]
      });

      const thumbUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${item.title}&backgroundColor=13161B&shapeColor=FFAE42`;

      const tooltipContent = `
        <div class="flex gap-4 min-w-[280px] p-3 bg-cyber-black rounded-2xl border border-white/10 shadow-glass backdrop-blur-xl group">
          <div class="w-[80px] h-[80px] shrink-0 rounded-xl overflow-hidden border border-white/5 bg-black/40">
             <img src="${thumbUrl}" class="w-full h-full object-cover transition-transform group-hover:scale-110" />
          </div>
          <div class="flex-1 min-w-0">
             <div class="flex items-center justify-between mb-1.5">
                <span class="text-[9px] font-mono font-bold uppercase text-cyber-orange flex items-center gap-1.5">
                   LAND_RECON
                </span>
                <span class="text-[9px] text-gray-600 font-mono tracking-tighter">IDX_${idx + 1}</span>
             </div>
             <h4 class="text-white block text-[11px] font-mono font-bold truncate uppercase mb-1 tracking-tight">${item.title}</h4>
             <div class="text-cyber-orange font-mono font-bold text-[13px] leading-tight mb-1 text-glow-orange">${item.price}</div>
             <div class="text-gray-500 text-[9px] font-mono uppercase tracking-widest flex items-center gap-2">
                ${item.size} <span class="w-1.5 h-1.5 rounded-full bg-gray-800"></span> Facing: ${item.facing}
             </div>
          </div>
        </div>
      `;

      const marker = L.marker([item.latitude, item.longitude], { icon: compIcon });
      marker.bindTooltip(tooltipContent, { 
        direction: 'top', 
        offset: [0, -15],
        className: 'custom-comp-tooltip'
      });
      clusters.addLayer(marker);
    });

    map.addLayer(clusters);
    mapInstance.current = map;
    return () => { if (mapInstance.current) mapInstance.current.remove(); };
  }, [listings, layerType]);

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/10 shadow-inner group bg-black/20">
      <div ref={mapRef} className="w-full h-full grayscale opacity-90 transition-opacity hover:opacity-100 duration-700" />
      
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-[1000]">
        <button onClick={() => setLayerType('map')} className={`p-2 rounded-xl backdrop-blur-md border transition-all ${layerType === 'map' ? 'bg-cyber-orange text-cyber-black border-cyber-orange shadow-neon-orange' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white'}`}><Layers size={16} /></button>
        <button onClick={() => setLayerType('sat')} className={`p-2 rounded-xl backdrop-blur-md border transition-all ${layerType === 'sat' ? 'bg-cyber-orange text-cyber-black border-cyber-orange shadow-neon-orange' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white'}`}><Globe size={16} /></button>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl text-[10px] font-mono text-cyber-orange flex items-center gap-3 shadow-2xl z-[1000]">
          <div className="w-2 h-2 rounded-full bg-cyber-orange animate-pulse"></div>
          SECTOR_LOCKED: {listings.length} PLOTS FOUND
      </div>
    </div>
  );
};

// Fixed missing LandReportProps interface
interface LandReportProps {
  result: LandResult;
  onSave?: () => void;
}

const LandReport: React.FC<LandReportProps> = ({ result, onSave }) => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'map'>('dashboard');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (onSave) {
      onSave();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-right-8 duration-1000 overflow-hidden relative">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/5 border border-white/5 p-3 rounded-2xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyber-orange/10 border border-cyber-orange/20">
            <Map size={16} className="text-cyber-orange" />
          </div>
          <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">Land_Intel_Report</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-black/40 rounded-xl p-1 border border-white/10 shadow-inner">
            <button onClick={() => setViewMode('dashboard')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all ${viewMode === 'dashboard' ? 'bg-cyber-orange text-cyber-black' : 'text-gray-500 hover:text-white'}`}>
              <LayoutDashboard size={14} /> DASHBOARD
            </button>
            <button onClick={() => setViewMode('map')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all ${viewMode === 'map' ? 'bg-cyber-orange text-cyber-black' : 'text-gray-500 hover:text-white'}`}>
              <MapIcon size={14} /> MAP_VIEW
            </button>
          </div>

          <button 
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-mono font-bold transition-all border ${
              saved 
              ? 'bg-cyber-lime/10 border-cyber-lime text-cyber-lime' 
              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
            }`}
          >
            <Bookmark size={14} className={saved ? 'fill-cyber-lime' : ''} /> {saved ? 'SAVED' : 'SAVE_RECON'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-10 scrollbar-thin">
        {viewMode === 'dashboard' ? (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="glass-panel rounded-3xl p-6 md:p-8 bg-gradient-to-br from-cyber-orange/10 to-transparent border-cyber-orange/20 relative overflow-hidden shrink-0 min-h-[200px]">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <Map size={200} className="text-cyber-orange" />
              </div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
                <div>
                  <h2 className="text-2xl md:text-3xl font-mono font-bold text-white uppercase tracking-tighter">LAND_VALUATION_RECON</h2>
                  <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-500 font-mono mt-1">
                    <Zap size={14} className="text-cyber-orange" /> SECURE_VECTOR_HYBRID_ANALYSIS
                  </div>
                </div>
                <div className="bg-black/40 backdrop-blur-xl border border-cyber-orange/30 p-4 md:p-6 rounded-2xl text-right w-full md:w-auto min-h-[100px] flex flex-col justify-center shadow-inner">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-1">Hybrid Market Valuation</span>
                  <div className="text-3xl md:text-4xl font-mono font-bold text-cyber-orange tracking-tight break-words text-glow-orange leading-tight">{result.landValue}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">Unit Value Breakdown</span>
                  <div className="text-xs md:text-sm text-white mt-2 font-mono font-bold">{result.perSqmValue}</div>
                </div>
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">Dev ROI Projection</span>
                  <p className="text-[11px] md:text-xs text-cyber-lime mt-2 font-mono font-bold uppercase">{result.devROI}</p>
                </div>
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">Confidence Score</span>
                  <div className="mt-2 text-xl font-mono font-bold text-white">{result.confidenceScore}%</div>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6 border border-white/5 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Globe size={18} className="text-cyber-orange" />
                  <h3 className="text-sm font-mono font-bold text-white tracking-widest uppercase">Asset Market Discovery</h3>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.listings.map((item, idx) => (
                  <div key={idx} className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 hover:border-cyber-orange/40 transition-all group">
                    <AIPropertyImage title={item.title} address={item.address} type="Parcel" />
                    <div className="flex flex-col gap-3 h-full justify-between">
                      <div className="flex flex-col gap-1">
                        <h4 className="font-bold text-white text-xs line-clamp-2 uppercase tracking-tight">{item.title}</h4>
                        <p className="text-[9px] text-gray-500 font-mono truncate">{item.address}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex flex-col">
                              <span className="text-[11px] font-mono text-cyber-orange font-bold leading-none text-glow-orange">{item.price}</span>
                              <span className="text-[8px] text-cyber-orange/60 font-mono mt-1 uppercase flex items-center gap-1"><Compass size={8}/> {item.facing}</span>
                          </div>
                          <span className="text-[9px] text-gray-600 font-mono">{item.size}</span>
                        </div>
                      </div>
                      <a 
                        href={item.sourceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-cyber-orange/10 border border-cyber-orange/30 text-cyber-orange text-[9px] font-mono font-bold hover:bg-cyber-orange hover:text-black transition-all shadow-neon-orange"
                      >
                        SECURE_LISTING <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[calc(100vh-280px)] md:h-full animate-in fade-in slide-in-from-right-10 duration-500">
            <DashboardMap listings={result.listings} />
          </div>
        )}
      </div>
    </div>
  );
};

export default LandReport;
