import React, { useRef, useEffect, useState } from 'react';
import { RentResult, RentRequest } from '../types';
import { 
  MapPin, ExternalLink, TrendingUp, ShieldCheck, Activity, Search, Info, 
  Terminal, Briefcase, Wallet, Truck, Scale, ShieldAlert, Zap, ArrowDownCircle,
  AlertTriangle, CheckCircle2, ChevronRight, Gauge
} from 'lucide-react';

interface RentDashboardProps {
  result: RentResult;
  request: RentRequest;
}

const RentMap = ({ lat, lng, area, radius }: { lat: number, lng: number, area: string, radius: string }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || !window.L || !lat || !lng) return;
    if (mapInstance.current) mapInstance.current.remove();

    const map = window.L.map(mapRef.current, { 
      zoomControl: false, 
      dragging: true, 
      scrollWheelZoom: false 
    }).setView([lat, lng], 13);

    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {}).addTo(map);
    
    // --- SUBJECT RADAR TARGET ---
    const targetIcon = window.L.divIcon({
      className: 'rent-target-container',
      html: `
        <div class="relative flex items-center justify-center w-20 h-20 -ml-10 -mt-10">
          <div class="absolute w-12 h-12 border-2 border-cyber-lime/30 rounded-full animate-ping"></div>
          <div class="absolute w-8 h-8 border border-cyber-lime/50 rounded-full animate-pulse"></div>
          <div class="relative w-4 h-4 bg-cyber-lime rounded-full border-2 border-white shadow-[0_0_15px_#B4FF5C]"></div>
        </div>
      `,
      iconSize: [0, 0]
    });
    window.L.marker([lat, lng], { icon: targetIcon }).addTo(map)
      .bindTooltip(`<div class='font-mono text-[10px] font-bold text-cyber-lime uppercase'>SCAN_ORIGIN: ${area}</div>`, { direction: 'top', offset: [0, -10] });

    // --- SCAN RADIUS VISUALIZER ---
    const rMeters = parseInt(radius) * 1000;
    window.L.circle([lat, lng], {
      color: '#B4FF5C',
      fillColor: '#B4FF5C',
      fillOpacity: 0.05,
      weight: 1,
      dashArray: '10, 10',
      radius: rMeters 
    }).addTo(map);

    mapInstance.current = map;
    return () => mapInstance.current?.remove();
  }, [lat, lng, radius, area]);

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-cyber-border group shadow-2xl">
      <div ref={mapRef} className="w-full h-full grayscale opacity-90 transition-all group-hover:grayscale-0 group-hover:opacity-100" />
      <div className="absolute top-4 left-4 z-[400] bg-black/80 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 shadow-neon-lime">
        <div className="flex items-center gap-2 mb-1">
          <Activity size={12} className="text-cyber-lime animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-cyber-lime uppercase tracking-widest">Geo-Spatial Scan</span>
        </div>
        <p className="text-sm font-bold text-white uppercase tracking-tighter">RADIUS: {radius}</p>
      </div>
      <div className="absolute bottom-4 left-4 z-[400] pointer-events-none">
         <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
             <div className="w-2 h-2 rounded-full bg-cyber-lime animate-pulse"></div>
             <span className="text-[8px] font-mono text-gray-400 uppercase tracking-widest">Real-time Cluster Verification</span>
         </div>
      </div>
    </div>
  );
};

