
import React, { useRef, useState, useEffect } from 'react';
import { ValuationResult, ValuationRequest, Comparable } from '../types';
import { 
  MapPin, TrendingUp, Download, Loader2, Layers, Globe, Share2, FileText, Zap, Home, Car, Grid, Info, Building2, Star, Map as MapIcon, Building, LandPlot, Gem, Navigation, Map
} from 'lucide-react';
// @ts-ignore
import { jsPDF } from 'jspdf';
// @ts-ignore
import html2canvas from 'html2canvas';

interface ValuationReportProps {
  result: ValuationResult;
  request: ValuationRequest;
}

// --- MICRO-WIDGETS ---

const CostDial = ({ 
  label, 
  value, 
  onChange, 
  min = 0, 
  max = 1000000 
}: { 
  label: string, 
  value: number, 
  onChange: (val: number) => void, 
  min?: number, 
  max?: number 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const radius = 24; 
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const strokeDashoffset = circumference - percentage * circumference;

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const x = clientX - (rect.left + rect.width / 2);
    const y = clientY - (rect.top + rect.height / 2);
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    onChange(Math.round(min + (angle / 360) * (max - min)));
  };

  return (
    <div className="flex flex-col items-center">
      <div 
        className="relative w-16 h-16 cursor-pointer group"
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onTouchEnd={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={(e) => isDragging && handleInteraction(e)}
        onTouchMove={(e) => isDragging && handleInteraction(e)}
        onClick={(e) => handleInteraction(e)}
      >
        <svg ref={svgRef} className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]">
          <circle cx="32" cy="32" r={radius} stroke="#1f2937" strokeWidth="4" fill="transparent" />
          <circle cx="32" cy="32" r={radius} stroke="#B4FF5C" strokeWidth="4" fill="transparent" 
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-75 filter drop-shadow-[0_0_4px_#B4FF5C]"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-[9px] font-mono text-cyber-lime font-bold">
            {(value/100000).toFixed(1)}L
          </div>
        </div>
      </div>
      <span className="text-[9px] font-bold text-gray-500 uppercase mt-1 tracking-wider">{label}</span>
    </div>
  );
};

const CircularConfidenceGauge = ({ score }: { score: number }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score > 85 ? '#00F6FF' : score > 60 ? '#B4FF5C' : '#FFAE42';

  return (
    <div className="relative flex flex-col items-center justify-center w-32 h-32">
        <svg className="w-full h-full transform -rotate-90">
            <circle cx="64" cy="64" r={radius} stroke="#13161B" strokeWidth="6" fill="transparent" />
            <circle 
                cx="64" cy="64" r={radius} 
                stroke={color} 
                strokeWidth="6" 
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{ filter: `drop-shadow(0 0 8px ${color})` }}
            />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-mono font-bold text-white drop-shadow-md">{score}%</span>
            <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Confidence</span>
        </div>
    </div>
  );
};

