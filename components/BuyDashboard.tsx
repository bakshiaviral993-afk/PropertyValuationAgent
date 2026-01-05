import React, { useEffect, useState, useRef } from 'react';
import { BuyResult, SaleListing } from '../types';
import { 
  TrendingUp, Calculator, MapPin, Star, ChevronRight, Share2, 
  Download, Info, CheckCircle2, ExternalLink, Home, FileText, 
  Zap, Map as MapIcon, Layers, Target, Compass, Building2, 
  MessageSquare, Bookmark, Save, Sparkles, Smile, Frown, Meh, Volume2, Loader2
} from 'lucide-react';
// @ts-ignore
import confetti from 'canvas-confetti';
// @ts-ignore
import { jsPDF } from 'jspdf';
// @ts-ignore
import html2canvas from 'html2canvas';
import { generatePropertyImage, getSpeech } from '../services/geminiService';
import { decodeAudioData, decode } from '../utils/audioUtils';

interface BuyDashboardProps {
  result: BuyResult;
  onAnalyzeFinance?: (value: number) => void;
}

const AIListingImage = ({ title, address, bhk, societyName }: { title: string, address: string, bhk: string, societyName?: string }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchImg = async () => {
      setLoading(true);
      try {
        const url = await generatePropertyImage(`${bhk} apartment in ${societyName || title}, ${address}`);
        setImgUrl(url);
      } catch (err) {
        console.error("Image gen failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchImg();
  }, [title, societyName, address, bhk]);

  return (
    <div className="w-full h-44 rounded-2xl overflow-hidden mb-4 bg-white/5 flex items-center justify-center relative shadow-inner">
      {loading ? (
        <div className="flex flex-col items-center gap-2">
            <Zap className="text-neo-neon animate-pulse" size={24} />
            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Imaging...</span>
        </div>
      ) : (
        <img 
            src={imgUrl || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format&fit=crop'} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            alt={title} 
        />
      )}
    </div>
  );
};

const BuyMap = ({ listings }: { listings: SaleListing[] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    const L = (window as any).L;
    if (!mapRef.current || !L) return;
    if (mapInstance.current) mapInstance.current.remove();

    const avgLat = listings.length > 0 ? listings.reduce((acc, l) => acc + (l.latitude || 19.076), 0) / listings.length : 19.076;
    const avgLng = listings.length > 0 ? listings.reduce((acc, l) => acc + (l.longitude || 72.877), 0) / listings.length : 72.877;

    const map = L.map(mapRef.current, { zoomControl: false }).setView([avgLat, avgLng], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { 
        attribution: '&copy; OpenStreetMap contributors' 
    }).addTo(map);

    listings.forEach((item, idx) => {
      if (item.latitude && item.longitude) {
        const markerIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background: #585FD8; border: 2px solid #fff; color: white; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 14px; box-shadow: 0 0 20px rgba(88,95,216,0.8);">${idx + 1}</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });

        L.marker([item.latitude, item.longitude], { icon: markerIcon })
          .addTo(map)
          .bindTooltip(
            `<div style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; color: #585FD8; padding: 4px;">${item.societyName || item.title}</div><div style="font-size: 11px; color: #333; font-weight: 700;">${item.price}</div>`,
            { permanent: false, direction: 'top', className: 'custom-tooltip' }
          );
      }
    });

    mapInstance.current = map;
    return () => { if (mapInstance.current) mapInstance.current.remove(); };
  }, [listings]);

  return (
    <div className="relative w-full h-[350px] rounded-[40px] overflow-hidden border border-white/10 group shadow-neo-glow">
        <div className="absolute top-6 left-6 z-[400] bg-neo-bg/90 backdrop-blur-md px-4 py-2 rounded-full border border-neo-neon/30 flex items-center gap-2 shadow-neo-glow">
            <Compass className="text-neo-neon animate-spin-slow" size={14} />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Neighborhood_Intel</span>
        </div>
        <div ref={mapRef} className="w-full h-full grayscale hover:grayscale-0 transition-all duration-700" />
    </div>
  );
};

const SentimentIcon = ({ sentiment }: { sentiment: string }) => {
    const s = (sentiment || '').toLowerCase();
    if (s.includes('bullish') || s.includes('positive') || s.includes('strong') || s.includes('high')) return <Smile className="text-emerald-400" size={32} />;
    if (s.includes('bearish') || s.includes('overpriced') || s.includes('weak') || s.includes('low')) return <Frown className="text-neo-pink" size={32} />;
    return <Meh className="text-neo-gold" size={32} />;
};

const BuyDashboard: React.FC<BuyDashboardProps> = ({ result, onAnalyzeFinance }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    try {
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#585FD8', '#FF6B9D'] });
    } catch(e) {}
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
        const canvas = await html2canvas(reportRef.current, { 
          scale: 2, 
          useCORS: true, 
          backgroundColor: '#0a0a0f',
          logging: false,
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, 297));
        pdf.save(`Valuation_Report_${Date.now()}.pdf`);
    } catch (err) {
        console.error("PDF Export failed", err);
    }
  };

  const handleSaveReport = () => {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      const savedReports = JSON.parse(localStorage.getItem('quantcasa_reports') || '[]');
      savedReports.push({ id: Date.now(), ...result });
      localStorage.setItem('quantcasa_reports', JSON.stringify(savedReports.slice(-10)));
  };

  const handleListen = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const summary = `Asset valuation report complete. The estimated fair market value is ${result.fairValue}, with a range of ${result.valuationRange}. Based on current data, I have assigned a confidence rating of ${result.confidenceScore} percent. My recommendation is ${result.recommendation}. ${result.marketSentiment}`;
      
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
    <div className="h-full space-y-8 overflow-y-auto pb-20 scrollbar-hide px-2" ref={reportRef}>
      {/* Header Info */}
      <div className="bg-neo-glass border border-white/10 p-6 rounded-[32px] flex flex-wrap gap-4 items-center justify-between shadow-neo-glow">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neo-neon to-neo-pink flex items-center justify-center text-white shadow-pink-glow">
            <Star size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Neural Valuation Analysis</h2>
            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">Confidence: {result.confidenceScore}%</p>
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
           <button onClick={handleSaveReport} className={`p-3 rounded-xl transition-all border ${isSaved ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white/5 border-white/10 text-neo-neon hover:bg-white/10'}`}>
              {isSaved ? <CheckCircle2 size={20}/> : <Bookmark size={20}/>}
           </button>
           <button onClick={handleDownloadPDF} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-neo-neon transition-all"><FileText size={20}/></button>
           <button onClick={() => {}} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-neo-pink transition-all"><Share2 size={20}/></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fair Price Display */}
        <div className="bg-white/5 rounded-[40px] p-10 border border-white/10 relative overflow-hidden flex flex-col justify-center shadow-glass-3d">
          <span className="text-[10px] font-black text-neo-neon uppercase tracking-[0.4em] mb-4 block">Calculated_Fair_Value</span>
          <div className="text-5xl lg:text-6xl font-black text-white tracking-tighter mb-4 break-words">{result.fairValue}</div>
          <div className="flex flex-wrap gap-2">
            <span className="px-4 py-1.5 rounded-full bg-neo-neon/20 text-neo-neon text-[10px] font-black border border-neo-neon/30 uppercase">{result.recommendation}</span>
            <span className="px-4 py-1.5 rounded-full bg-white/5 text-gray-400 text-[10px] font-mono border border-white/10 uppercase">{result.valuationRange}</span>
          </div>
        </div>

        {/* Sentiment & Appreciation */}
        <div className="bg-white/5 rounded-[40px] p-10 border border-white/10 flex items-center gap-8 shadow-glass-3d">
            <div className="flex-1 text-center">
                <SentimentIcon sentiment={result.marketSentiment} />
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest mt-4">Market Vibe</h4>
                <p className="text-[9px] text-gray-500 mt-1 line-clamp-2">{result.marketSentiment}</p>
            </div>
            <div className="w-px h-20 bg-white/10" />
            <div className="flex-1 text-center">
                <TrendingUp size={32} className="text-neo-neon mx-auto" />
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest mt-4">Appreciation</h4>
                <div className="text-2xl font-black text-neo-neon">{result.appreciationPotential}</div>
            </div>
        </div>
      </div>

      {/* Map Integration */}
      <BuyMap listings={result.listings} />

      {/* Negotiation Script Section */}
      <div className="bg-neo-neon/5 border border-neo-neon/20 p-8 rounded-[40px] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
            <MessageSquare size={60} className="text-neo-neon" />
        </div>
        <h3 className="text-sm font-black text-neo-neon uppercase tracking-widest flex items-center gap-2 mb-4">
            <Zap size={16} /> Negotiation Strategy
        </h3>
        <p className="text-sm text-gray-300 leading-relaxed font-medium italic pl-4 border-l-2 border-neo-neon/30">
            "{result.negotiationScript}"
        </p>
      </div>

      {/* Detailed Analysis Segment */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
         <div className="xl:col-span-2 bg-white/5 rounded-[40px] p-8 border border-white/10">
            <h3 className="text-sm font-black text-white mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
              <Sparkles size={18} className="text-neo-gold" /> Analytical Justification
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed font-medium mb-8 border-l-2 border-white/10 pl-4 py-2">
              {result.valuationJustification}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {result.insights?.map((insight, i) => (
                 <div key={i} className="p-5 rounded-3xl bg-white/5 border border-white/10 hover:border-neo-neon/40 transition-all">
                    <span className="text-[8px] font-black uppercase text-gray-500 block mb-2">{insight.type}</span>
                    <h4 className="text-xs font-bold text-white mb-2">{insight.title}</h4>
                    <p className="text-[10px] text-gray-400 leading-relaxed">{insight.description}</p>
                 </div>
               ))}
            </div>
         </div>

         <div className="bg-white/5 rounded-[40px] p-8 border border-white/10 flex flex-col justify-center">
            <h3 className="text-[10px] font-black text-neo-pink uppercase tracking-[0.3em] flex items-center gap-2 mb-6">
                 <Target size={14} /> Neighborhood Matrix
            </h3>
            <div className="space-y-4">
                 {result.neighborhoodScore && Object.entries(result.neighborhoodScore).map(([key, val]) => (
                   <div key={key} className="space-y-1">
                      <div className="flex justify-between text-[8px] font-mono uppercase text-gray-500">
                        <span>{key}</span>
                        <span>{val}%</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-neo-neon to-neo-pink" style={{ width: `${val}%` }} />
                      </div>
                   </div>
                 ))}
            </div>
         </div>
      </div>

      {/* Verified Listings Section */}
      <div className="space-y-6">
        <h3 className="text-sm font-black text-white flex items-center gap-3 uppercase tracking-widest px-4">
          <CheckCircle2 size={20} className="text-neo-neon" /> Verified Hyper-Local Signals
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 pb-6">
          {result.listings?.map((listing, i) => (
            <a 
                key={i} 
                href={listing.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-white/5 rounded-[32px] p-6 border border-white/10 hover:border-neo-neon/40 hover:-translate-y-2 transition-all flex flex-col group relative overflow-hidden"
            >
              <AIListingImage title={listing.title} address={listing.address} bhk={listing.bhk} societyName={listing.societyName} />
              
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-white text-sm line-clamp-1 flex items-center gap-2">
                        {listing.societyName || listing.title}
                    </h4>
                    <ExternalLink size={14} className="text-gray-600 group-hover:text-neo-neon" />
                </div>
                
                {listing.builderName && (
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-neo-neon uppercase tracking-widest mb-3">
                        <Building2 size={10} /> {listing.builderName}
                    </div>
                )}

                <div className="text-2xl font-black text-white mb-3 tracking-tighter">{listing.price}</div>
                
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-auto pt-4 border-t border-white/5">
                   <MapPin size={10} className="text-neo-pink" /> 
                   <span className="truncate">{listing.address}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Interaction Segment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 px-4 pb-12">
        <button 
          onClick={() => onAnalyzeFinance?.(10000000)}
          className="h-24 px-8 bg-neo-neon rounded-[40px] text-white shadow-neo-glow group transition-all flex items-center justify-between hover:scale-[1.02]"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center"><Calculator size={28} /></div>
            <div>
              <h4 className="text-lg font-black uppercase tracking-tighter">Stimulate Finances</h4>
              <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">EMI & Registration Projections</p>
            </div>
          </div>
          <ChevronRight className="group-hover:translate-x-2 transition-transform" size={24} />
        </button>

        <button 
          onClick={handleDownloadPDF}
          className="h-24 flex items-center justify-center gap-4 bg-white/5 border border-white/10 rounded-[40px] text-white hover:bg-white/10 transition-all hover:scale-[1.02]"
        >
          <div className="w-14 h-14 bg-neo-pink/10 rounded-2xl flex items-center justify-center text-neo-pink"><Download size={28} /></div>
          <span className="text-sm font-black uppercase tracking-[0.3em]">Generate Report PDF</span>
        </button>
      </div>
    </div>
  );
};

export default BuyDashboard;