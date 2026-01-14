
import React, { useRef, useState, useEffect } from 'react';
import { ValuationResult, ValuationRequest, Comparable } from '../types';
import { 
  MapPin, TrendingUp, Download, Loader2, Layers, Globe, Share2, FileText, Zap, Home, Car, Grid, Info, Building2, Star, Map as MapIcon, Building, LandPlot, Gem, Navigation
} from 'lucide-react';
// @ts-ignore
import { jsPDF } from 'jspdf';
// @ts-ignore
import html2canvas from 'html2canvas';

interface ValuationReportProps {
  result: ValuationResult;
  request: ValuationRequest;
}

const formatCurrency = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${val.toLocaleString('en-IN')}`;
};

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

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

const GooglePropertyMap = ({ lat, lng, comparables }: { lat: number, lng: number, comparables: Comparable[] }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => console.warn("Geolocation denied.")
        );
    }, []);

    useEffect(() => {
        const initMap = async () => {
            if (!mapRef.current || !(window as any).google) return;
            
            const { Map } = await (window as any).google.maps.importLibrary("maps") as any;
            const { AdvancedMarkerElement, PinElement } = await (window as any).google.maps.importLibrary("marker") as any;

            const mapOptions = {
                center: { lat, lng },
                zoom: 14,
                disableDefaultUI: true,
                styles: [
                    { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
                    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
                    { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
                    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
                    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#303030" }] },
                    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
                ]
            };

            const map = new Map(mapRef.current, mapOptions);

            if (userLoc) {
                const userPin = new PinElement({ background: "#FF6B9D", borderColor: "#fff", glyphColor: "#fff", scale: 0.8 });
                new AdvancedMarkerElement({ map, position: userLoc, title: "Your Location", content: userPin.element });
            }

            const subjectPin = new PinElement({ background: "#585FD8", borderColor: "#fff", glyphColor: "#fff", scale: 1.2 });
            new AdvancedMarkerElement({ map, position: { lat, lng }, title: "Target Asset", content: subjectPin.element });

            comparables.forEach((comp) => {
                if (comp.latitude && comp.longitude) {
                    const compPin = new PinElement({ background: "#B4FF5C", borderColor: "#000", glyphColor: "#000", scale: 0.9 });
                    new AdvancedMarkerElement({ map, position: { lat: comp.latitude, lng: comp.longitude }, title: comp.projectName, content: compPin.element });
                }
            });
        };

        initMap();
    }, [lat, lng, comparables, userLoc]);

    return (
        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 group">
            <div ref={mapRef} className="w-full h-full" />
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                <div className="bg-neo-bg/80 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-neo-glow">
                    <span className="text-[8px] font-black text-neo-neon uppercase block mb-1">Spatial Context</span>
                    <p className="text-[10px] text-white font-bold">{comparables.length} Grounded Nodes</p>
                </div>
            </div>
        </div>
    );
};

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
                                    item.highlight ? 'bg-neo-neon shadow-[0_0_20px_rgba(88,95,216,0.5)]' : 'bg-gray-700'
                                }`}
                                style={{ height: `${heightPercent}%` }}
                             />
                        </div>
                        <div className={`mt-3 text-[9px] font-mono uppercase tracking-widest ${item.highlight ? 'text-neo-neon font-bold' : 'text-gray-500'}`}>
                            {item.label}
                        </div>
                    </div>
                 )
             })}
        </div>
    )
};