const ReportMap = ({ lat, lng, comparables }: { lat: number, lng: number, comparables: Comparable[] }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [layerType, setLayerType] = useState<'dark' | 'standard' | 'topo'>('dark');
    const mapInstance = useRef<any>(null);

    useEffect(() => {
        const L = (window as any).L;
        if (!mapRef.current || !L) return;
        if (mapInstance.current) mapInstance.current.remove();

        const map = L.map(mapRef.current, { zoomControl: false, dragging: true, scrollWheelZoom: false }).setView([lat, lng], 14);
        
        let tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        if (layerType === 'standard') tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        if (layerType === 'topo') tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';

        L.tileLayer(tileUrl, { attribution: '© OSM' }).addTo(map);

        // Subject Marker
        const subjectIcon = L.divIcon({
            className: 'custom-subject-icon',
            html: `<div class="w-10 h-10 -ml-5 -mt-5 flex items-center justify-center"><div class="absolute w-8 h-8 bg-cyber-teal/20 border border-cyber-teal rounded-full animate-ping"></div><div class="relative w-5 h-5 bg-cyber-teal rounded-full border-2 border-white shadow-[0_0_15px_#00F6FF]"></div></div>`,
            iconSize: [0, 0]
        });
        L.marker([lat, lng], { icon: subjectIcon }).addTo(map);

        comparables.forEach((comp, idx) => {
            if (comp.latitude && comp.longitude) {
                const compIcon = L.divIcon({
                    className: 'comp-marker-icon',
                    html: `<div class="w-6 h-6 -ml-3 -mt-3 bg-cyber-lime border-2 border-cyber-black rounded-full shadow-[0_0_10px_#B4FF5C] flex items-center justify-center text-[10px] text-cyber-black font-bold font-mono transition-transform hover:scale-125">${idx + 1}</div>`,
                    iconSize: [0, 0]
                });
                L.marker([comp.latitude, comp.longitude], { icon: compIcon }).addTo(map)
                  .bindTooltip(`<div class="p-2 font-mono text-[10px] bg-black text-white rounded border border-white/10 uppercase">${comp.projectName}</div>`);
            }
        });

        mapInstance.current = map;
        return () => { if (mapInstance.current) mapInstance.current.remove(); };
    }, [lat, lng, layerType, comparables]);

    return (
        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-cyber-border">
            <div ref={mapRef} className="w-full h-full grayscale opacity-80 hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute top-3 left-3 flex flex-col gap-2 z-[400]">
                <button 
                  onClick={() => setLayerType('dark')} 
                  className={`p-2 rounded-xl backdrop-blur-md border transition-all ${layerType === 'dark' ? 'bg-cyber-teal text-cyber-black border-cyber-teal shadow-neon-teal' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white'}`}
                >
                  <Layers size={16} />
                </button>
                <button 
                  onClick={() => setLayerType('standard')} 
                  className={`p-2 rounded-xl backdrop-blur-md border transition-all ${layerType === 'standard' ? 'bg-cyber-teal text-cyber-black border-cyber-teal shadow-neon-teal' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white'}`}
                >
                  <MapIcon size={16} />
                </button>
                <button 
                  onClick={() => setLayerType('topo')} 
                  className={`p-2 rounded-xl backdrop-blur-md border transition-all ${layerType === 'topo' ? 'bg-cyber-teal text-cyber-black border-cyber-teal shadow-neon-teal' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white'}`}
                >
                  <Globe size={16} />
                </button>
            </div>
        </div>
    );
};

// --- RANGE CHART & REPORT COMPONENT (Rest same as original, keeping structural integrity) ---
const RangeAnalysisChart = ({ data }: { data: { label: string, value: number, highlight?: boolean }[] }) => {
    const maxVal = Math.max(...data.map(d => d.value)) * 1.15;
    return (
        <div className="w-full h-full flex items-end justify-between px-2 pb-2 gap-3">
             {data.map((item, i) => {
                 const heightPercent = Math.max(10, (item.value / maxVal) * 100);
                 return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                        <div className="w-4 sm:w-6 h-full flex items-end bg-white/5 rounded-t-sm relative overflow-hidden">
                             <div 
                                className={`w-full rounded-t-sm transition-all duration-1000 ease-out ${
                                    item.highlight ? 'bg-cyber-orange shadow-[0_0_20px_rgba(255,174,66,0.5)]' : 'bg-gray-700'
                                }`}
                                style={{ height: `${heightPercent}%` }}
                             />
                        </div>
                        <div className={`mt-3 text-[9px] font-mono uppercase tracking-widest ${item.highlight ? 'text-cyber-orange font-bold' : 'text-gray-500'}`}>
                            {item.label}
                        </div>
                    </div>
                 )
             })}
        </div>
    )
};

