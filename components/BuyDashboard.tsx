import React, { useEffect, useState, useRef } from 'react';
import { BuyResult, SaleListing, AppLang } from '../types';
import { 
  TrendingUp, MapPin, Star, Share2, 
  FileText, CheckCircle2, Home, 
  Zap, Save, Sparkles, BarChart3, LayoutGrid, Compass, Paintbrush, Wind, Sparkle, Video, X,
  Target, ShieldAlert, Gavel, MessageSquare, GraduationCap, Download
} from 'lucide-react';
// @ts-ignore
import confetti from 'canvas-confetti';
// @ts-ignore
import { jsPDF } from 'jspdf';
// @ts-ignore
import html2canvas from 'html2canvas';
import { parsePrice, formatPrice } from '../services/geminiService';
import { speak } from '../services/voiceService';
import MarketStats from './MarketStats';
import { calculateListingStats } from '../utils/listingProcessor';
import PropertyChat from './PropertyChat';
import HarmonyDashboard from './HarmonyDashboard';
import VideoGenerator from './VideoGenerator';
import ProfessionalReport from './ProfessionalReport';

interface BuyDashboardProps {
  result: BuyResult;
  lang?: AppLang;
  onAnalyzeFinance?: (value: number) => void;
}

const safeRender = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  return String(value);
};

