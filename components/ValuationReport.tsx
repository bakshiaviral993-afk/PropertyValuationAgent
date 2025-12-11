import React, { useRef, useState, useEffect } from 'react';
import { ValuationResult, ValuationRequest } from '../types';
import { 
  MapPin, TrendingUp, Download, Loader2, Layers, Globe, Share2, FileText, Zap, Home, Car, Grid
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
  const radius = 24; // Compact radius
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
            <div className="absolute top-3 left-3 flex gap-2 z-[400]">
                <button onClick={() => setLayerType('map')} className={`p-1.5 rounded bg-black/50 backdrop-blur border border-white/10 ${layerType === 'map' ? 'text-cyber-teal' : 'text-gray-500'}`}><Layers size={14} /></button>
                <button onClick={() => setLayerType('sat')} className={`p-1.5 rounded bg-black/50 backdrop-blur border border-white/10 ${layerType === 'sat' ? 'text-cyber-teal' : 'text-gray-500'}`}><Globe size={14} /></button>
            </div>
             <div className="absolute bottom-3 right-3 bg-cyber-teal/20 backdrop-blur text-cyber-teal text-[9px] px-2 py-1 rounded border border-cyber-teal/30 font-mono shadow-neon-teal z-[400]">
                 LIVE SATELLITE FEED
             </div>
        </div>
    );
};