const ValuationReport: React.FC<ValuationReportProps> = ({ result, request }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [parkingCost, setParkingCost] = useState(request.parkingCharges || 0);
  const [amenityCost, setAmenityCost] = useState(request.amenitiesCharges || 0);
  const [liveValue, setLiveValue] = useState(result.estimatedValue);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
      const base = result.estimatedValue - (request.parkingCharges || 0) - (request.amenitiesCharges || 0);
      setLiveValue(base + parkingCost + amenityCost);
  }, [parkingCost, amenityCost, result.estimatedValue]);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    return `₹${(val / 100000).toFixed(2)} L`;
  };

  const chartData = [
    { label: 'Low', value: result.rangeLow },
    { label: 'Valuation', value: liveValue, highlight: true },
    { label: 'High', value: result.rangeHigh },
  ];

  return (
    <div className="h-full flex flex-col font-sans gap-6 relative" ref={reportRef}>
       <div className="flex flex-col xl:flex-row gap-6 h-full">
            <div className="flex-1 flex flex-col gap-6">
                <div ref={mapContainerRef} className="h-[320px] glass-panel rounded-3xl p-1 relative group overflow-hidden shrink-0">
                    <ReportMap 
                        lat={request.latitude || 18.9219} 
                        lng={request.longitude || 72.8347} 
                        comparables={result.comparables} 
                    />
                    <div className="absolute bottom-4 left-4 right-4 bg-cyber-black/80 backdrop-blur-xl border border-cyber-border rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center z-[450]">
                        <div>
                            <p className="text-[10px] font-mono text-gray-400 mb-1 uppercase tracking-widest">Estimated Asset Valuation</p>
                            <div className="text-3xl md:text-4xl font-mono font-bold text-cyber-orange text-glow-orange tracking-tighter">
                                {formatCurrency(liveValue)}
                            </div>
                        </div>
                        <div className="mt-2 md:mt-0 transform scale-90">
                             <CircularConfidenceGauge score={result.confidenceScore} />
                        </div>
                    </div>
                </div>
                <div className="h-[240px] grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-panel rounded-2xl p-4 flex flex-col">
                         <h3 className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <TrendingUp size={12} className="text-cyber-teal" /> Market Spectrum
                         </h3>
                         <div className="flex-1 min-h-0">
                            <RangeAnalysisChart data={chartData} />
                         </div>
                    </div>
                    <div className="glass-panel rounded-2xl p-4 flex flex-col justify-center">
                        <div className="flex justify-around items-center">
                             <CostDial label="PARKING" value={parkingCost} onChange={setParkingCost} max={1500000} />
                             <div className="h-12 w-px bg-white/10 mx-2"></div>
                             <CostDial label="AMENITIES" value={amenityCost} onChange={setAmenityCost} max={1000000} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-full xl:w-[320px] flex flex-col gap-6 min-h-0">
                <div className="glass-panel rounded-2xl p-5 border-l-2 border-l-cyber-teal">
                    <h3 className="text-white font-bold text-lg mb-1">{request.projectName}</h3>
                    <div className="flex items-center text-xs text-gray-400 font-mono mb-4">
                        <MapPin size={12} className="mr-1 text-cyber-teal" />
                        {request.area}, {request.city}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                        <div className="p-2 bg-white/5 rounded">
                            <span className="block text-gray-500 text-[10px]">AREA</span>
                            <span className="text-white">{request.superBuiltUpArea} SQFT</span>
                        </div>
                         <div className="p-2 bg-white/5 rounded">
                            <span className="block text-gray-500 text-[10px]">VINTAGE</span>
                            <span className="text-white">{new Date().getFullYear() - request.constructionYear} YRS</span>
                        </div>
                    </div>
                </div>
                <div className="flex-1 glass-panel rounded-2xl p-5 overflow-y-auto flex flex-col gap-6 min-h-0">
                    <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-4 flex items-center sticky top-0 bg-[#13161b] py-2 z-10">
                        <Share2 size={12} className="mr-2 text-cyber-lime" /> Peer Comparables
                    </h3>
                    <div className="space-y-3">
                        {result.comparables.map((comp, idx) => (
                            <div key={idx} className="p-4 bg-cyber-black border border-cyber-border rounded-xl hover:border-cyber-teal/50 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-white text-sm uppercase truncate">{comp.projectName}</span>
                                    <span className="font-mono text-cyber-teal text-xs font-bold">{formatCurrency(comp.price)}</span>
                                </div>
                                <div className="text-[10px] text-gray-500 font-mono">
                                    {comp.bhk} • {comp.area} SQFT
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
       </div>
    </div>
  );
};

export default ValuationReport;