const ValuationReport: React.FC<ValuationReportProps> = ({ result, request }) => {
  const [parkingCost, setParkingCost] = useState(request.parkingCharges || 0);
  const [amenityCost, setAmenityCost] = useState(request.amenitiesCharges || 0);
  const [liveValue, setLiveValue] = useState(result.estimatedValue);
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((p) => {
      setUserCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
    });
  }, []);

  useEffect(() => {
      const base = result.estimatedValue - (request.parkingCharges || 0) - (request.amenitiesCharges || 0);
      setLiveValue(base + parkingCost + amenityCost);
  }, [parkingCost, amenityCost, result.estimatedValue]);

  const chartData = [
    { label: 'Low', value: result.rangeLow },
    { label: 'Valuation', value: liveValue, highlight: true },
    { label: 'High', value: result.rangeHigh },
  ];

  return (
    <div className="h-full flex flex-col font-sans gap-6 relative">
       <div className="flex flex-col xl:flex-row gap-6 h-full">
            <div className="flex-1 flex flex-col gap-6">
                <div className="h-[360px] bg-white/5 rounded-3xl p-1 relative group overflow-hidden shrink-0 border border-white/5">
                    <GooglePropertyMap 
                        lat={request.latitude || 18.9219} 
                        lng={request.longitude || 72.8347} 
                        comparables={result.comparables} 
                    />
                    <div className="absolute bottom-6 left-6 right-6 bg-neo-bg/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center z-[20]">
                        <div>
                            <p className="text-[10px] font-black text-gray-500 mb-1 uppercase tracking-widest">Ground-Zero Asset Valuation</p>
                            <div className="text-3xl md:text-4xl font-black text-white tracking-tighter">
                                {formatCurrency(liveValue)}
                            </div>
                        </div>
                        <div className="mt-2 md:mt-0 transform scale-90">
                             <CircularConfidenceGauge score={result.confidenceScore} />
                        </div>
                    </div>
                </div>
                <div className="h-[200px] grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col">
                         <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <TrendingUp size={12} className="text-neo-neon" /> Market Spectrum
                         </h3>
                         <div className="flex-1 min-h-0">
                            <RangeAnalysisChart data={chartData} />
                         </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-center">
                        <div className="flex justify-around items-center">
                             <CostDial label="PARKING" value={parkingCost} onChange={setParkingCost} max={1500000} />
                             <div className="h-12 w-px bg-white/10 mx-2"></div>
                             <CostDial label="AMENITIES" value={amenityCost} onChange={setAmenityCost} max={1000000} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-full xl:w-[360px] flex flex-col gap-6 min-h-0">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 border-l-4 border-l-neo-neon">
                    <h3 className="text-white font-black text-lg mb-1 uppercase tracking-tight">{request.projectName}</h3>
                    <div className="flex items-center text-xs text-gray-400 font-bold mb-4 uppercase tracking-widest">
                        <MapPin size={12} className="mr-2 text-neo-neon" />
                        {request.area}, {request.city}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs font-black uppercase tracking-widest">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="block text-gray-500 text-[8px] mb-1">BUILDUP AREA</span>
                            <span className="text-white">{request.superBuiltUpArea} SQFT</span>
                        </div>
                         <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="block text-gray-500 text-[8px] mb-1">ASSET AGE</span>
                            <span className="text-white">{new Date().getFullYear() - request.constructionYear} YRS</span>
                        </div>
                    </div>
                </div>
                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 overflow-y-auto flex flex-col gap-6 min-h-0 scrollbar-hide">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center sticky top-0 bg-neo-bg/95 py-2 z-10 border-b border-white/5">
                        PEER COMPARABLES (ZOPA)
                    </h3>
                    <div className="space-y-4">
                        {result.comparables.map((comp, idx) => {
                            const distance = userCoords && comp.latitude ? getDistance(userCoords.lat, userCoords.lng, comp.latitude, comp.longitude) : null;
                            return (
                                <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-neo-neon/50 transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-black text-white text-sm uppercase truncate pr-4">{comp.projectName}</span>
                                        <span className="font-black text-neo-neon text-xs">{formatCurrency(comp.price)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[8px] text-gray-500 font-black uppercase tracking-widest">
                                        <span>{comp.bhk} • {comp.area} SQFT</span>
                                        {distance !== null && (
                                            <span className="flex items-center gap-1 text-neo-pink">
                                                <Navigation size={8} /> {distance.toFixed(1)} KM AWAY
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
       </div>
    </div>
  );
};

export default ValuationReport;
