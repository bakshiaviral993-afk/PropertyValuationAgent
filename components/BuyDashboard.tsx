
import React, { useEffect, useState, useRef } from 'react';
import { BuyResult, SaleListing } from '../types';
import { 
  TrendingUp, Calculator, MapPin, Star, ChevronRight, Share2, 
  Download, Info, CheckCircle2, ExternalLink, Home, FileText, 
  Zap, Map as MapIcon, Layers, Target, Compass, Building2, 
  MessageSquare, Bookmark, Save, Sparkles, Smile, Frown, Meh,
  LayoutGrid
} from 'lucide-react';
// @ts-ignore
import confetti from 'canvas-confetti';
// @ts-ignore
import { jsPDF } from 'jspdf';
// @ts-ignore
import html2canvas from 'html2canvas';
import { generatePropertyImage } from '../services/geminiService';

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
      const url = await generatePropertyImage(`${bhk} apartment in ${societyName || title}, ${address}`);
      setImgUrl(url);
      setLoading(false);
    };
    fetchImg();
  }, [title, societyName]);

  return (
    <div className="w-full h-48 rounded-2xl overflow-hidden mb-4 bg-white/5 flex items-center justify-center relative shadow-inner">
      {loading ? (
        <div className="flex flex-col items-center gap-2">
            <Zap className="text-neo-neon animate-pulse" size={24} />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Generating_Vision...</span>
        </div>
      ) : (
        <img 
            src={imgUrl || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop'} 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
            alt={title} 
        />
      )}
      <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-black text-neo-neon uppercase tracking-widest">
         AI_Generated_Preview
      </div>
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
          html: `<div style="background: #585FD8; border: 2px solid white; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 11px; box-shadow: 0 0 20px rgba(88,95,216,0.6);">${idx + 1}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        L.marker([item.latitude, item.longitude], { icon: markerIcon })
          .addTo(map)
          .bindTooltip(
            `<div style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; color: #585FD8; padding: 4px;">${item.societyName || item.title}</div><div style="font-size: 10px; color: #333; padding-left: 4px;">${item.price}</div>`,
            { permanent: false, direction: 'top', className: 'custom-tooltip' }
          );
      }
    });

    mapInstance.current = map;
    return () => { if (mapInstance.current) mapInstance.current.remove(); };
  }, [listings]);

  return (
    <div className="relative w-full h-[400px] rounded-[48px] overflow-hidden border border-white/10 group shadow-glass-3d">
        <div className="absolute top-6 left-6 z-[400] bg-neo-bg/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-neo-neon/30 flex items-center gap-3 shadow-neo-glow">
            <Compass className="text-neo-neon animate-spin-slow" size={16} />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Localized_Market_Grounding</span>
        </div>
        <div ref={mapRef} className="w-full h-full grayscale hover:grayscale-0 transition-all duration-1000" />
    </div>
  );
};

const SentimentWidget = ({ score, text }: { score: number, text: string }) => {
    const getIcon = () => {
        if (score > 70) return <Smile size={40} className="text-emerald-400" />;
        if (score < 40) return <Frown size={40} className="text-neo-pink" />;
        return <Meh size={40} className="text-neo-gold" />;
    };
    
    return (
        <div className="bg-white/5 rounded-[40px] p-10 border border-white/10 flex flex-col items-center justify-center text-center shadow-glass-3d space-y-4">
            <div className="relative">
                {getIcon()}
                <div className="absolute inset-0 bg-white blur-[40px] opacity-10" />
            </div>
            <div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Market_Sentiment</span>
                <div className="text-2xl font-black text-white uppercase tracking-tighter">{text}</div>
                <div className="mt-4 w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ${score > 70 ? 'bg-emerald-400' : score < 40 ? 'bg-neo-pink' : 'bg-neo-gold'}`} 
                        style={{ width: `${score}%` }} 
                    />
                </div>
            </div>
        </div>
    );
};

