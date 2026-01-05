
import React, { useState, useEffect, useRef } from 'react';
import { RentResult, RentalListing } from '../types';
import { 
  MapPin, ExternalLink, Zap, Globe, TrendingUp, Calculator, Info, Layers, 
  Map as MapIcon, Building2, LayoutDashboard, Bookmark, ImageIcon, Loader2, 
  Volume2, Share2, FileText, CheckCircle2
} from 'lucide-react';
import { generatePropertyImage, getSpeech } from '../services/geminiService';
import { decodeAudioData, decode } from '../utils/audioUtils';

const AIPropertyImage = ({ title, address, type }: { title: string, address: string, type: string }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setLoading(true);
    const prompt = `${type} rental property named ${title} located in ${address}`;
    const url = await generatePropertyImage(prompt);
    setImgUrl(url);
    setLoading(false);
  };

  const placeholderUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${title}&backgroundColor=13161B&shapeColor=B4FF5C`;

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
            className="flex items-center gap-2 px-4 py-2 bg-emerald-100 border border-emerald-200 rounded-full text-emerald-700 text-[10px] font-bold hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />} 
            {loading ? 'GENERATING...' : 'AI PREVIEW'}
          </button>
        </div>
      )}
    </div>
  );
};

const DashboardMap = ({ listings = [] }: { listings?: RentalListing[] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [layerType, setLayerType] = useState<'map' | 'sat'>('map');
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    const L = (window as any).L;
    if (!mapRef.current || !L) return;
    if (mapInstance.current) mapInstance.current.remove();

    const safeListings = listings || [];
    const avgLat = safeListings.length > 0 ? safeListings.reduce((acc, l) => acc + (l.latitude || 0), 0) / safeListings.length : 19.0760;
    const avgLng = safeListings.length > 0 ? safeListings.reduce((acc, l) => acc + (l.longitude || 0), 0) / safeListings.length : 72.8777;

    const map = L.map(mapRef.current, { zoomControl: false }).setView([avgLat, avgLng], 13);
    
    const tileUrl = layerType === 'map' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    L.tileLayer(tileUrl).addTo(map);

    safeListings.forEach((item, idx) => {
      if (item.latitude && item.longitude) {
        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white font-bold shadow-lg">${idx + 1}</div>`,
          iconSize: [32, 32]
        });
        L.marker([item.latitude, item.longitude], { icon }).addTo(map).bindTooltip(item.title);
      }
    });

    mapInstance.current = map;
    return () => { if (mapInstance.current) mapInstance.current.remove(); };
  }, [listings, layerType]);

  return (
    <div className="relative w-full h-[400px] rounded-3xl overflow-hidden border border-white/10 shadow-neo-glow">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-[1000]">
        <button onClick={() => setLayerType('map')} className={`p-2 rounded-xl border transition-all ${layerType === 'map' ? 'bg-emerald-500 text-white border-emerald-500 shadow-brand' : 'bg-black/40 text-gray-500 border-white/10'}`}><Layers size={16} /></button>
        <button onClick={() => setLayerType('sat')} className={`p-2 rounded-xl border transition-all ${layerType === 'sat' ? 'bg-emerald-500 text-white border-emerald-500 shadow-brand' : 'bg-black/40 text-gray-500 border-white/10'}`}><Globe size={16} /></button>
      </div>
    </div>
  );
};

interface RentDashboardProps {
  result: RentResult;
}

const RentDashboard: React.FC<RentDashboardProps> = ({ result }) => {
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
      const summary = `Analyzing rental potential for this property. The estimated monthly rent is ${result.rentalValue}, projecting an annual yield of ${result.yieldPercentage}. Based on tenant demand metrics, I have assigned a confidence rating of ${result.confidenceScore} percent. ${result.marketSummary}.`;
      
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
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-neo-neon/10 rounded-2xl border border-neo-neon/20">
            <Building2 size={24} className="text-neo-neon" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Rental Intelligence</h2>
            <p className="text-sm text-gray-500">Market-verified monthly estimates</p>
          </div>
        </div>

        <div className="flex gap-2">
           <button 
             onClick={handleListen}
             disabled={isSpeaking}
             className={`p-3 rounded-xl transition-all border ${isSpeaking ? 'bg-neo-neon text-white border-neo-neon animate-pulse' : 'bg-white/5 border-white/10 text-neo-neon hover:bg-white/10'}`}
             title="Listen to AI Summary"
           >
              {isSpeaking ? <Loader2 size={20} className="animate-spin" /> : <Volume2 size={20}/>}
           </button>
           <button onClick={() => setViewMode('dashboard')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all border ${viewMode === 'dashboard' ? 'bg-neo-neon text-white border-neo-neon shadow-neo-glow' : 'bg-white/5 text-gray-400 border-white/10'}`}>
            DASHBOARD
          </button>
          <button onClick={() => setViewMode('map')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all border ${viewMode === 'map' ? 'bg-neo-neon text-white border-neo-neon shadow-neo-glow' : 'bg-white/5 text-gray-400 border-white/10'}`}>
            MAP VIEW
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 shadow-glass-3d">
          <span className="text-xs font-black text-neo-neon uppercase tracking-widest block mb-1">Monthly Rent</span>
          <div className="text-4xl font-black text-white tracking-tighter">{result.rentalValue}</div>
        </div>
        <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 shadow-glass-3d">
          <span className="text-xs font-black text-neo-pink uppercase tracking-widest block mb-1">Projected Yield</span>
          <div className="text-4xl font-black text-white tracking-tighter">{result.yieldPercentage}</div>
        </div>
        <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 shadow-glass-3d">
          <span className="text-xs font-black text-neo-gold uppercase tracking-widest block mb-1">Confidence</span>
          <div className="text-4xl font-black text-white tracking-tighter">{result.confidenceScore}%</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-10 scrollbar-hide">
        {viewMode === 'dashboard' ? (
          <div className="space-y-8">
            <div className="bg-neo-neon/5 rounded-[32px] p-8 border border-neo-neon/20 shadow-neo-glow">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Info size={20} className="text-neo-neon" /> Market Reasoning
              </h3>
              <p className="text-gray-300 leading-relaxed italic border-l-2 border-neo-neon/30 pl-4 py-1">
                "{result.valuationJustification}"
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {listings.map((item, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-[32px] p-6 shadow-glass-3d hover:border-neo-neon/40 transition-all group">
                  <AIPropertyImage title={item.title} address={item.address} type={item.bhk} />
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-white group-hover:text-neo-neon transition-colors">{item.title}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><MapPin size={12}/> {item.address}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-neo-neon">{item.rent}</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Verified</div>
                    </div>
                  </div>
                  <a href={item.sourceUrl} target="_blank" rel="noopener" className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 text-sm font-bold flex items-center justify-center gap-2 hover:bg-neo-neon hover:text-white hover:border-neo-neon transition-all">
                    View Details <ExternalLink size={14} />
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

export default RentDashboard;
