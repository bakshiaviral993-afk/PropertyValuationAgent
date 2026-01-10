import React, { useEffect, useState, useRef } from 'react';
import { BuyResult, SaleListing, AppLang } from '../types';
import { 
  TrendingUp, MapPin, Star, Share2, 
  FileText, CheckCircle2, Home, 
  Zap, Save, Sparkles, BarChart3, LayoutGrid, Compass, Paintbrush, Wind, Sparkle, Video, X,
  Target, ShieldAlert, Gavel, MessageSquare, GraduationCap
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
  const [viewMode, setViewMode] = useState<'dashboard' | 'stats' | 'harmony' | 'pro-report'>('dashboard');
  const [selectedVideo, setSelectedVideo] = useState<{prompt: string, title: string} | null>(null);

  useEffect(() => {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    const priceValue = parsePrice(result.fairValue);
    const priceText = formatPrice(priceValue);
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

  const fairValNum = parsePrice(result.fairValue);
  const targetOffer = fairValNum * 0.95;
  const walkawayPrice = fairValNum * 1.07;

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'Listing Source';
    }
  };

  return (
    <div className="h-full space-y-10 overflow-y-auto pb-24 scrollbar-hide px-2" ref={reportRef} data-report-container>
      {selectedVideo && (
        <div className="fixed inset-0 z-[500] bg-neo-bg/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <VideoGenerator 
            prompt={`${selectedVideo.prompt} in ${result.listings[0]?.address}`} 
            title={selectedVideo.title} 
            onClose={() => setSelectedVideo(null)} 
          />
        </div>
      )}

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
              <button onClick={() => setViewMode('pro-report')} className={`px-4 py-1.5 rounded-xl text-[9px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === 'pro-report' ? 'bg-neo-neon text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>
                <GraduationCap size={12} /> Detailed Report
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
                {formatPrice(fairValNum)}
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="px-8 py-3 rounded-full bg-neo-neon/20 text-neo-neon text-xs font-black border border-neo-neon/30 uppercase tracking-widest">
                  {safeRender(result.recommendation)}
                </div>
                {onAnalyzeFinance && (
                  <button 
                    onClick={() => onAnalyzeFinance(fairValNum)}
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

          <div className="bg-neo-gold/5 border border-neo-gold/20 rounded-[48px] p-10 shadow-gold-glow animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-neo-gold/10 rounded-2xl text-neo-gold">
                  <Gavel size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Negotiation Matrix</h3>
                  <p className="text-[10px] text-neo-gold font-black uppercase tracking-[0.4em]">Asset_Acquisition_Protocol</p>
                </div>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <div className="flex-1 md:flex-none p-4 bg-neo-bg/50 border border-neo-gold/20 rounded-2xl">
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1">Target Offer</span>
                  <div className="text-lg font-black text-neo-gold">{formatPrice(targetOffer)}</div>
                </div>
                <div className="flex-1 md:flex-none p-4 bg-neo-bg/50 border border-neo-pink/20 rounded-2xl">
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1 text-neo-pink">Walk-Away</span>
                  <div className="text-lg font-black text-neo-pink">{formatPrice(walkawayPrice)}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-neo-gold">
                  <MessageSquare size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Tactical Script</span>
                </div>
                <div className="p-6 bg-black/40 border border-white/5 rounded-3xl text-sm text-gray-300 leading-relaxed italic">
                  "{result.negotiationScript || "Focus on the current market comparable density and the asset's specific vintage adjustments."}"
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-neo-pink">
                  <ShieldAlert size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Risk Anchors</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-xs text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-neo-gold mt-1.5 shrink-0 shadow-gold-glow" />
                    <span>Avoid pricing anchored to local peaks; current sentiment suggests a {result.marketSentiment === 'Rising' ? 'wait-and-watch' : 'negotiable'} stance.</span>
                  </li>
                  <li className="flex gap-3 text-xs text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-neo-pink mt-1.5 shrink-0 shadow-pink-glow" />
                    <span>Hard limit set at {formatPrice(walkawayPrice)} based on regional replacement cost + utility premium.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <h3 className="text-2xl font-black text-white flex items-center gap-5 uppercase tracking-[0.1em] px-4">
                <CheckCircle2 size={32} className="text-neo-neon" /> Grounded Comparables
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
              {result.listings?.map((l, i) => (
                <div key={i} className="bg-white/5 rounded-[32px] p-6 border border-white/10 hover:border-neo-neon/50 transition-all group shadow-glass-3d flex flex-col overflow-hidden">
                  <div className="w-full h-40 rounded-2xl overflow-hidden mb-5 bg-neo-bg shrink-0">
                    {l.latitude && l.longitude ? (
                      <div className="w-full h-full relative group/map">
                        <iframe
                          className="w-full h-full grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all"
                          src={`https://maps.google.com/maps?q=${l.latitude},${l.longitude}&hl=en&z=15&output=embed`}
                          loading="lazy"
                          title={l.title}
                        />
                        <button 
                          onClick={() => setSelectedVideo({prompt: l.title, title: l.title})}
                          className="absolute bottom-3 left-3 px-3 py-1.5 bg-neo-pink text-white text-[8px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover/map:opacity-100 transition-opacity flex items-center gap-2"
                        >
                          <Video size={12} /> Quantum Tour
                        </button>
                      </div>
                    ) : (
                      <AIListingImage listing={l} onShowVideo={() => setSelectedVideo({prompt: l.title, title: l.title})} />
                    )}
                  </div>
                  
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

                  <a href={l.sourceUrl} target="_blank" rel="noopener" className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-center text-[10px] font-black uppercase tracking-widest mt-auto group-hover:bg-neo-neon group-hover:border-neo-neon transition-all duration-300">
                    View on {getHostname(l.sourceUrl)}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {viewMode === 'pro-report' && <ProfessionalReport result={result} />}
      {viewMode === 'stats' && listingStats && <MarketStats stats={listingStats} prices={listingPrices} />}
      {viewMode === 'harmony' && <HarmonyDashboard contextResult={result} lang={lang} />}
    </div>
  );
};

export default BuyDashboard;