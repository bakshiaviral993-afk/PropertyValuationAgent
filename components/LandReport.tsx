
import React, { useState, useEffect, useRef } from 'react';
import { LandResult, LandListing } from '../types';
import { 
  Map, ExternalLink, Globe, LayoutDashboard, Map as MapIcon, 
  Bookmark, ImageIcon, Loader2, Zap, Info, Volume2, Share2, 
  FileText, CheckCircle2, MapPin
} from 'lucide-react';
import { generatePropertyImage, getSpeech } from '../services/geminiService';
import { decodeAudioData, decode } from '../utils/audioUtils';

// Senior Dev Note: Real-time image generation using gemini-2.5-flash-image
const AIPropertyImage = ({ title, address, type }: { title: string, address: string, type: string }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setLoading(true);
    const prompt = `Aerial real estate photograph of: ${type} land named ${title} located in ${address}`;
    const url = await generatePropertyImage(prompt);
    setImgUrl(url);
    setLoading(false);
  };

  const placeholderUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${title}&backgroundColor=13161B&shapeColor=FFAE42`;

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
            className="flex items-center gap-2 px-4 py-2 bg-orange-100 border border-orange-200 rounded-full text-orange-700 text-[10px] font-bold hover:bg-orange-500 hover:text-white transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />} 
            {loading ? 'GENERATING...' : 'AI PREVIEW'}
          </button>
        </div>
      )}
    </div>
  );
};

const DashboardMap = ({ listings = [] }: { listings?: LandListing[] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    const L = (window as any).L;
    if (!mapRef.current || !L) return;
    if (mapInstance.current) mapInstance.current.remove();

    const safeListings = listings || [];
    const avgLat = safeListings.length > 0 ? safeListings.reduce((acc, l) => acc + (l.latitude || 0), 0) / safeListings.length : 19.0760;
    const avgLng = safeListings.length > 0 ? safeListings.reduce((acc, l) => acc + (l.longitude || 0), 0) / safeListings.length : 72.8777;

    const map = L.map(mapRef.current, { zoomControl: false }).setView([avgLat, avgLng], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

    safeListings.forEach((item, idx) => {
      if (item.latitude && item.longitude) {
        L.marker([item.latitude, item.longitude]).addTo(map).bindTooltip(item.title);
      }
    });

    mapInstance.current = map;
    return () => { if (mapInstance.current) mapInstance.current.remove(); };
  }, [listings]);

  return (
    <div className="relative w-full h-[400px] rounded-3xl overflow-hidden border border-white/10 shadow-neo-glow">
      <div ref={mapRef} className="w-full h-full grayscale opacity-80" />
    </div>
  );
};

interface LandReportProps {
  result: LandResult;
}

const LandReport: React.FC<LandReportProps> = ({ result }) => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'map'>('dashboard');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const listings = result.listings || [];

  useEffect(() => {
    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const handleListen = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const summary = `Performing land valuation analysis. This plot has an estimated total value of ${result.landValue}, at a rate of ${result.perSqmValue} per square meter. The projected development ROI is ${result.devROI}. Based on zoning and regulatory markers, my confidence score is ${result.confidenceScore} percent. ${result.zoningAnalysis}.`;
      
      const base64Audio = await getSpeech(summary);
      if (base64Audio) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = audioContextRef.current;
        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (err) {
      console.error(err);
      setIsSpeaking(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-right-8 duration-1000">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-neo-pink/10 rounded-2xl border border-neo-pink/20">
            <Map size={24} className="text-neo-pink" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Land Asset Report</h2>
            <p className="text-sm text-gray-500">ROI-focused plot valuation</p>
          </div>
        </div>
        
        <div className="flex gap-2">
           <button 
             onClick={handleListen}
             disabled={isSpeaking}
             className={`p-3 rounded-xl transition-all border ${isSpeaking ? 'bg-neo-pink text-white border-neo-pink animate-pulse' : 'bg-white/5 border-white/10 text-neo-pink hover:bg-white/10'}`}
             title="Listen to AI Summary"
           >
              {isSpeaking ? <Loader2 size={20} className="animate-spin" /> : <Volume2 size={20}/>}
           </button>
           <button onClick={() => setViewMode('dashboard')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all border ${viewMode === 'dashboard' ? 'bg-neo-pink text-white border-neo-pink shadow-neo-glow' : 'bg-white/5 text-gray-400 border-white/10'}`}>
            DASHBOARD
          </button>
          <button onClick={() => setViewMode('map')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all border ${viewMode === 'map' ? 'bg-neo-pink text-white border-neo-pink shadow-neo-glow' : 'bg-white/5 text-gray-400 border-white/10'}`}>
            MAP VIEW
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-[32px] p-6 border border-white/10 shadow-glass-3d">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Total Valuation</span>
          <div className="text-2xl font-black text-white tracking-tighter">{result.landValue}</div>
        </div>
        <div className="bg-white/5 rounded-[32px] p-6 border border-white/10 shadow-glass-3d">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Per Sqm</span>
          <div className="text-2xl font-black text-white tracking-tighter">{result.perSqmValue}</div>
        </div>
        <div className="bg-white/5 rounded-[32px] p-6 border border-white/10 shadow-glass-3d">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Dev ROI</span>
          <div className="text-2xl font-black text-neo-neon tracking-tighter">{result.devROI}</div>
        </div>
        <div className="bg-white/5 rounded-[32px] p-6 border border-white/10 shadow-glass-3d">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Confidence</span>
          <div className="text-2xl font-black text-white tracking-tighter">{result.confidenceScore}%</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-10 scrollbar-hide">
        {viewMode === 'dashboard' ? (
          <div className="space-y-8">
            <div className="bg-neo-pink/5 rounded-[32px] p-8 border border-neo-pink/20 shadow-neo-glow">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Zap size={20} className="text-neo-pink" /> Strategic Analysis
              </h3>
              <p className="text-gray-300 leading-relaxed italic border-l-2 border-neo-pink/30 pl-4 py-1">
                "{result.valuationJustification}"
              </p>
              <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap items-center gap-6">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase block tracking-widest mb-1">Zoning Status</span>
                  <span className="text-sm font-black text-white uppercase">{result.zoningAnalysis}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase block tracking-widest mb-1">Strategy</span>
                  <span className="text-sm font-black text-white uppercase">{result.negotiationStrategy}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((item, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-[32px] p-6 shadow-glass-3d hover:border-neo-pink/40 transition-all group">
                  <AIPropertyImage title={item.title} address={item.address} type="Plot" />
                  <div className="mb-4">
                    <h4 className="font-bold text-white line-clamp-1 group-hover:text-neo-pink transition-colors">{item.title}</h4>
                    {/* Fix: MapPin component correctly referenced after import */}
                    <p className="text-xs text-gray-500 truncate mt-1 flex items-center gap-1"><MapPin size={10}/> {item.address}</p>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-lg font-black text-neo-pink">{item.price}</span>
                      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{item.size}</span>
                    </div>
                  </div>
                  <a href={item.sourceUrl} target="_blank" rel="noopener" className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 text-sm font-bold flex items-center justify-center gap-2 hover:bg-neo-pink hover:text-white hover:border-neo-pink transition-all">
                    View Plot <ExternalLink size={14} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <DashboardMap listings={listings} />
        )}
      </div>
    </div>
  );
};

export default LandReport;