const RentDashboard: React.FC<RentDashboardProps> = ({ result, request }) => {
  const [showLogs, setShowLogs] = useState(false);

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 overflow-y-auto pr-2 scrollbar-thin">
      
      {/* Top Section: Expert Appraisal & Map */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 shrink-0">
        
        {/* Market Expert Verdict (Sophisticated Prediction) */}
        <div className="xl:col-span-7 flex flex-col gap-6">
            <div className="glass-panel rounded-3xl p-6 border-l-4 border-l-cyber-teal bg-cyber-teal/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Briefcase size={120} className="text-cyber-teal" />
                </div>
                
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-cyber-teal text-cyber-black rounded-lg shadow-neon-teal">
                        <Zap size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-mono font-bold text-white tracking-widest uppercase">Expert_Appraisal_Verdict</h2>
                        <p className="text-[9px] text-cyber-teal font-mono uppercase tracking-widest font-bold">Refined by Age, Landmarks & Amenities</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-4">
                        <div className="p-4 bg-black/40 rounded-2xl border border-cyber-teal/20 relative group">
                            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1 block">Justified Market Rent</span>
                            <div className="text-4xl font-mono font-bold text-cyber-teal text-glow-teal">{result.expertVerdict?.justifiedPrice}</div>
                            <div className="flex items-center gap-1.5 mt-2">
                                <CheckCircle2 size={12} className="text-cyber-lime" />
                                <span className="text-[10px] text-gray-400 font-mono italic">Fair price for current micro-market</span>
                            </div>
                        </div>

                        <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/20 relative">
                            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1 block">Hard Max Threshold</span>
                            <div className="text-3xl font-mono font-bold text-red-400">{result.expertVerdict?.maxThreshold}</div>
                            <div className="flex items-center gap-1.5 mt-2">
                                <AlertTriangle size={12} className="text-red-500" />
                                <span className="text-[10px] text-red-500/70 font-mono italic">WALK AWAY if exceeded</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                            <h4 className="text-[10px] font-mono text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Scale size={14} className="text-cyber-lime" /> Value Justification
                            </h4>
                            <p className="text-[11px] text-gray-400 font-mono leading-relaxed">
                                {result.expertVerdict?.whyJustified}
                            </p>
                        </div>
                        <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                            <h4 className="text-[10px] font-mono text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                                <ShieldAlert size={14} className="text-red-400" /> Ceiling Reasons
                            </h4>
                            <p className="text-[11px] text-gray-400 font-mono leading-relaxed">
                                {result.expertVerdict?.whyNoMoreThan}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Premium Drivers Visualization */}
                <div className="flex flex-wrap gap-4">
                    {result.premiumDrivers.map((driver, i) => (
                        <div key={i} className="px-4 py-2 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3">
                            <span className="text-[10px] font-mono text-white uppercase">{driver.feature}</span>
                            <span className="text-[10px] font-mono font-bold text-cyber-lime">{driver.impact}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Map View */}
        <div className="xl:col-span-5 h-[440px] shrink-0">
            <RentMap lat={result.latitude || 0} lng={result.longitude || 0} area={request.area} radius={result.radiusUsed} />
        </div>
      </div>

      {/* Middle Section: Cost Matrix & Logs */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Logistics & One-time Costs (5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-6">
             <div className="glass-panel rounded-3xl p-6 border border-white/5">
                <h3 className="text-xs font-mono text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Wallet size={16} className="text-cyber-orange" /> Transactional Matrix
                </h3>
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-xl bg-cyber-teal/10 text-cyber-teal"><ShieldCheck size={20} /></div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Security Deposit</p>
                                <p className="text-sm font-bold text-white font-mono">{result.depositEstimate}</p>
                            </div>
                        </div>
                        <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest">Escrow Ready</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-xl bg-cyber-lime/10 text-cyber-lime"><Gauge size={20} /></div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Monthly Society Maintenance</p>
                                <p className="text-sm font-bold text-white font-mono">{result.maintenanceEstimate}</p>
                            </div>
                        </div>
                        <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest">Area Avg.</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-xl bg-cyber-orange/10 text-cyber-orange"><Truck size={20} /></div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Relocation Allowance</p>
                                <p className="text-sm font-bold text-white font-mono">{result.relocationExpenses}</p>
                            </div>
                        </div>
                        <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest">One-time Logistics</span>
                    </div>
                </div>
             </div>
        </div>

        {/* Live Cluster Feeds (7 cols) */}
        <div className="xl:col-span-7 flex flex-col gap-6">
            <div className="glass-panel rounded-3xl p-6 border border-white/5 flex flex-col h-full min-h-[400px]">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyber-lime/10 text-cyber-lime rounded-lg"><Terminal size={18} /></div>
                        <h3 className="text-sm font-mono font-bold text-white tracking-widest uppercase">Live_Cluster_Feeds</h3>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowLogs(!showLogs)} 
                            className={`text-[9px] font-mono border px-3 py-1 rounded-full transition-all tracking-widest uppercase font-bold ${showLogs ? 'bg-cyber-lime text-black border-cyber-lime shadow-neon-lime' : 'text-cyber-lime border-cyber-lime/30 hover:bg-cyber-lime/10'}`}
                        >
                            {showLogs ? 'View Listings' : 'View Scan Logs'}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin space-y-4">
                    {showLogs ? (
                        <div className="bg-black/60 p-5 rounded-2xl border border-white/5 font-mono space-y-3">
                             {result.scanLogs.map((log, i) => (
                                <div key={i} className="text-[10px] text-gray-500 flex gap-3 animate-in fade-in slide-in-from-left-2" style={{animationDelay: `${i * 100}ms`}}>
                                    <span className="text-cyber-lime font-bold shrink-0">[{new Date().toLocaleTimeString('en-US', {hour12: false})}]</span>
                                    <span>{log}</span>
                                </div>
                             ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {result.listings.map((item, idx) => (
                                <div 
                                    key={idx} 
                                    className="group relative bg-white/[0.02] border border-white/10 rounded-2xl p-4 hover:border-cyber-lime/40 hover:bg-white/[0.04] transition-all duration-300 transform hover:-translate-y-1"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1 mr-4 min-w-0">
                                            <h4 className="font-bold text-white text-[13px] group-hover:text-cyber-lime transition-colors truncate tracking-tight">{item.title}</h4>
                                            <p className="text-[9px] text-gray-500 mt-1 flex items-center gap-1.5 truncate">
                                                <MapPin size={10} className="text-cyber-lime shrink-0" /> {item.address}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-xs font-mono font-bold text-cyber-lime">{item.rent}</div>
                                            <div className="text-[8px] text-gray-600 font-mono uppercase tracking-widest">Verified</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex gap-2">
                                            <span className="px-2 py-0.5 rounded-md bg-white/5 text-[8px] text-gray-400 font-mono uppercase border border-white/5">{item.bhk}</span>
                                        </div>
                                        <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-lime text-cyber-black text-[9px] font-mono font-bold hover:bg-white transition-all">
                                            SECURE_LINK <ExternalLink size={10} />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>

      {/* Market Strategy (Bottom Banner) */}
      <div className="glass-panel rounded-3xl p-6 border-l-4 border-cyber-orange bg-cyber-orange/5 shrink-0">
          <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="shrink-0">
                  <div className="p-4 bg-cyber-orange text-cyber-black rounded-2xl shadow-neon-orange">
                      <Scale size={32} />
                  </div>
              </div>
              <div className="flex-1">
                  <h3 className="text-sm font-mono font-bold text-white uppercase tracking-widest mb-2">Negotiation_Tactical_Script</h3>
                  <p className="text-xs text-gray-400 font-mono leading-relaxed italic">
                      "{result.negotiationStrategy}"
                  </p>
              </div>
              <div className="shrink-0 flex flex-col items-center justify-center p-4 bg-black/40 rounded-2xl border border-white/10 min-w-[140px]">
                  <ArrowDownCircle size={24} className="text-cyber-lime mb-1" />
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Recommended Bid</span>
                  <span className="text-lg font-bold text-white font-mono">{result.expertVerdict?.justifiedPrice}</span>
              </div>
          </div>
      </div>

      <style>{`
        .text-glow-teal { text-shadow: 0 0 15px rgba(0, 246, 255, 0.4); }
        .shadow-neon-orange { box-shadow: 0 0 15px rgba(255, 174, 66, 0.3); }
        .shadow-neon-lime { box-shadow: 0 0 15px rgba(180, 255, 92, 0.3); }
      `}</style>
    </div>
  );
};

export default RentDashboard;