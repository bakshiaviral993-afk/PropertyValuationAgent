
import React, { useState, useEffect, useRef } from 'react';
import { RentResult, RentalListing } from '../types';
import { 
  MapPin, ExternalLink, Zap, Terminal, Globe, MessageSquare, TrendingUp, Calculator, Info, ShieldAlert, Layers, Map as MapIcon, Navigation, Building2, LayoutDashboard, Bookmark
} from 'lucide-react';

interface RentDashboardProps {
  result: RentResult;
  onSave?: () => void;
}

const WAZE_API_KEY = "9b9817e604msh23232e7c48177ecp11f684jsnc32882321d9f";

const DashboardMap = ({ listings }: { listings: RentalListing[] }) => {
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
          html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-cyber-lime/90 text-black font-bold font-mono text-xs border-2 border-white shadow-[0_0_15px_#B4FF5C]">${cluster.getChildCount()}</div>`,
          className: 'custom-cluster-icon',
          iconSize: [32, 32]
        });
      }
    });

    listings.forEach((item, idx) => {
      const compIcon = L.divIcon({
        className: 'comp-marker-icon',
        html: `<div class="w-6 h-6 -ml-3 -mt-3 bg-cyber-lime border-2 border-cyber-black rounded-full shadow-[0_0_10px_#B4FF5C] flex items-center justify-center text-[10px] text-cyber-black font-bold font-mono group transition-transform hover:scale-125">${idx + 1}</div>`,
        iconSize: [0, 0]
      });

      const thumbUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${item.title}&backgroundColor=13161B&shapeColor=B4FF5C`;

      const tooltipContent = `
        <div class="flex gap-4 min-w-[280px] p-3 bg-cyber-black rounded-2xl border border-white/10 shadow-glass backdrop-blur-xl group">
          <div class="w-[80px] h-[80px] shrink-0 rounded-xl overflow-hidden border border-white/5 bg-black/40">
             <img src="${thumbUrl}" class="w-full h-full object-cover transition-transform group-hover:scale-110" />
          </div>
          <div class="flex-1 min-w-0">
             <div class="flex items-center justify-between mb-1.5">
                <span class="text-[9px] font-mono font-bold uppercase text-cyber-lime flex items-center gap-1.5">
                   RENTAL_INTEL
                </span>
                <span class="text-[9px] text-gray-600 font-mono tracking-tighter">IDX_${idx + 1}</span>
             </div>
             <h4 class="text-white block text-[11px] font-mono font-bold truncate uppercase mb-1 tracking-tight">${item.title}</h4>
             <div class="text-cyber-lime font-mono font-bold text-[13px] leading-tight mb-1 text-glow-orange">${item.rent}</div>
             <div class="text-gray-500 text-[9px] font-mono uppercase tracking-widest flex items-center gap-2">
                ${item.bhk} <span class="w-1.5 h-1.5 rounded-full bg-gray-800"></span> Quality: ${item.qualityScore}/100
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
        <button onClick={() => setLayerType('map')} className={`p-2 rounded-xl backdrop-blur-md border transition-all ${layerType === 'map' ? 'bg-cyber-lime text-cyber-black border-cyber-lime shadow-neon-teal' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white'}`}><Layers size={16} /></button>
        <button onClick={() => setLayerType('sat')} className={`p-2 rounded-xl backdrop-blur-md border transition-all ${layerType === 'sat' ? 'bg-cyber-lime text-cyber-black border-cyber-lime shadow-neon-teal' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white'}`}><Globe size={16} /></button>
        <button onClick={() => setLayerType('waze')} className={`p-2 rounded-xl backdrop-blur-md border transition-all ${layerType === 'waze' ? 'bg-cyber-orange text-cyber-black border-cyber-orange shadow-neon-orange' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white'}`}><Navigation size={16} /></button>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl text-[10px] font-mono text-cyber-lime flex items-center gap-3 shadow-2xl z-[1000]">
          <div className="w-2 h-2 rounded-full bg-cyber-lime animate-pulse"></div>
          {layerType === 'waze' ? 'WAZE_TRAFFIC_ACTIVE' : `RECON_LOCKED: ${listings.length} RENTALS`}
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

const RentDashboard: React.FC<RentDashboardProps> = ({ result, onSave }) => {
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
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 overflow-hidden relative">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/5 border border-white/5 p-3 rounded-2xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyber-lime/10 border border-cyber-lime/20">
            <Building2 size={16} className="text-cyber-lime" />
          </div>
          <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">Rental_Intel_Report</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-black/40 rounded-xl p-1 border border-white/10 shadow-inner">
            <button onClick={() => setViewMode('dashboard')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all ${viewMode === 'dashboard' ? 'bg-cyber-lime text-cyber-black' : 'text-gray-500 hover:text-white'}`}>
              <LayoutDashboard size={14} /> DASHBOARD
            </button>
            <button onClick={() => setViewMode('map')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all ${viewMode === 'map' ? 'bg-cyber-lime text-cyber-black' : 'text-gray-500 hover:text-white'}`}>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-panel rounded-3xl p-6 border-l-4 border-l-cyber-teal bg-cyber-teal/5 relative">
                  {result.rentOutAlert && (
                      <div className="absolute -top-3 -right-3 px-3 py-1 bg-cyber-lime text-black text-[9px] font-bold font-mono rounded-full shadow-neon-teal animate-bounce flex items-center gap-1">
                          <Zap size={10} /> RENT_OUT_NOW
                      </div>
                  )}
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-cyber-teal text-cyber-black rounded-lg"><TrendingUp size={20} /></div>
                      <h2 className="text-sm font-mono font-bold text-white uppercase tracking-widest leading-none">Rental Analytics Hub</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-black/40 rounded-2xl border border-cyber-teal/20">
                          <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1 block">Projected Yield</span>
                          <div className="text-xl sm:text-2xl font-mono font-bold text-cyber-teal break-words text-glow-teal">{result.yieldPercentage}</div>
                      </div>
                      <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                          <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1 block">Demand Score</span>
                          <div className="text-xl sm:text-2xl font-mono font-bold text-white">{result.tenantDemandScore}/100</div>
                      </div>
                  </div>

                  <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                      <h4 className="text-[10px] font-mono text-gray-400 uppercase mb-2 flex items-center gap-2">
                          <Calculator size={12} className="text-cyber-teal" /> Security Deposit Protocol
                      </h4>
                      <p className="text-[11px] text-white font-mono leading-relaxed">{result.depositCalc}</p>
                  </div>
              </div>

              {/* Rental Logic Justification */}
              <div className="glass-panel rounded-3xl p-6 border-l-4 border-l-cyber-orange bg-cyber-orange/5 flex flex-col">
                  <h3 className="text-sm font-mono font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                      <Info size={16} className="text-cyber-orange" /> Market Logic Recon
                  </h3>
                  <div className="bg-black/60 p-5 rounded-2xl border border-cyber-orange/20 flex-1 flex flex-col min-h-[120px]">
                      <p className="text-[11px] text-gray-300 font-mono leading-relaxed italic whitespace-pre-wrap flex-1">
                          {result.valuationJustification}
                      </p>
                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[9px] text-gray-500 font-mono uppercase tracking-widest">
                        <span>Triangulated Assets: {result.propertiesFoundCount}</span>
                        <span className="text-cyber-orange">Confidence: {result.confidenceScore}%</span>
                      </div>
                  </div>
              </div>
            </div>

            {/* Comps List */}
            <div className="glass-panel rounded-3xl p-6 border border-white/5">
              <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                      <Globe size={18} className="text-cyber-teal" />
                      <h3 className="text-sm font-mono font-bold text-white tracking-widest uppercase">Live Market Comparables</h3>
                  </div>
                  {result.suggestRadiusExpansion && (
                    <div className="flex items-center gap-2 text-cyber-lime text-[9px] font-mono animate-pulse uppercase">
                      <ShieldAlert size={12} /> Expansion Recommended
                    </div>
                  )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.listings.map((item, idx) => (
                      <div key={idx} className="group bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:border-cyber-lime/40 transition-all">
                          <div className="flex justify-between items-start mb-4">
                              <div className="flex-1 mr-4 overflow-hidden">
                                  <h4 className="font-bold text-white text-sm truncate uppercase tracking-tight">{item.title}</h4>
                                  <p className="text-[10px] text-gray-500 mt-1 truncate">{item.address}</p>
                              </div>
                              <div className="text-right">
                                  <div className="text-sm sm:text-base font-mono font-bold text-cyber-lime break-words text-glow-orange">{item.rent}</div>
                                  <div className="text-[8px] text-gray-600 uppercase mt-1">Market Match</div>
                              </div>
                          </div>
                          <div className="flex justify-between items-center border-t border-white/5 pt-4">
                              <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] text-gray-400 font-mono">{item.bhk}</span>
                              <a 
                                href={item.sourceUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-lime text-cyber-black text-[9px] font-mono font-bold hover:bg-white transition-all shadow-neon-teal"
                              >
                                  SECURE_SOURCE <ExternalLink size={10} />
                              </a>
                          </div>
                      </div>
                  ))}
              </div>
            </div>

            {/* Negotiation */}
            <div className="glass-panel rounded-3xl p-6 border-l-4 border-l-cyber-lime bg-cyber-lime/5">
                <h3 className="text-sm font-mono font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                    <MessageSquare size={16} className="text-cyber-lime" /> Tenant/Owner Playbook
                </h3>
                <div className="bg-black/60 p-5 rounded-2xl border border-cyber-lime/20">
                    <p className="text-[11px] text-gray-300 font-mono leading-relaxed italic whitespace-pre-wrap">
                        {result.negotiationScript}
                    </p>
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

export default RentDashboard;
