
import React, { useState, useEffect, useRef } from 'react';
import { BuyResult, SaleListing } from '../types';
import { 
  ExternalLink, TrendingUp, Calculator, Globe, 
  Zap, Info, Database, Layers, Map as MapIcon, 
  LayoutDashboard, Navigation, Bookmark, Link2, ShieldCheck
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BuyDashboardProps {
  result: BuyResult;
  buyType?: 'New Buy' | 'Resale';
  onSave?: () => void;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-cyber-black/95 border border-white/10 p-3 rounded-xl shadow-glass backdrop-blur-xl font-mono min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-2">
           <span className="text-[8px] text-cyber-teal font-bold uppercase tracking-widest">Listing_Identified</span>
           <span className="text-[8px] text-gray-600 font-bold uppercase">{data.name}</span>
        </div>
        <p className="text-[10px] text-white font-bold uppercase truncate mb-1">{data.title}</p>
        <p className="text-[13px] text-cyber-teal font-bold mb-1">{data.full}</p>
        <div className="h-px bg-white/5 my-2" />
        <p className="text-[9px] text-gray-500 uppercase leading-tight truncate">{data.address}</p>
        <p className="text-[8px] text-gray-700 mt-1 uppercase tracking-tighter">CONFIG: {data.bhk}</p>
      </div>
    );
  }
  return null;
};

const DashboardMap = ({ listings }: { listings: SaleListing[] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [layerType, setLayerType] = useState<'map' | 'sat' | 'waze'>('map');
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    const L = (window as any).L;
    if (!mapRef.current || !L || layerType === 'waze') return;
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
          html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-cyber-teal/90 text-black font-bold font-mono text-xs border-2 border-white shadow-[0_0_15px_#00F6FF]">${cluster.getChildCount()}</div>`,
          className: 'custom-cluster-icon',
          iconSize: [32, 32]
        });
      }
    });

    listings.forEach((item, idx) => {
      const compIcon = L.divIcon({
        className: 'comp-marker-icon',
        html: `<div class="w-6 h-6 -ml-3 -mt-3 bg-cyber-teal border-2 border-cyber-black rounded-full shadow-[0_0_10px_#00F6FF] flex items-center justify-center text-[10px] text-cyber-black font-bold font-mono group transition-transform hover:scale-125">${idx + 1}</div>`,
        iconSize: [0, 0]
      });

      const thumbUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${item.title}&backgroundColor=13161B&shapeColor=00F6FF`;
      const isVilla = item.title.toLowerCase().includes('villa');
      
      const typeLabel = isVilla ? 'Villa' : 'Apartment';
      const typeIcon = isVilla 
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="18" x="3" y="3" rx="1"/><rect width="8" height="10" x="13" y="3" rx="1"/><rect width="8" height="6" x="13" y="15" rx="1"/></svg>';

      const tooltipContent = `
        <div class="flex gap-4 min-w-[280px] p-3 bg-cyber-black rounded-2xl border border-white/10 shadow-glass backdrop-blur-xl group">
          <div class="w-[80px] h-[80px] shrink-0 rounded-xl overflow-hidden border border-white/5 bg-black/40">
             <img src="${thumbUrl}" class="w-full h-full object-cover transition-transform group-hover:scale-110" />
          </div>
          <div class="flex-1 min-w-0">
             <div class="flex items-center justify-between mb-1.5">
                <span class="text-[9px] font-mono font-bold uppercase text-cyber-teal flex items-center gap-1.5">
                   ${typeIcon} LISTING_${typeLabel.toUpperCase()}
                </span>
                <span class="text-[9px] text-gray-600 font-mono tracking-tighter">IDX_${idx + 1}</span>
             </div>
             <h4 class="text-white block text-[11px] font-mono font-bold truncate uppercase mb-1 tracking-tight">${item.title}</h4>
             <div class="text-cyber-teal font-mono font-bold text-[13px] leading-tight mb-1 text-glow-teal">${item.price}</div>
             <div class="text-gray-500 text-[9px] font-mono uppercase tracking-widest flex items-center gap-2">
                ${item.bhk} <span class="w-1.5 h-1.5 rounded-full bg-gray-800"></span> EMI: ${item.emiEstimate || 'N/A'}
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
      {layerType === 'waze' ? (
        <iframe 
          src={`https://embed.waze.com/iframe?zoom=14&lat=${listings[0]?.latitude || 19.0760}&lon=${listings[0]?.longitude || 72.8777}&ct=true&pin=1`}
          className="w-full h-full border-none grayscale contrast-[1.1] opacity-90"
          allowFullScreen
        />
      ) : (
        <div ref={mapRef} className="w-full h-full grayscale opacity-90 transition-opacity hover:opacity-100 duration-700" />
      )}
      
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-[1000]">
        <button onClick={() => setLayerType('map')} className={`p-2 rounded-xl backdrop-blur-md border transition-all ${layerType === 'map' ? 'bg-cyber-teal text-cyber-black border-cyber-teal shadow-neon-teal' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white'}`}><Layers size={16} /></button>
        <button onClick={() => setLayerType('sat')} className={`p-2 rounded-xl backdrop-blur-md border transition-all ${layerType === 'sat' ? 'bg-cyber-teal text-cyber-black border-cyber-teal shadow-neon-teal' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white'}`}><Globe size={16} /></button>
        <button onClick={() => setLayerType('waze')} className={`p-2 rounded-xl backdrop-blur-md border transition-all ${layerType === 'waze' ? 'bg-cyber-orange text-cyber-black border-cyber-orange shadow-neon-orange' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white'}`}><Navigation size={16} /></button>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl text-[10px] font-mono text-cyber-teal flex items-center gap-3 shadow-2xl z-[1000]">
          <div className="w-2 h-2 rounded-full bg-cyber-teal animate-pulse"></div>
          {layerType === 'waze' ? 'WAZE_TRAFFIC_ACTIVE' : `SIGNAL_LOCKED: ${listings.length} ASSETS`}
      </div>

      <style>{`
        .custom-comp-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .custom-comp-tooltip::before { display: none; }
      `}</style>
    </div>
  );
};

