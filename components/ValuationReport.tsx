import React, { useRef, useState, useEffect } from 'react';
import { ValuationResult, ValuationRequest } from '../types';
import { 
  IndianRupee, MapPin, TrendingUp, Download, Loader2, Layers, Globe, Share2, Eye
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
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
  const radius = 32;
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
        className="relative w-20 h-20 cursor-pointer group"
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
          <circle cx="40" cy="40" r={radius} stroke="#1f2937" strokeWidth="4" fill="transparent" />
          <circle cx="40" cy="40" r={radius} stroke="#B4FF5C" strokeWidth="4" fill="transparent" 
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-75 filter drop-shadow-[0_0_4px_#B4FF5C]"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-[10px] font-mono text-cyber-lime font-bold">
            {(value/100000).toFixed(1)}L
          </div>
        </div>
      </div>
      <span className="text-[10px] font-bold text-gray-500 uppercase mt-1 tracking-wider">{label}</span>
    </div>
  );
};

const CircularConfidenceGauge = ({ score }: { score: number }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  // Dynamic color
  const color = score > 85 ? '#00F6FF' : score > 60 ? '#B4FF5C' : '#FFAE42';

  return (
    <div className="relative flex flex-col items-center justify-center w-32 h-32">
        <svg className="w-full h-full transform -rotate-90">
            <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#13161B" />
                    <stop offset="100%" stopColor={color} />
                </linearGradient>
            </defs>
            {/* Background Track */}
            <circle cx="64" cy="64" r={radius} stroke="#13161B" strokeWidth="6" fill="transparent" />
            {/* Value Arc */}
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

const ReportMap = ({ lat, lng }: { lat: number, lng: number }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [layerType, setLayerType] = useState<'map' | 'sat'>('map');
    const mapInstance = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current || !window.L) return;
        if (mapInstance.current) mapInstance.current.remove();

        const map = window.L.map(mapRef.current, { zoomControl: false, dragging: false, scrollWheelZoom: false }).setView([lat, lng], 17);
        const tileUrl = layerType === 'map' 
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

        window.L.tileLayer(tileUrl, { attribution: '' }).addTo(map);
        window.L.marker([lat, lng]).addTo(map);
        mapInstance.current = map;
        return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
    }, [lat, lng, layerType]);

    return (
        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-cyber-border shadow-inner">
            <div ref={mapRef} className="w-full h-full grayscale opacity-80 hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute top-3 left-3 flex gap-2">
                <button onClick={() => setLayerType('map')} className={`p-1.5 rounded bg-black/50 backdrop-blur border border-white/10 ${layerType === 'map' ? 'text-cyber-teal' : 'text-gray-500'}`}><Layers size={14} /></button>
                <button onClick={() => setLayerType('sat')} className={`p-1.5 rounded bg-black/50 backdrop-blur border border-white/10 ${layerType === 'sat' ? 'text-cyber-teal' : 'text-gray-500'}`}><Globe size={14} /></button>
            </div>
             <div className="absolute bottom-3 right-3 bg-cyber-teal/20 backdrop-blur text-cyber-teal text-[9px] px-2 py-1 rounded border border-cyber-teal/30 font-mono shadow-neon-teal">
                 LIVE SATELLITE FEED
             </div>
        </div>
    );
};

