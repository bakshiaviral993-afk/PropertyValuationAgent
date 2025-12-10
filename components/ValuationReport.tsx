import React, { useRef, useState, useEffect } from 'react';
import { ValuationResult, ValuationRequest } from '../types';
import { 
  IndianRupee, MapPin, TrendingUp, TrendingDown, Minus, Info, 
  Building, Car, Trees, Download, Loader2, Layers, Globe, Box
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

  const radius = 36;
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
    
    // Calculate angle in degrees (0 at top)
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    
    // Map angle to value
    const newValue = Math.round(min + (angle / 360) * (max - min));
    
    // Haptic tick every 50k for demo (browser support varies, fallback to visual snap)
    if (Math.abs(newValue - value) > 10000) {
       if (navigator.vibrate) navigator.vibrate(5); 
    }

    onChange(newValue);
  };

  return (
    <div className="flex flex-col items-center">
      <div 
        className="relative w-24 h-24 cursor-pointer"
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onTouchEnd={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={(e) => isDragging && handleInteraction(e)}
        onTouchMove={(e) => isDragging && handleInteraction(e)}
        onClick={(e) => handleInteraction(e)}
      >
        <svg ref={svgRef} className="w-full h-full transform -rotate-90">
          <circle cx="48" cy="48" r={radius} stroke="#e2e8f0" strokeWidth="6" fill="transparent" />
          <circle cx="48" cy="48" r={radius} stroke="#00D4AA" strokeWidth="6" fill="transparent" 
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-75"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-full p-1 shadow-sm border border-teal-100">
             <div className="w-2 h-2 bg-teal-500 rounded-full" />
          </div>
        </div>
      </div>
      <span className="text-xs font-bold text-slate-500 uppercase mt-1">{label}</span>
      <span className="text-sm font-mono font-bold text-slate-900">₹{(value/100000).toFixed(1)}L</span>
    </div>
  );
};