const BuyDashboard: React.FC<BuyDashboardProps> = ({ result, onAnalyzeFinance }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#585FD8', '#FF6B9D'] });
  }, []);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
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
    pdf.save(`QuantCasa_Valuation_${Date.now()}.pdf`);
  };

  const handleSaveReport = () => {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      const savedReports = JSON.parse(localStorage.getItem('quantcasa_reports') || '[]');
      savedReports.push({ 
          id: Date.now(), 
          fairValue: result.fairValue, 
          location: result.listings?.[0]?.address || 'Unknown' 
      });
      localStorage.setItem('quantcasa_reports', JSON.stringify(savedReports.slice(-20)));
  };

  return (
    <div className="h-full space-y-10 overflow-y-auto pb-24 scrollbar-hide px-2" ref={reportRef}>
      {/* Action Header */}
      <div className="bg-neo-glass border border-white/10 p-8 rounded-[48px] flex flex-wrap gap-6 items-center justify-between shadow-neo-glow relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-neo-neon/5 to-neo-pink/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-neo-neon to-neo-pink flex items-center justify-center text-white shadow-pink-glow">
            <Star size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter">Valuation Complete</h2>
            <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] text-neo-neon font-black uppercase tracking-[0.2em] bg-neo-neon/10 px-3 py-1 rounded-full border border-neo-neon/30">Intelligence_V5.2</span>
                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Accuracy: {result.confidenceScore}%</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 relative z-10">
           <button 
             onClick={handleSaveReport}
             className={`p-5 rounded-[24px] border transition-all ${isSaved ? 'bg-emerald-500 border-emerald-500 text-white shadow-neo-glow' : 'bg-white/5 border-white/10 text-neo-neon hover:bg-white/10'}`}
             title="Save to local database"
           >
              {isSaved ? <CheckCircle2 size={24}/> : <Save size={24}/>}
           </button>
           <button onClick={handleDownloadPDF} className="p-5 bg-white/5 border border-white/10 rounded-[24px] hover:bg-white/10 text-neo-neon transition-all" title="Download PDF Report"><FileText size={24}/></button>
           <button onClick={() => {}} className="p-5 bg-white/5 border border-white/10 rounded-[24px] hover:bg-white/10 text-neo-pink transition-all" title="Share Report"><Share2 size={24}/></button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-stretch">
        {/* Fair Price Display */}
        <div className="xl:col-span-2 bg-white/5 rounded-[48px] p-12 border border-white/10 relative overflow-hidden flex flex-col justify-center min-h-[350px] shadow-glass-3d">
          <div className="absolute top-0 right-0 p-12 opacity-5 -rotate-12">
            <Home size={200} className="text-neo-neon" />
          </div>
          <span className="text-[10px] font-black text-neo-neon uppercase tracking-[0.4em] mb-6 block">Estimated_Asset_Value</span>
          <div className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-8 break-words leading-none">
            {result.fairValue}
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="px-8 py-3 rounded-full bg-neo-neon/20 text-neo-neon text-xs font-black border border-neo-neon/30 uppercase tracking-widest shadow-neo-glow">
              {result.recommendation}
            </div>
            <div className="px-8 py-3 rounded-full bg-white/5 text-gray-400 text-xs font-mono border border-white/10 uppercase tracking-widest">
              Range: {result.valuationRange}
            </div>
          </div>
        </div>

        {/* Sentiment Visualization */}
        <SentimentWidget score={result.sentimentScore || 65} text={result.marketSentiment} />
      </div>

      {/* Map Segment */}
      <BuyMap listings={result.listings} />

      {/* Negotiation Script Section */}
      <div className="bg-neo-neon/5 border border-neo-neon/20 p-12 rounded-[56px] relative overflow-hidden shadow-neo-glow group">
        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
            <MessageSquare size={120} className="text-neo-neon" />
        </div>
        <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-neo-neon/20 rounded-2xl"><Sparkles size={24} className="text-neo-neon" /></div>
            <h3 className="text-xl font-black text-white uppercase tracking-widest">Enhanced Negotiation Script</h3>
        </div>
        <p className="text-lg text-gray-300 leading-relaxed font-medium italic pl-10 border-l-4 border-neo-neon/30">
            "{result.negotiationScript}"
        </p>
      </div>

      {/* Detailed Analysis Segment */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         <div className="xl:col-span-2 bg-white/5 rounded-[48px] p-12 border border-white/10 shadow-glass-3d">
            <div className="flex items-center gap-4 mb-10">
                <div className="p-4 bg-neo-gold/10 rounded-[24px]"><Zap size={32} className="text-neo-gold" /></div>
                <h3 className="text-2xl font-black text-white uppercase tracking-[0.1em]">Valuation Reasoning</h3>
            </div>
            <p className="text-base text-gray-400 leading-relaxed font-medium mb-12 italic border-white/5">
              {result.valuationJustification}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {result.insights?.map((insight, i) => (
                 <div key={i} className="p-8 rounded-[40px] bg-white/5 border border-white/10 hover:border-neo-neon/40 hover:bg-neo-neon/5 transition-all group shadow-inner">
                    <div className="flex justify-between items-start mb-6">
                        <span className="text-[10px] font-black uppercase text-neo-neon tracking-[0.3em] bg-neo-neon/10 px-4 py-1.5 rounded-full">{insight.type}</span>
                        <Info size={18} className="text-gray-600 group-hover:text-neo-neon" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-3 leading-tight">{insight.title}</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">{insight.description}</p>
                 </div>
               ))}
            </div>
         </div>

         <div className="bg-white/5 rounded-[48px] p-12 border border-white/10 space-y-10 flex flex-col justify-center shadow-glass-3d">
          <h3 className="text-[10px] font-black text-neo-pink uppercase tracking-[0.4em] flex items-center gap-3">
             <Target size={18} className="text-neo-pink" /> Local_Pulse_Matrix
          </h3>
          <div className="space-y-8">
             {result.neighborhoodScore && Object.entries(result.neighborhoodScore).map(([key, val]) => (
               <div key={key} className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-500 tracking-widest">
                    <span>{key}</span>
                    <span className="text-neo-neon">{val}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden p-[2px]">
                    <div className="h-full bg-gradient-to-r from-neo-neon to-neo-pink rounded-full transition-all duration-1500 ease-out" style={{ width: `${val}%` }} />
                  </div>
               </div>
             ))}
          </div>
          <div className="pt-6 border-t border-white/5 text-center">
              <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Appreciation Outlook</span>
              <div className="text-4xl font-black text-neo-neon mt-2">{result.appreciationPotential}</div>
          </div>
        </div>
      </div>

      {/* Verified Listings Segment - Improved Cards */}
      <div className="space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-6 px-4">
            <h3 className="text-2xl font-black text-white flex items-center gap-5 uppercase tracking-[0.1em]">
                <CheckCircle2 size={32} className="text-neo-neon" /> Grounded Comparable Sales
            </h3>
            <div className="text-[10px] font-black text-neo-neon uppercase tracking-[0.3em] bg-neo-neon/10 px-6 py-3 rounded-full border border-neo-neon/30 shadow-neo-glow flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-neo-neon animate-pulse" />
                Live_Network_Synchronization
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-4">
          {result.listings?.map((listing, i) => (
            <a 
                key={i} 
                href={listing.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-white/5 rounded-[48px] p-8 border border-white/10 hover:border-neo-neon/50 hover:-translate-y-3 transition-all flex flex-col group shadow-glass-3d relative"
            >
              <AIListingImage title={listing.title} address={listing.address} bhk={listing.bhk} societyName={listing.societyName} />
              
              <div className="flex-1 flex flex-col space-y-4">
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <h4 className="font-black text-white text-lg leading-tight group-hover:text-neo-neon transition-colors">
                            {listing.societyName || listing.title}
                        </h4>
                        {listing.builderName && (
                            <div className="flex items-center gap-2 text-[10px] font-black text-neo-neon uppercase tracking-widest mt-2">
                                <Building2 size={12} /> {listing.builderName}
                            </div>
                        )}
                    </div>
                    <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-neo-neon group-hover:text-white transition-all">
                        <ExternalLink size={20} />
                    </div>
                </div>
                
                <div className="text-3xl font-black text-white group-hover:scale-105 origin-left transition-transform">
                    {listing.price}
                </div>
                
                <div className="flex items-center gap-3 text-[10px] text-gray-500 font-bold uppercase tracking-wider bg-white/5 p-4 rounded-[24px] border border-white/5 mt-auto">
                   <MapPin size={16} className="text-neo-pink shrink-0" /> 
                   <span className="truncate">{listing.address}</span>
                </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-600">
                  <div className="flex items-center gap-2"><LayoutGrid size={14} className="text-neo-neon"/> {listing.bhk}</div>
                  <div className="flex items-center gap-2">View Source <ChevronRight size={14}/></div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Interaction Segment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 px-4 pb-12">
        <button 
          onClick={() => onAnalyzeFinance?.(10000000)}
          className="h-28 px-12 bg-neo-neon rounded-[48px] text-white shadow-neo-glow group transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-between border-t border-white/20"
        >
          <div className="flex items-center gap-8">
            <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md group-hover:rotate-12 transition-transform shadow-lg"><Calculator size={40} /></div>
            <div className="text-left">
              <h4 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1">Stimulate Finances</h4>
              <p className="text-[10px] opacity-80 font-black tracking-[0.3em] uppercase">EMI & Fiscal Projections</p>
            </div>
          </div>
          <ChevronRight className="group-hover:translate-x-4 transition-transform" size={32} />
        </button>

        <button 
          onClick={handleDownloadPDF}
          className="h-28 flex items-center justify-center gap-6 bg-white/5 border border-white/10 rounded-[48px] text-white hover:bg-white/10 hover:border-white/20 transition-all hover:scale-[1.02] active:scale-95 shadow-glass-3d group"
        >
          <div className="p-5 bg-neo-pink/10 rounded-[28px] text-neo-pink group-hover:bg-neo-pink group-hover:text-white transition-all shadow-lg"><Download size={32} /></div>
          <span className="text-lg font-black uppercase tracking-[0.3em]">Generate Report PDF</span>
        </button>
      </div>
    </div>
  );
};

export default BuyDashboard;