const ValuationReport: React.FC<ValuationReportProps> = ({ result, request }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [parkingCost, setParkingCost] = useState(request.parkingCharges || 0);
  const [amenityCost, setAmenityCost] = useState(request.amenitiesCharges || 0);
  const [liveEstimatedValue, setLiveEstimatedValue] = useState(result.estimatedValue);

  useEffect(() => {
      const baseValue = result.estimatedValue - (request.parkingCharges || 0) - (request.amenitiesCharges || 0);
      setLiveEstimatedValue(baseValue + parkingCost + amenityCost);
  }, [parkingCost, amenityCost, result.estimatedValue]);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    return `₹${(val / 100000).toFixed(2)} L`;
  };

  const chartData = [
    { name: 'Low', value: result.rangeLow },
    { name: 'Valuation', value: liveEstimatedValue },
    { name: 'High', value: result.rangeHigh },
  ];

  return (
    <div className="h-full flex flex-col font-sans gap-6" ref={reportRef}>
       
       {/* 1. Main Dashboard Grid */}
       <div className="flex flex-col xl:flex-row gap-6 h-full">
            
            {/* Center Panel: Map & Valuation Core */}
            <div className="flex-1 flex flex-col gap-6">
                
                {/* 3D Map / Hero Container */}
                <div className="flex-1 min-h-[300px] glass-panel rounded-3xl p-1 relative group overflow-hidden">
                    <ReportMap lat={request.latitude || 28.6139} lng={request.longitude || 77.2090} />
                    
                    {/* Floating Valuation Card Overlay */}
                    <div className="absolute bottom-6 left-6 right-6 bg-cyber-black/80 backdrop-blur-xl border border-cyber-border rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center shadow-2xl">
                        <div>
                            <p className="text-xs font-mono text-gray-400 mb-1 uppercase tracking-widest">Estimated Market Value</p>
                            <div className="text-4xl md:text-5xl font-mono font-bold text-cyber-orange text-glow-orange tracking-tighter">
                                {formatCurrency(liveEstimatedValue)}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="w-2 h-2 rounded-full bg-cyber-teal animate-pulse"></span>
                                <span className="text-[10px] font-mono text-cyber-teal uppercase">Algorithm Confidence High</span>
                            </div>
                        </div>
                        <div className="mt-4 md:mt-0">
                             <CircularConfidenceGauge score={result.confidenceScore} />
                        </div>
                    </div>
                </div>

                {/* Secondary Metrics Row */}
                <div className="h-[180px] grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Chart Card */}
                    <div className="glass-panel rounded-2xl p-5 flex flex-col">
                         <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <TrendingUp size={12} className="text-cyber-teal" /> Range Analysis
                         </h3>
                         <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" hide />
                                    <Tooltip 
                                        cursor={{fill: 'transparent'}}
                                        contentStyle={{ backgroundColor: '#13161B', border: '1px solid #333', color: '#fff', fontSize: '12px' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 1 ? '#FFAE42' : '#333'} className={index === 1 ? 'filter drop-shadow-[0_0_4px_#FFAE42]' : ''} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                         </div>
                    </div>

                    {/* Dials Card */}
                    <div className="glass-panel rounded-2xl p-5 flex flex-col justify-center">
                        <div className="flex justify-around items-center">
                             <CostDial label="PARKING" value={parkingCost} onChange={setParkingCost} max={1500000} />
                             <div className="h-12 w-px bg-white/10 mx-2"></div>
                             <CostDial label="AMENITIES" value={amenityCost} onChange={setAmenityCost} max={1000000} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Comps & Details */}
            <div className="w-full xl:w-[320px] flex flex-col gap-6">
                
                {/* Property Details Card */}
                <div className="glass-panel rounded-2xl p-5 border-l-2 border-l-cyber-teal">
                    <h3 className="text-white font-bold text-lg mb-1">{request.projectName}</h3>
                    <div className="flex items-center text-xs text-gray-400 font-mono mb-4">
                        <MapPin size={12} className="mr-1 text-cyber-teal" />
                        {request.area}, {request.city}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                        <div className="p-2 bg-white/5 rounded border border-white/5">
                            <span className="block text-gray-500 text-[10px]">CONFIG</span>
                            <span className="text-white">{request.bhk || 'N/A'}</span>
                        </div>
                        <div className="p-2 bg-white/5 rounded border border-white/5">
                            <span className="block text-gray-500 text-[10px]">SIZE</span>
                            <span className="text-white">{request.superBuiltUpArea} sqft</span>
                        </div>
                        <div className="p-2 bg-white/5 rounded border border-white/5">
                            <span className="block text-gray-500 text-[10px]">FLOOR</span>
                            <span className="text-white">{request.floor}</span>
                        </div>
                         <div className="p-2 bg-white/5 rounded border border-white/5">
                            <span className="block text-gray-500 text-[10px]">AGE</span>
                            <span className="text-white">{new Date().getFullYear() - request.constructionYear} yrs</span>
                        </div>
                    </div>
                </div>

                {/* Comparables Stack */}
                <div className="flex-1 glass-panel rounded-2xl p-5 overflow-y-auto">
                    <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                        <Share2 size={12} className="mr-2 text-cyber-lime" /> Market Comps
                    </h3>
                    <div className="space-y-3">
                        {result.comparables.map((comp, idx) => (
                            <div key={idx} className="group relative p-4 bg-cyber-black border border-cyber-border rounded-xl hover:border-cyber-teal/50 transition-all duration-300 hover:shadow-neon-teal">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-white text-sm">{comp.projectName}</span>
                                    <span className="font-mono text-cyber-teal text-xs font-bold">{formatCurrency(comp.price)}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-[10px] text-gray-500 font-mono">
                                        {comp.bhk} • {comp.area} sqft
                                    </div>
                                    <div className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-gray-400 font-mono">
                                        ₹{comp.pricePerSqft}/sqft
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                 {/* Logic / Sentiment Text */}
                 <div className="glass-panel rounded-2xl p-5">
                     <p className="text-[10px] text-gray-400 leading-relaxed font-mono">
                         <span className="text-cyber-lime font-bold block mb-1">AI ANALYSIS LOG:</span>
                         {result.valuationJustification.slice(0, 150)}...
                     </p>
                 </div>

            </div>
       </div>
    </div>
  );
};

export default ValuationReport;