const AIListingImage = ({ listing, onShowVideo }: { listing: SaleListing, onShowVideo: () => void }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    if (listing.image) {
      setImgUrl(listing.image);
      return;
    }
    const address = `${listing.societyName || listing.title}, ${listing.address}, ${listing.pincode}`;
    const streetUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodeURIComponent(
      address
    )}&key=${process.env.API_KEY || ''}`;
    setImgUrl(streetUrl);
  }, [listing]);

  return (
    <div className="w-full h-48 rounded-2xl overflow-hidden mb-4 bg-white/5 flex items-center justify-center relative group/img">
      <img 
          src={imgUrl || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop'} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" 
          alt={safeRender(listing.title)} 
      />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onShowVideo(); }}
          className="px-4 py-2 bg-neo-pink text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-pink-glow flex items-center gap-2"
        >
          <Video size={14} /> Video Walkthrough
        </button>
      </div>
      <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-[10px] font-black text-white uppercase">
        Live
      </div>
    </div>
  );
};

const BuyDashboard: React.FC<BuyDashboardProps> = ({ result, lang = 'EN', onAnalyzeFinance }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'stats' | 'harmony' | 'pro-report'>('pro-report');
  const [selectedVideo, setSelectedVideo] = useState<{prompt: string, title: string} | null>(null);

  useEffect(() => {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    const priceValue = parsePrice(result.fairValue);
    const priceText = formatPrice(priceValue);
    const speechText = lang === 'HI' 
      ? `संपत्ति का सही मूल्य ${priceText} है। विस्तृत रिपोर्ट तैयार है।`
      : `The asset's fair market value is ${priceText}. Your detailed analyst report is ready.`;
    speak(speechText, lang === 'HI' ? 'hi-IN' : 'en-IN');
  }, [result.fairValue, lang]);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { 
      scale: 2, 
      useCORS: true, 
      backgroundColor: '#ffffff' 
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const canvasRatio = canvas.height / canvas.width;
    const imgWidth = pageWidth;
    const imgHeight = pageWidth * canvasRatio;
    
    // Simple pagination if report is long
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
    
    const timestamp = new Date().toISOString().split('T')[0];
    pdf.save(`QuantCasa_Valuation_${timestamp}_v2.pdf`);
  };

  const listingPrices = result.listings?.map(l => parsePrice(l.price)) || [];
  const listingStats = calculateListingStats(listingPrices);
  const fairValNum = parsePrice(result.fairValue);

  return (
    <div className="h-full space-y-10 overflow-y-auto pb-24 scrollbar-hide px-2">
      {selectedVideo && (
        <div className="fixed inset-0 z-[500] bg-neo-bg/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <VideoGenerator 
            prompt={`${selectedVideo.prompt} in ${result.listings[0]?.address}`} 
            title={selectedVideo.title} 
            onClose={() => setSelectedVideo(null)} 
          />
        </div>
      )}

      {/* Control Widget */}
      <div className="bg-neo-glass border border-white/10 p-8 rounded-[48px] flex flex-wrap gap-6 items-center justify-between shadow-neo-glow no-print">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-report-blue to-neo-neon flex items-center justify-center text-white shadow-neo-glow">
            <GraduationCap size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Valuation Console</h2>
            <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 mt-2">
              <button onClick={() => setViewMode('pro-report')} className={`px-4 py-1.5 rounded-xl text-[9px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === 'pro-report' ? 'bg-neo-neon text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>
                <FileText size={12} /> Analyst Report
              </button>
              <button onClick={() => setViewMode('dashboard')} className={`px-4 py-1.5 rounded-xl text-[9px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === 'dashboard' ? 'bg-neo-neon text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>
                <LayoutGrid size={12} /> Live Deck
              </button>
              <button onClick={() => setViewMode('stats')} className={`px-4 py-1.5 rounded-xl text-[9px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === 'stats' ? 'bg-neo-neon text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>
                <BarChart3 size={12} /> Deep Stats
              </button>
              <button onClick={() => setViewMode('harmony')} className={`px-4 py-1.5 rounded-xl text-[9px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === 'harmony' ? 'bg-neo-neon text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>
                <Sparkle size={12} /> Harmony
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
           <button onClick={handleDownloadPDF} className="px-6 py-4 bg-neo-neon text-white rounded-[20px] font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-neo-glow hover:scale-105 active:scale-95 transition-all">
             <Download size={16}/> Export PDF
           </button>
           <button onClick={() => setIsSaved(true)} className={`p-4 rounded-[20px] border transition-all ${isSaved ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white/5 border-white/10 text-neo-neon hover:bg-white/10'}`}>
             <Save size={20}/>
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div ref={reportRef} className={`${viewMode === 'pro-report' ? 'bg-white' : ''} transition-colors duration-500`}>
        {viewMode === 'pro-report' && <ProfessionalReport result={result} />}
        {viewMode === 'dashboard' && (
          <div className="p-4 space-y-10 no-print">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 bg-white/5 rounded-[48px] p-10 border border-white/10 relative overflow-hidden shadow-glass-3d">
                <span className="text-[10px] font-black text-neo-neon uppercase tracking-[0.4em] mb-4 block">Grounded Estimate</span>
                <div className="text-6xl font-black text-white tracking-tighter mb-8 leading-tight">
                  {formatPrice(fairValNum)}
                </div>
                <div className="flex gap-4">
                  <div className="px-8 py-3 rounded-full bg-neo-neon/20 text-neo-neon text-xs font-black border border-neo-neon/30 uppercase tracking-widest">
                    {safeRender(result.recommendation)}
                  </div>
                  {onAnalyzeFinance && (
                    <button onClick={() => onAnalyzeFinance(fairValNum)} className="px-8 py-3 rounded-full bg-white/5 text-white text-xs font-black border border-white/10 uppercase hover:bg-neo-neon transition-all">
                      Fiscal Simulator
                    </button>
                  )}
                </div>
              </div>
              <div className="bg-white/5 rounded-[40px] p-10 border border-white/10 flex flex-col items-center justify-center text-center shadow-glass-3d">
                  <TrendingUp size={40} className="text-neo-neon mb-4" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Sentiment</span>
                  <div className="text-2xl font-black text-white uppercase tracking-tighter">{safeRender(result.marketSentiment)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {result.listings?.map((l, i) => (
                <div key={i} className="bg-white/5 rounded-[32px] p-6 border border-white/10 hover:border-neo-neon/50 transition-all shadow-glass-3d flex flex-col group">
                  <AIListingImage listing={l} onShowVideo={() => setSelectedVideo({prompt: l.title, title: l.title})} />
                  <h4 className="font-black text-white text-lg leading-tight mb-2 truncate">{l.title}</h4>
                  <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                    <MapPin size={12} className="text-neo-neon shrink-0" /> {l.address}
                  </div>
                  <div className="mt-auto flex justify-between items-center pt-4 border-t border-white/5">
                    <div className="text-lg font-black text-neo-neon">{formatPrice(parsePrice(l.price))}</div>
                    <a href={l.sourceUrl} target="_blank" rel="noopener" className="p-3 bg-white/5 rounded-xl hover:bg-neo-neon hover:text-white transition-all">
                      <Share2 size={16} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {viewMode === 'stats' && listingStats && <MarketStats stats={listingStats} prices={listingPrices} />}
        {viewMode === 'harmony' && <HarmonyDashboard contextResult={result} lang={lang} />}
      </div>
    </div>
  );
};

export default BuyDashboard;