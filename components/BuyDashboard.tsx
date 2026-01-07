
import React, { useEffect, useState, useRef } from 'react';
import { BuyResult, SaleListing, AppLang } from '../types';
import { 
  TrendingUp, MapPin, Star, Share2, 
  FileText, CheckCircle2, Home, 
  Zap, Save, Sparkles, BarChart3, LayoutGrid, Compass, Paintbrush, Wind, Sparkle
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

const AIListingImage = ({ listing }: { listing: SaleListing }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    // 1. try real listing image first
    if (listing.image) {
      setImgUrl(listing.image);
      return;
    }
    // 2. google street-view static image
    const address = `${listing.societyName || listing.title}, ${listing.address}, ${listing.pincode}`;
    const streetUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodeURIComponent(
      address
    )}&key=${process.env.API_KEY || ''}`;
    setImgUrl(streetUrl);
  }, [listing]);

  return (
    <div className="w-full h-48 rounded-2xl overflow-hidden mb-4 bg-white/5 flex items-center justify-center relative">
      <img 
          src={imgUrl || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop'} 
          className="w-full h-full object-cover" 
          alt={safeRender(listing.title)} 
      />
      <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-[10px] font-black text-white uppercase">
        Live
      </div>
    </div>
  );
};

const BuyDashboard: React.FC<BuyDashboardProps> = ({ result, lang = 'EN', onAnalyzeFinance }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'stats' | 'harmony'>('dashboard');

  useEffect(() => {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    const priceText = formatPrice(parsePrice(result.fairValue));
    const speechText = lang === 'HI' 
      ? `आपके इनपुट के आधार पर, संपत्ति का सही मूल्य लगभग ${priceText} है।`
      : `Based on your input, the fair market estimate is approximately ${priceText}.`;
    speak(speechText, lang === 'HI' ? 'hi-IN' : 'en-IN');
  }, [result.fairValue, lang]);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: '#0a0a0f' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', [210, (canvas.height * 210) / canvas.width]);
    pdf.addImage(imgData, 'PNG', 0, 0, 210, (canvas.height * 210) / canvas.width);
    pdf.save(`QuantCasa_Report.pdf`);
  };

  const listingPrices = result.listings?.map(l => parsePrice(l.price)) || [];
  const listingStats = calculateListingStats(listingPrices);

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'Listing Source';
    }
  };

  return (
    <div className="h-full space-y-10 overflow-y-auto pb-24 scrollbar-hide px-2" ref={reportRef} data-report-container>
      {/* Header Widget */}
      <div className="bg-neo-glass border border-white/10 p-8 rounded-[48px] flex flex-wrap gap-6 items-center justify-between shadow-neo-glow">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neo-neon to-neo-pink flex items-center justify-center text-white shadow-pink-glow">
            <Star size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Intelligence Output</h2>
            <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 no-pdf-export mt-2">
              <button onClick={() => setViewMode('dashboard')} className={`px-4 py-1.5 rounded-xl text-[9px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === 'dashboard' ? 'bg-neo-neon text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>
                <LayoutGrid size={12} /> Dashboard
              </button>
              <button onClick={() => setViewMode('stats')} className={`px-4 py-1.5 rounded-xl text-[9px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === 'stats' ? 'bg-neo-neon text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>
                <BarChart3 size={12} /> Stats
              </button>
              <button onClick={() => setViewMode('harmony')} className={`px-4 py-1.5 rounded-xl text-[9px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === 'harmony' ? 'bg-neo-neon text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>
                <Sparkle size={12} /> Harmony
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-3 no-pdf-export">
           <button onClick={() => setIsSaved(true)} className={`p-4 rounded-[20px] border transition-all ${isSaved ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white/5 border-white/10 text-neo-neon hover:bg-white/10'}`}><Save size={20}/></button>
           <button onClick={handleDownloadPDF} className="p-4 bg-white/5 border border-white/10 rounded-[20px] hover:bg-white/10 text-neo-neon transition-all"><FileText size={20}/></button>
        </div>
      </div>

      {viewMode === 'dashboard' && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-stretch">
            <div className="xl:col-span-2 bg-white/5 rounded-[48px] p-10 border border-white/10 relative overflow-hidden flex flex-col justify-center shadow-glass-3d min-h-[260px]">
              <span className="text-[10px] font-black text-neo-neon uppercase tracking-[0.4em] mb-4 block">Fair Market Estimate</span>
              <div className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-tight break-words">
                {formatPrice(parsePrice(result.fairValue))}
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="px-8 py-3 rounded-full bg-neo-neon/20 text-neo-neon text-xs font-black border border-neo-neon/30 uppercase tracking-widest">
                  {safeRender(result.recommendation)}
                </div>
                {onAnalyzeFinance && (
                  <button 
                    onClick={() => onAnalyzeFinance(parsePrice(result.fairValue))}
                    className="px-8 py-3 rounded-full bg-white/5 text-white text-xs font-black border border-white/10 uppercase tracking-widest hover:bg-neo-neon transition-all"
                  >
                    Fiscal Simulator
                  </button>
                )}
              </div>
            </div>
            <div className="bg-white/5 rounded-[40px] p-10 border border-white/10 flex flex-col items-center justify-center text-center shadow-glass-3d space-y-4">
                <TrendingUp size={40} className="text-neo-neon" />
                <div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Market Sentiment</span>
                    <div className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                      {safeRender(result.marketSentiment)}
                    </div>
                </div>
            </div>
          </div>
          <div className="space-y-10">
            <h3 className="text-2xl font-black text-white flex items-center gap-5 uppercase tracking-[0.1em] px-4">
                <CheckCircle2 size={32} className="text-neo-neon" /> Grounded Comparables
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
              {result.listings?.map((l, i) => (
                <a key={i} href={l.sourceUrl} target="_blank" rel="noopener"
                   className="bg-white/5 rounded-[32px] p-6 border border-white/10 hover:border-neo-neon/50 transition-all group shadow-glass-3d flex flex-col overflow-hidden">
                  {/* live map thumbnail */}
                  <div className="w-full h-40 rounded-2xl overflow-hidden mb-5 bg-neo-bg shrink-0">
                    {l.latitude && l.longitude ? (
                      <iframe
                        className="w-full h-full grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all"
                        src={`https://maps.google.com/maps?q=${l.latitude},${l.longitude}&hl=en&z=15&output=embed`}
                        loading="lazy"
                        title={l.title}
                      />
                    ) : (
                      <AIListingImage listing={l} />
                    )}
                  </div>
                  
                  {/* Title and Price - Improved Alignment */}
                  <div className="flex flex-col gap-4 mb-6">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-white text-lg leading-[1.2] line-clamp-2">
                          {l.title}
                        </h4>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-lg font-black text-neo-neon tracking-tight leading-none">
                          {formatPrice(parsePrice(l.price))}
                        </div>
                        <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest block mt-1">PRICE_VAL</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                      <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold uppercase tracking-widest min-w-0">
                        <MapPin size={12} className="text-neo-neon shrink-0" />
                        <span className="truncate">{l.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-neo-neon animate-pulse shadow-neo-glow" />
                        <span className="text-[9px] text-neo-neon font-black uppercase tracking-[0.2em] opacity-80">VERIFIED_SIGNAL</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-center text-[10px] font-black uppercase tracking-widest mt-auto group-hover:bg-neo-neon group-hover:border-neo-neon transition-all duration-300">
                    View on {getHostname(l.sourceUrl)}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </>
      )}

      {viewMode === 'stats' && listingStats && <MarketStats stats={listingStats} prices={listingPrices} />}
      {viewMode === 'harmony' && <HarmonyDashboard contextResult={result} lang={lang} />}
    </div>
  );
};

export default BuyDashboard;
