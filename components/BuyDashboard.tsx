
import React, { useState, useEffect, useRef } from 'react';
import { BuyResult, SaleListing } from '../types';
import { 
  ExternalLink, TrendingUp, Calculator, Globe, 
  Zap, Info, Database, Layers, Map as MapIcon, 
  LayoutDashboard, Navigation, Bookmark, Link2, ShieldCheck
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardMap = ({ listings }: { listings: SaleListing[] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [layerType, setLayerType] = useState<'dark' | 'standard'>('dark');
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    const L = (window as any).L;
    if (!mapRef.current || !L) return;
    if (mapInstance.current) mapInstance.current.remove();

    const avgLat = listings.length > 0 ? listings.reduce((acc, l) => acc + l.latitude, 0) / listings.length : 18.9219;
    const avgLng = listings.length > 0 ? listings.reduce((acc, l) => acc + l.longitude, 0) / listings.length : 72.8347;

    const map = L.map(mapRef.current, { zoomControl: false }).setView([avgLat, avgLng], 13);
    
    const tileUrl = layerType === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    L.tileLayer(tileUrl, { attribution: '© OSM' }).addTo(map);

    listings.forEach((item, idx) => {
      const icon = L.divIcon({
        className: 'custom-icon',
        html: `<div class="w-8 h-8 -ml-4 -mt-4 bg-cyber-teal border-2 border-black rounded-full shadow-[0_0_15px_#00F6FF] flex items-center justify-center text-[10px] font-bold font-mono">${idx + 1}</div>`,
        iconSize: [0, 0]
      });

      L.marker([item.latitude, item.longitude], { icon }).addTo(map)
        .bindTooltip(`<div class="p-2 bg-black text-white font-mono text-[10px] rounded border border-white/10 uppercase">${item.title}<br/><span class="text-cyber-teal">${item.price}</span></div>`);
    });

    mapInstance.current = map;
    return () => { if (mapInstance.current) mapInstance.current.remove(); };
  }, [listings, layerType]);

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/10 bg-black/20">
      <div ref={mapRef} className="w-full h-full grayscale opacity-90 transition-opacity hover:opacity-100 duration-700" />
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-[1000]">
        <button onClick={() => setLayerType('dark')} className={`p-2 rounded-xl backdrop-blur-md border ${layerType === 'dark' ? 'bg-cyber-teal text-black border-cyber-teal shadow-neon-teal' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white'}`}><Layers size={16} /></button>
        <button onClick={() => setLayerType('standard')} className={`p-2 rounded-xl backdrop-blur-md border ${layerType === 'standard' ? 'bg-cyber-teal text-black border-cyber-teal shadow-neon-teal' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white'}`}><MapIcon size={16} /></button>
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl text-[10px] font-mono text-cyber-teal flex items-center gap-3 z-[1000]">
          <div className="w-2 h-2 rounded-full bg-cyber-teal animate-pulse"></div>
          SECTOR_LOCKED: {listings.length} ASSETS FOUND
      </div>
    </div>
  );
};

const BuyDashboard: React.FC<{ result: BuyResult, buyType?: string, onSave?: () => void }> = ({ result, buyType, onSave }) => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'map'>('dashboard');
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsRendered(true), 300);
    return () => clearTimeout(timer);
  }, [viewMode]);

  const chartData = result.listings.map((l, i) => ({
    name: `L${i+1}`,
    val: l.priceValue / 100000,
    full: l.price,
    title: l.title
  })).sort((a,b) => a.val - b.val);

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 overflow-hidden">
      <div className="flex justify-between items-center gap-4 bg-white/5 border border-white/5 p-3 rounded-2xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyber-teal/10 border border-cyber-teal/20"><Layers size={16} className="text-cyber-teal" /></div>
          <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">Buy_Intel_Report</span>
        </div>
        <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
          <button onClick={() => setViewMode('dashboard')} className={`px-4 py-1.5 rounded-lg text-[10px] font-mono font-bold ${viewMode === 'dashboard' ? 'bg-cyber-teal text-black' : 'text-gray-500'}`}>DASHBOARD</button>
          <button onClick={() => setViewMode('map')} className={`px-4 py-1.5 rounded-lg text-[10px] font-mono font-bold ${viewMode === 'map' ? 'bg-cyber-teal text-black' : 'text-gray-500'}`}>MAP_VIEW</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-10 scrollbar-thin">
        {viewMode === 'dashboard' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-panel rounded-3xl p-6 border-l-4 border-l-cyber-teal bg-cyber-teal/5 relative">
                <div className="text-3xl font-mono font-bold text-cyber-teal text-glow-teal leading-tight">{result.fairValue}</div>
                <div className="text-[10px] font-mono text-gray-500 mt-2 uppercase">Recommended: {result.recommendation}</div>
              </div>
              <div className="glass-panel rounded-3xl p-6 border-l-4 border-l-cyber-orange bg-cyber-orange/5">
                <p className="text-[11px] text-gray-300 font-mono leading-relaxed italic">{result.valuationJustification}</p>
              </div>
            </div>

            {result.groundingSources && result.groundingSources.length > 0 && (
              <div className="glass-panel rounded-3xl p-6 border border-cyber-teal/20 bg-cyber-teal/5">
                <h3 className="text-xs font-mono font-bold text-cyber-teal mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <ShieldCheck size={16} /> Neural Grounding Sources (High Fidelity)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.groundingSources.map((source, i) => (
                    <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-[9px] font-mono text-gray-400 hover:text-white hover:border-cyber-teal transition-all">
                      <Link2 size={10} className="text-cyber-teal" /> {source.title.substring(0, 30)}...
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="glass-panel rounded-3xl p-6 border border-white/5">
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2"><Globe size={18} className="text-cyber-teal" /> Market Discovery & Comps</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.listings.map((item, idx) => (
                  <div key={idx} className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:border-cyber-teal/40 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-white text-sm truncate uppercase tracking-tight">{item.title}</h4>
                      <div className="text-cyber-teal font-mono font-bold">{item.price}</div>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate mb-4">{item.address}</p>
                    <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-2 bg-cyber-teal text-black rounded-lg text-[9px] font-bold font-mono shadow-neon-teal">SOURCE_INTEL <ExternalLink size={10} /></a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <DashboardMap listings={result.listings} />
        )}
      </div>
    </div>
  );
};

export default BuyDashboard;