const LiquidConfidenceTube = ({ score }: { score: number }) => {
  // Color Logic: 0-70 Coral, 70-90 Amber, 90+ Teal
  let colorClass = 'bg-coral-500';
  let colorHex = '#FF6B6B';
  if (score >= 90) { colorClass = 'bg-teal-500'; colorHex = '#00D4AA'; }
  else if (score >= 70) { colorClass = 'bg-amber-500'; colorHex = '#F59E0B'; }

  return (
    <div className="flex flex-col items-center">
        <div className="relative w-12 h-32 bg-slate-100 rounded-[24px] border-4 border-white shadow-inner overflow-hidden liquid-tube">
            {/* Liquid Fill */}
            <div 
                className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ease-out ${colorClass}`}
                style={{ height: `${score}%` }}
            >
                {/* Bubbles */}
                <div className="absolute bottom-0 left-2 w-2 h-2 bg-white/30 rounded-full animate-bubble-rise" style={{ animationDelay: '0s' }}></div>
                <div className="absolute bottom-0 right-3 w-3 h-3 bg-white/20 rounded-full animate-bubble-rise" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute bottom-0 left-4 w-1 h-1 bg-white/40 rounded-full animate-bubble-rise" style={{ animationDelay: '1.2s' }}></div>
            </div>
            {/* Glare */}
            <div className="absolute top-2 right-2 w-1.5 h-16 bg-white/40 rounded-full blur-[1px]"></div>
        </div>
        <span className="mt-2 text-2xl font-mono font-bold text-slate-900">{score}%</span>
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Confidence</span>
    </div>
  );
};

// Internal Map Component for Report
const ReportMap = ({ lat, lng }: { lat: number, lng: number }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [layerType, setLayerType] = useState<'map' | 'sat'>('map');
    const mapInstance = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current || !window.L) return;
        
        if (mapInstance.current) {
            mapInstance.current.remove();
        }

        const map = window.L.map(mapRef.current, { 
            zoomControl: false, 
            dragging: false, 
            scrollWheelZoom: false 
        }).setView([lat, lng], 16);
        
        const tileUrl = layerType === 'map' 
            ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

        const attribution = layerType === 'map'
            ? '&copy; OpenStreetMap'
            : '&copy; Esri';

        window.L.tileLayer(tileUrl, { attribution }).addTo(map);
        window.L.marker([lat, lng]).addTo(map);

        mapInstance.current = map;

        return () => {
             if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [lat, lng, layerType]);

    return (
        <div className="relative w-full h-48 rounded-xl overflow-hidden shadow-sm border border-slate-200">
            <div ref={mapRef} className="w-full h-full" />
            
            {/* Morph Toggle */}
            <div className="absolute bottom-3 left-3 flex bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-lg border border-slate-200 z-[400]">
                <button 
                    onClick={() => setLayerType('map')}
                    className={`p-1.5 rounded transition-colors ${layerType === 'map' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    <Layers size={14} />
                </button>
                <button 
                    onClick={() => setLayerType('sat')}
                    className={`p-1.5 rounded transition-colors ${layerType === 'sat' ? 'bg-teal-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    <Globe size={14} />
                </button>
            </div>
            
             {/* Fake 3D Badge (Simulated Feature) */}
             <div className="absolute top-3 right-3 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-1 rounded border border-white/20 font-mono">
                 3D Massing (Pro)
             </div>
        </div>
    );
};

const ValuationReport: React.FC<ValuationReportProps> = ({ result, request }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Local State for Refinement
  const [parkingCost, setParkingCost] = useState(request.parkingCharges || 0);
  const [amenityCost, setAmenityCost] = useState(request.amenitiesCharges || 0);
  const [liveEstimatedValue, setLiveEstimatedValue] = useState(result.estimatedValue);

  // Update total when dials change
  useEffect(() => {
      const baseValue = result.estimatedValue - (request.parkingCharges || 0) - (request.amenitiesCharges || 0);
      setLiveEstimatedValue(baseValue + parkingCost + amenityCost);
  }, [parkingCost, amenityCost, result.estimatedValue]);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) {
        return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(val / 100000).toFixed(2)} L`;
  };

  const formatNumber = (num: number) => {
      return new Intl.NumberFormat('en-IN').format(num);
  };

  const getSentimentIcon = (score: number) => {
      if (score > 0.3) return <TrendingUp className="text-teal-500" />;
      if (score < -0.3) return <TrendingDown className="text-coral-500" />;
      return <Minus className="text-slate-400" />;
  };

  // Adjust chart data based on live value
  const chartData = [
    { name: 'Low', value: result.rangeLow },
    { name: 'Valuation', value: liveEstimatedValue },
    { name: 'High', value: result.rangeHigh },
  ];

  const TEAL_MAIN = '#00D4AA';
  const SLATE_LIGHT = '#94a3b8';

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, 
        useCORS: true,
        logging: false,
        backgroundColor: '#F8F9FC'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; 
      const pageHeight = 297; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`QuantCasa_Valuation_${request.projectName || 'Report'}.pdf`);
    } catch (error) {
      console.error("PDF Export failed", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col font-sans">
       {/* Actions Bar */}
       <div className="p-4 md:px-6 flex justify-between items-center bg-white border-b border-slate-100 rounded-t-2xl shadow-sm z-10">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">QuantCasa v1.5</span>
          <button 
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-md transition-all disabled:opacity-70 text-sm font-semibold"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {isExporting ? 'Processing...' : 'Export PDF'}
          </button>
       </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-canvas" ref={reportRef}>
        
        {/* Header Card */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-900 via-teal-500 to-slate-900"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                      {String(request.projectName)} 
                      {request.bhk && <span className="text-xs font-bold text-slate-500 px-2 py-1 bg-slate-100 rounded uppercase tracking-wider">{String(request.bhk)}</span>}
                  </h2>
                  <div className="flex items-start text-slate-500 mt-1 space-x-1.5 text-sm">
                      <MapPin size={14} className="mt-0.5 flex-shrink-0 text-teal-500" />
                      <span>
                          {String(request.area)}, {String(request.city)}, {String(request.state)}
                      </span>
                  </div>
              </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-2">
              {/* Main Value */}
              <div className="md:col-span-5 flex flex-col justify-center border-r border-slate-100 pr-6">
                  <p className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wide">Estimated Value</p>
                  <div className="flex items-baseline space-x-1">
                      <span className="text-4xl md:text-5xl font-mono font-bold text-slate-900 tracking-tighter transition-all duration-300">
                        {formatCurrency(liveEstimatedValue)}
                      </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                      <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs font-bold rounded border border-teal-100 animate-pulse">Live Updates Active</span>
                  </div>
              </div>

              {/* Confidence Tube */}
              <div className="md:col-span-3 flex justify-center border-r border-slate-100">
                   <LiquidConfidenceTube score={result.confidenceScore} />
              </div>
              
              {/* Refine Dials (Micro-Widget) */}
              <div className="md:col-span-4 flex flex-row justify-around items-center pl-2 bg-slate-50/50 rounded-xl border border-slate-100/50 py-2">
                   <CostDial 
                      label="Parking" 
                      value={parkingCost} 
                      onChange={setParkingCost}
                      max={1500000} 
                   />
                   <CostDial 
                      label="Amenities" 
                      value={amenityCost} 
                      onChange={setAmenityCost}
                      max={1000000} 
                   />
              </div>
          </div>
        </div>

        {/* Map & Comparables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Map & Analysis (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
                 {/* Map Morph Toggle */}
                 {request.latitude && request.longitude && (
                     <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                         <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center">
                                <MapPin size={16} className="mr-2 text-teal-500"/> Location Context
                            </h3>
                         </div>
                         <ReportMap lat={request.latitude} lng={request.longitude} />
                     </div>
                 )}

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center uppercase tracking-wide">
                        <Info className="mr-2 text-teal-500" size={18} />
                        Valuation Logic
                    </h3>
                    <div className="text-sm text-slate-600 leading-relaxed font-normal">
                        {String(result.valuationJustification)}
                    </div>
                </div>
            </div>

            {/* Right Column: Comps & Charts (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
                
                {/* Comparables */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center uppercase tracking-wide">
                      <TrendingUp className="mr-2 text-teal-500" size={18} />
                      Market Comparables
                    </h3>
                    <div className="space-y-3">
                        {result.comparables.map((comp, idx) => (
                            <div key={idx} className="p-3 border border-slate-100 rounded bg-slate-50/50 flex justify-between items-center group hover:border-teal-200 transition-colors">
                                <div>
                                    <span className="block font-bold text-slate-800 text-sm">{String(comp.projectName)}</span>
                                    <span className="text-xs text-slate-500 font-mono">{comp.bhk} • {comp.area} sqft</span>
                                </div>
                                <div className="text-right">
                                    <span className="block font-mono font-bold text-teal-600 text-sm">{formatCurrency(comp.price)}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">₹{comp.pricePerSqft}/sqft</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chart Section */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <h3 className="text-base font-bold text-slate-900 mb-4 uppercase tracking-wide">Range Analysis</h3>
                  <div style={{ width: '100%', height: '180px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                              <XAxis type="number" hide />
                              <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: '#64748b' }} axisLine={false} tickLine={false} />
                              <Tooltip 
                                  formatter={(value: number) => [formatCurrency(value), '']}
                                  contentStyle={{ backgroundColor: '#0B1E3C', color: '#fff', borderRadius: '4px', border: 'none', fontFamily: 'JetBrains Mono', fontSize: '12px' }}
                                  itemStyle={{ color: '#00D4AA' }}
                              />
                              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                  {chartData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={index === 1 ? TEAL_MAIN : SLATE_LIGHT} />
                                  ))}
                              </Bar>
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-start space-x-3">
                      <div className="mt-0.5">{getSentimentIcon(result.sentimentScore)}</div>
                      <div>
                          <p className="text-xs text-slate-500 leading-tight">{String(result.sentimentAnalysis)}</p>
                      </div>
                  </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ValuationReport;