// --- CUSTOM RANGE CHART ---
const RangeAnalysisChart = ({ data }: { data: { label: string, value: number, highlight?: boolean }[] }) => {
    const maxVal = Math.max(...data.map(d => d.value)) * 1.15;
    return (
        <div className="w-full h-full flex items-end justify-between px-2 pb-2 gap-3">
             {data.map((item, i) => {
                 const heightPercent = Math.max(10, (item.value / maxVal) * 100);
                 return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-cyber-black/90 border border-cyber-border px-2 py-1.5 rounded text-[10px] text-white font-mono whitespace-nowrap z-20 pointer-events-none shadow-xl">
                             ₹{(item.value / 100000).toFixed(2)} L
                        </div>
                        <div className="w-4 sm:w-6 h-full flex items-end bg-white/5 rounded-t-sm relative overflow-hidden">
                             <div 
                                className={`w-full rounded-t-sm transition-all duration-1000 ease-out ${
                                    item.highlight 
                                    ? 'bg-cyber-orange shadow-[0_0_20px_rgba(255,174,66,0.5)]' 
                                    : 'bg-gray-700'
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
  const printRef = useRef<HTMLDivElement>(null);

  const [parkingCost, setParkingCost] = useState(request.parkingCharges || 0);
  const [amenityCost, setAmenityCost] = useState(request.amenitiesCharges || 0);
  const [liveEstimatedValue, setLiveEstimatedValue] = useState(result.estimatedValue);
  const [isDownloading, setIsDownloading] = useState(false);
  const [printMapImg, setPrintMapImg] = useState<string | null>(null);

  useEffect(() => {
      const baseValue = result.estimatedValue - (request.parkingCharges || 0) - (request.amenitiesCharges || 0);
      setLiveEstimatedValue(baseValue + parkingCost + amenityCost);
  }, [parkingCost, amenityCost, result.estimatedValue]);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    return `₹${(val / 100000).toFixed(2)} L`;
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current || !printRef.current) return;
    setIsDownloading(true);

    try {
        // 1. Capture the Map first (since it's a canvas in a separate component)
        if (mapContainerRef.current) {
            const mapCanvas = await html2canvas(mapContainerRef.current, {
                useCORS: true,
                scale: 1, // Capture map at 1x to save memory
                logging: false,
                backgroundColor: '#0D0F12'
            });
            setPrintMapImg(mapCanvas.toDataURL('image/jpeg', 0.8));
        }

        // Wait a tick for the image to render in the print view
        await new Promise(r => setTimeout(r, 100));

        // 2. Capture the Full Print Layout
        const canvas = await html2canvas(printRef.current, {
            useCORS: true,
            scale: 1.5, // Reduced scale for file size optimization (23MB -> ~2MB)
            backgroundColor: '#0D0F12',
            logging: false,
            windowWidth: 800, // Force desktop width
        });
        
        // 3. Compress to JPEG
        const imgData = canvas.toDataURL('image/jpeg', 0.7);
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`QuantCasa_Report_${request.projectName}.pdf`);
    } catch (e) {
        console.error("PDF Gen Error", e);
    } finally {
        setIsDownloading(false);
        setPrintMapImg(null); // Cleanup
    }
  };

  const chartData = [
    { label: 'Low', value: result.rangeLow },
    { label: 'Valuation', value: liveEstimatedValue, highlight: true },
    { label: 'High', value: result.rangeHigh },
  ];

  return (
    <div className="h-full flex flex-col font-sans gap-6 relative" ref={reportRef}>
       
       {/* --- MAIN DASHBOARD (Interactive) --- */}
       <div className="flex flex-col xl:flex-row gap-6 h-full">
            
            {/* Center Panel: Map & Valuation Core */}
            <div className="flex-1 flex flex-col gap-6">
                
                {/* 3D Map / Hero Container (Compact fixed height) */}
                <div ref={mapContainerRef} className="h-[320px] glass-panel rounded-3xl p-1 relative group overflow-hidden shrink-0">
                    <ReportMap lat={request.latitude || 28.6139} lng={request.longitude || 77.2090} />
                    
                    {/* PDF Download Button (Top Right Absolute) */}
                    <div className="absolute top-4 right-4 z-[500]" data-html2canvas-ignore>
                         <button 
                            onClick={handleDownloadPDF}
                            disabled={isDownloading}
                            className="flex items-center gap-2 px-4 py-2 bg-cyber-teal text-cyber-black rounded-lg hover:bg-white transition-all font-mono text-xs font-bold shadow-neon-teal disabled:opacity-50"
                         >
                            {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                            {isDownloading ? "GENERATING PDF..." : "DOWNLOAD REPORT"}
                         </button>
                    </div>

                    {/* Floating Valuation Card Overlay */}
                    <div className="absolute bottom-4 left-4 right-4 bg-cyber-black/80 backdrop-blur-xl border border-cyber-border rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center shadow-2xl z-[450]">
                        <div>
                            <p className="text-[10px] font-mono text-gray-400 mb-1 uppercase tracking-widest">Estimated Market Value</p>
                            <div className="text-3xl md:text-4xl font-mono font-bold text-cyber-orange text-glow-orange tracking-tighter">
                                {formatCurrency(liveEstimatedValue)}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyber-teal animate-pulse"></span>
                                <span className="text-[9px] font-mono text-cyber-teal uppercase">Algorithm Confidence High</span>
                            </div>
                        </div>
                        <div className="mt-2 md:mt-0 transform scale-90 origin-right">
                             <CircularConfidenceGauge score={result.confidenceScore} />
                        </div>
                    </div>
                </div>

                {/* Secondary Metrics Row (Compacted) */}
                <div className="h-[240px] grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
                    {/* Chart Card */}
                    <div className="glass-panel rounded-2xl p-4 flex flex-col h-full">
                         <h3 className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <TrendingUp size={12} className="text-cyber-teal" /> Range Analysis
                         </h3>
                         <div className="flex-1 min-h-0">
                            <RangeAnalysisChart data={chartData} />
                         </div>
                    </div>

                    {/* Dials Card */}
                    <div className="glass-panel rounded-2xl p-4 flex flex-col justify-center h-full">
                        <div className="flex justify-around items-center">
                             <CostDial label="PARKING" value={parkingCost} onChange={setParkingCost} max={1500000} />
                             <div className="h-12 w-px bg-white/10 mx-2"></div>
                             <CostDial label="AMENITIES" value={amenityCost} onChange={setAmenityCost} max={1000000} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Comps & Details */}
            <div className="w-full xl:w-[320px] flex flex-col gap-6 min-h-0">
                
                {/* Property Details Card */}
                <div className="glass-panel rounded-2xl p-5 border-l-2 border-l-cyber-teal shrink-0">
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

                {/* Comparables & Analysis Stack */}
                <div className="flex-1 glass-panel rounded-2xl p-5 overflow-y-auto flex flex-col gap-6 min-h-0">
                    {/* Market Comps Section */}
                    <div>
                        <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-4 flex items-center sticky top-0 bg-[#13161bb3] backdrop-blur-md py-2 z-10 border-b border-white/5">
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
                    
                    {/* Divider */}
                    <div className="h-px bg-white/10 w-full shrink-0" />

                    {/* AI Analysis Section */}
                    <div>
                         <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-3 flex items-center sticky top-0 bg-[#13161bb3] backdrop-blur-md py-2 z-10">
                            <FileText size={12} className="mr-2 text-cyber-teal" /> AI Analysis Log
                         </h3>
                         <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                            <p className="text-[10px] text-gray-400 leading-relaxed font-mono">
                                {result.valuationJustification}
                            </p>
                         </div>
                    </div>
                </div>

            </div>
       </div>

       {/* --- HIDDEN PDF PRINT LAYOUT --- */}
       {/* This layout renders off-screen, expanding all sections without scrollbars for capture */}
       <div 
         ref={printRef} 
         style={{ position: 'fixed', left: '-10000px', top: 0, width: '800px', background: '#0D0F12', color: '#98A3B3', padding: '40px' }}
         className="font-sans flex flex-col gap-8"
       >
           {/* Header */}
           <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-cyber-teal/10 p-2 rounded-xl border border-cyber-teal/20 shadow-neon-teal">
                        <Zap size={24} className="text-cyber-teal" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold font-mono text-white tracking-wider">QUANT<span className="text-cyber-teal">CASA</span></h1>
                        <p className="text-[10px] text-gray-500 font-mono">AI-POWERED REAL ESTATE VALUATION</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-mono text-gray-500">GENERATED ON</p>
                    <p className="text-sm font-bold text-white font-mono">{new Date().toLocaleDateString()}</p>
                </div>
           </div>

           {/* Map & Summary */}
           <div className="flex gap-6 h-[250px]">
               {/* Static Map Image Placeholder */}
               <div className="w-[60%] rounded-xl overflow-hidden border border-white/10 relative">
                   {printMapImg ? (
                       <img src={printMapImg} alt="Map" className="w-full h-full object-cover" />
                   ) : (
                       <div className="w-full h-full bg-black flex items-center justify-center text-xs font-mono">LOADING MAP...</div>
                   )}
                   <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 text-[10px] font-mono rounded text-cyber-teal">
                       {request.city}, {request.area}
                   </div>
               </div>

               {/* Main Value */}
               <div className="flex-1 flex flex-col justify-center bg-[#13161B] rounded-xl p-6 border border-white/5">
                   <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">Estimated Market Value</p>
                   <div className="text-4xl font-mono font-bold text-cyber-orange mb-2">
                       {formatCurrency(liveEstimatedValue)}
                   </div>
                   <div className="flex items-center gap-2 mb-4">
                        <span className="w-2 h-2 rounded-full bg-cyber-teal"></span>
                        <span className="text-[10px] font-mono text-cyber-teal uppercase">High Confidence ({result.confidenceScore}%)</span>
                   </div>
                   <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                       <div>
                           <p className="text-[9px] text-gray-500">RANGE LOW</p>
                           <p className="text-sm text-white font-mono">{formatCurrency(result.rangeLow)}</p>
                       </div>
                       <div>
                           <p className="text-[9px] text-gray-500">RANGE HIGH</p>
                           <p className="text-sm text-white font-mono">{formatCurrency(result.rangeHigh)}</p>
                       </div>
                   </div>
               </div>
           </div>

           {/* Property Attributes / Parameters */}
           <div className="bg-[#13161B] rounded-xl p-6 border border-white/5">
                <h3 className="text-xs font-mono text-white uppercase tracking-widest mb-4 flex items-center border-b border-white/5 pb-2">
                    <Grid size={12} className="mr-2 text-cyber-lime" /> Property Attributes
                </h3>
                <div className="grid grid-cols-3 gap-6">
                    <div>
                        <p className="text-[10px] text-gray-500 mb-1">PROJECT</p>
                        <p className="text-sm text-white font-bold">{request.projectName}</p>
                        <p className="text-[10px] text-gray-400">{request.builderName}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 mb-1">CONFIGURATION</p>
                        <p className="text-sm text-white font-bold">{request.bhk}</p>
                        <p className="text-[10px] text-gray-400">{request.superBuiltUpArea} sqft</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 mb-1">FLOOR & AGE</p>
                        <p className="text-sm text-white font-bold">Floor {request.floor}</p>
                        <p className="text-[10px] text-gray-400">{new Date().getFullYear() - request.constructionYear} Years Old</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 mb-1">PARKING</p>
                        <p className="text-sm text-white">{request.hasParking === 'Yes' ? 'Available' : 'None'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 mb-1">AMENITIES</p>
                        <p className="text-sm text-white">{request.hasAmenities === 'Yes' ? 'Clubhouse etc.' : 'Standard'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 mb-1">FSI</p>
                        <p className="text-sm text-white">{request.fsi}</p>
                    </div>
                </div>
           </div>

           {/* AI Justification (Full Text) */}
           <div className="bg-[#13161B] rounded-xl p-6 border border-white/5">
                <h3 className="text-xs font-mono text-white uppercase tracking-widest mb-4 flex items-center border-b border-white/5 pb-2">
                    <FileText size={12} className="mr-2 text-cyber-teal" /> AI Valuation Justification
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed font-mono text-justify">
                    {result.valuationJustification}
                </p>
           </div>

           {/* Comparables */}
           <div className="bg-[#13161B] rounded-xl p-6 border border-white/5">
                <h3 className="text-xs font-mono text-white uppercase tracking-widest mb-4 flex items-center border-b border-white/5 pb-2">
                    <Share2 size={12} className="mr-2 text-cyber-lime" /> Market Comparables Used
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    {result.comparables.map((comp, idx) => (
                        <div key={idx} className="bg-black/30 p-3 rounded border border-white/10">
                            <p className="text-xs font-bold text-white mb-1 truncate">{comp.projectName}</p>
                            <p className="text-sm font-mono text-cyber-teal mb-2">{formatCurrency(comp.price)}</p>
                            <div className="flex justify-between text-[9px] text-gray-500">
                                <span>{comp.bhk}</span>
                                <span>{comp.area} sqft</span>
                            </div>
                        </div>
                    ))}
                </div>
           </div>

           {/* Footer Disclaimer */}
           <div className="text-[8px] text-gray-600 font-mono text-center border-t border-white/5 pt-4">
               This report is generated by an AI model and is for informational purposes only. QuantCasa does not guarantee the accuracy of this valuation.
           </div>
       </div>

    </div>
  );
};

export default ValuationReport;