const BuyDashboard: React.FC<BuyDashboardProps> = ({ result, buyType, onSave }) => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'map'>('dashboard');
  const [isRendered, setIsRendered] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsRendered(true), 300);
    return () => clearTimeout(timer);
  }, [viewMode]);

  const handleSave = () => {
    if (onSave) {
      onSave();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const chartData = result.listings.map((l, i) => ({
    name: `L${i+1}`,
    val: l.priceValue / 100000,
    full: l.price,
    title: l.title,
    address: l.address,
    bhk: l.bhk
  })).sort((a,b) => a.val - b.val);

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 overflow-hidden relative">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/5 border border-white/5 p-3 rounded-2xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyber-teal/10 border border-cyber-teal/20">
            <Layers size={16} className="text-cyber-teal" />
          </div>
          <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">Buy_Intel_Report</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-black/40 rounded-xl p-1 border border-white/10 shadow-inner">
            <button onClick={() => setViewMode('dashboard')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all ${viewMode === 'dashboard' ? 'bg-cyber-teal text-cyber-black' : 'text-gray-500 hover:text-white'}`}>
              <LayoutDashboard size={14} /> DASHBOARD
            </button>
            <button onClick={() => setViewMode('map')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all ${viewMode === 'map' ? 'bg-cyber-teal text-cyber-black' : 'text-gray-500 hover:text-white'}`}>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-panel rounded-3xl p-6 border-l-4 border-l-cyber-teal bg-cyber-teal/5 relative flex flex-col min-h-[250px]">
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                   <span className={`px-4 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase shadow-neon-teal ${
                      result.recommendation === 'Good Buy' ? 'bg-cyber-lime text-black' : 
                      result.recommendation === 'Overpriced' ? 'bg-red-500 text-white' : 'bg-cyber-teal text-black'
                   }`}>
                      <Zap size={10} className="inline mr-1" /> {result.recommendation}
                   </span>
                </div>
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2 bg-cyber-teal text-cyber-black rounded-lg"><Calculator size={20} /></div>
                   <h3 className="text-sm font-mono font-bold text-white uppercase tracking-widest">Fair Value Projection</h3>
                </div>
                <div className="p-6 bg-black/60 rounded-2xl border border-white/10 shadow-inner flex flex-col justify-center min-h-[120px]">
                  <span className="text-[10px] font-mono text-gray-500 uppercase mb-1">Estimated Valuation</span>
                  <div className="text-3xl sm:text-4xl font-mono font-bold text-cyber-teal tracking-tighter text-glow-teal leading-tight">{result.fairValue}</div>
                  <div className="text-[10px] font-mono text-gray-600 mt-2">Range: {result.valuationRange}</div>
                </div>
              </div>

              <div className="glass-panel rounded-3xl p-6 border-l-4 border-l-cyber-orange bg-cyber-orange/5 flex flex-col">
                <h3 className="text-sm font-mono font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <Info size={16} className="text-cyber-orange" /> Valuation Rationale
                </h3>
                <div className="bg-black/60 p-5 rounded-2xl border border-cyber-orange/20 flex-1 flex flex-col min-h-[160px]">
                  <p className="text-[11px] text-gray-300 font-mono leading-relaxed whitespace-pre-wrap flex-1 italic">
                    {result.valuationJustification}
                  </p>
                </div>
              </div>
            </div>

            {/* Neural Grounding Sources - Strictly Extracting Search Intel */}
            {result.groundingSources && result.groundingSources.length > 0 && (
              <div className="glass-panel rounded-3xl p-6 border border-cyber-teal/20 bg-cyber-teal/5 overflow-hidden">
                <h3 className="text-xs font-mono font-bold text-cyber-teal mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <ShieldCheck size={16} className="text-cyber-teal" /> Neural Grounding Sources (Proof of Intelligence)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.groundingSources.map((source, i) => (
                    <a 
                      key={i} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-[9px] font-mono text-gray-400 hover:text-white hover:border-cyber-teal transition-all group"
                    >
                      <Link2 size={10} className="text-cyber-teal group-hover:scale-110" />
                      {source.title.length > 40 ? source.title.substring(0, 40) + '...' : source.title}
                    </a>
                  ))}
                </div>
                <p className="text-[8px] text-gray-600 font-mono mt-3 uppercase tracking-tighter">* These signals were used to verify high-tier valuation floors for the selected sector.</p>
              </div>
            )}

            <div className="glass-panel rounded-3xl p-6 border border-white/5 bg-black/20 overflow-hidden">
                <h3 className="text-xs font-mono font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <TrendingUp size={16} className="text-cyber-lime" /> Sector Price Spread (Lakhs)
                </h3>
                <div className="h-[250px] w-full min-h-[250px] relative">
                  {isRendered && (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                        <XAxis dataKey="name" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line 
                          type="monotone" 
                          dataKey="val" 
                          stroke="#00F6FF" 
                          strokeWidth={3} 
                          dot={{ fill: '#00F6FF', stroke: '#0D0F12', strokeWidth: 2, r: 4 }} 
                          activeDot={{ r: 6, stroke: '#00F6FF', strokeWidth: 2, fill: '#fff' }}
                          isAnimationActive={true}
                          animationDuration={1500}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
            </div>

            <div className="glass-panel rounded-3xl p-6 border border-white/5">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <Globe size={18} className="text-cyber-teal" /> Market Discovery & Comps
                </h3>
                <div className="flex items-center gap-2 px-3 py-1 bg-cyber-teal/10 border border-cyber-teal/30 rounded-lg text-[9px] font-mono text-cyber-teal uppercase">
                  <Database size={12} /> Live Scan Active
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.listings.map((item, idx) => (
                  <div key={idx} className="group bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:border-cyber-teal/40 transition-all relative">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="font-bold text-white text-sm truncate flex-1 uppercase tracking-tight">{item.title}</h4>
                        <div className="text-lg font-mono font-bold text-cyber-teal text-glow-teal">{item.price}</div>
                      </div>
                      <p className="text-[10px] text-gray-500 truncate">{item.address}</p>
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                        <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] text-gray-400 font-mono">{item.bhk}</span>
                        <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-cyber-teal text-cyber-black rounded-lg hover:bg-white transition-all text-[9px] font-bold font-mono shadow-neon-teal">
                          SOURCE_INTEL <ExternalLink size={10} />
                        </a>
                      </div>
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

export default BuyDashboard;
