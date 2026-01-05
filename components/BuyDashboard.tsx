
import React, { useState, useEffect, useRef } from 'react';
import { BuyResult, SaleListing } from '../types';
import { 
  ExternalLink, TrendingUp, Calculator, Globe, 
  Zap, Info, Database, Layers, Map as MapIcon, 
  LayoutDashboard, Navigation, Bookmark, Link2, ShieldCheck, CheckCircle2, Compass, Tag, ArrowRight, Image as ImageIcon, Loader2
} from 'lucide-react';
import { generatePropertyImage } from '../services/geminiService';

const AIPropertyImage = ({ title, address, type }: { title: string, address: string, type: string }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setLoading(true);
    const prompt = `${type} named ${title} located in ${address}`;
    const url = await generatePropertyImage(prompt);
    setImgUrl(url);
    setLoading(false);
  };

  const placeholderUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${title}&backgroundColor=13161B&shapeColor=00F6FF`;

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
            className="flex items-center gap-2 px-4 py-2 bg-cyber-teal/10 border border-cyber-teal/30 rounded-full text-cyber-teal text-[10px] font-mono font-bold hover:bg-cyber-teal hover:text-black transition-all shadow-neon-teal disabled:opacity-50"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />} 
            {loading ? 'GENERATING_PREVIEW...' : 'AI_RENDER_PREVIEW'}
          </button>
        </div>
      )}
      {imgUrl && (
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded text-[8px] font-mono text-cyber-teal">
          AI_GENERATED
        </div>
      )}
    </div>
  );
};

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

interface BuyDashboardProps {
  result: BuyResult;
  buyType?: string;
  onSave?: () => void;
  onAnalyzeFinance?: (value: number) => void;
}

const BuyDashboard: React.FC<BuyDashboardProps> = ({ result, buyType, onSave, onAnalyzeFinance }) => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'map'>('dashboard');

  const parseValue = (val: string) => {
    const numeric = parseFloat(val.replace(/[^\d.]/g, ''));
    if (val.includes('Cr')) return numeric * 10000000;
    if (val.includes('L')) return numeric * 100000;
    return numeric;
  };
  
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
              <div className="glass-panel rounded-3xl p-6 border-l-4 border-l-cyber-teal bg-cyber-teal/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <TrendingUp size={120} />
                </div>
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Estimated Fair Value</div>
                <div className="text-4xl font-mono font-bold text-cyber-teal text-glow-teal leading-tight">{result.fairValue}</div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyber-teal/20 border border-cyber-teal/30 text-[9px] font-bold text-cyber-teal font-mono">
                    <Zap size={10} /> {result.recommendation.toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="glass-panel rounded-3xl p-6 border-l-4 border-l-cyber-orange bg-cyber-orange/5">
                <div className="flex items-center gap-2 mb-3">
                   <Info size={14} className="text-cyber-orange" />
                   <h3 className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">Valuation Rationale</h3>
                </div>
                <p className="text-[11px] text-gray-300 font-mono leading-relaxed italic">{result.valuationJustification}</p>
              </div>
            </div>

            {/* Home Loan Quick Link */}
            <div 
              onClick={() => onAnalyzeFinance && onAnalyzeFinance(parseValue(result.fairValue))}
              className="glass-panel rounded-3xl p-6 border-l-4 border-l-cyber-orange bg-cyber-orange/10 flex items-center justify-between group cursor-pointer hover:bg-cyber-orange/20 transition-all"
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyber-orange text-black rounded-2xl shadow-neon-orange group-hover:scale-110 transition-transform">
                        <Calculator size={20} />
                    </div>
                    <div>
                        <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest">Neural Home Loan Projection</h4>
                        <p className="text-[9px] text-gray-500 font-mono mt-1 uppercase">Calculate EMI, Stamp Duty & Registration for this Asset</p>
                    </div>
                </div>
                <div className="p-2 rounded-full border border-cyber-orange/30 text-cyber-orange group-hover:translate-x-1 transition-all">
                    <ArrowRight size={20} />
                </div>
            </div>

            <div className="glass-panel rounded-3xl p-6 border border-white/5">
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Globe size={18} className="text-cyber-teal" /> Asset Discovery & Hybrid Comps
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.listings.map((item, idx) => (
                  <div key={idx} className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:border-cyber-teal/40 transition-all relative overflow-hidden group">
                    <AIPropertyImage title={item.title} address={item.address} type={item.bhk} />
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-white text-sm truncate uppercase tracking-tight w-2/3">{item.title}</h4>
                      <div className="text-cyber-teal font-mono font-bold">{item.price}</div>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate mb-4">{item.address}</p>
                    
                    <div className="flex items-center justify-between mt-auto">
                       <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[8px] font-mono text-gray-400">
                              {item.bhk} • {item.emiEstimate}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-cyber-teal/10 border border-cyber-teal/20 text-[8px] font-mono text-cyber-teal flex items-center gap-1">
                              <Compass size={8} /> {item.facing.toUpperCase()}
                          </span>
                       </div>
                       <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-cyber-teal text-black rounded-lg text-[9px] font-bold font-mono shadow-neon-teal hover:bg-white transition-all">
                          SOURCE_INTEL <ExternalLink size={10} />
                       </a>
                    </div>
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
