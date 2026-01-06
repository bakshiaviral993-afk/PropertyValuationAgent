
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
import { generatePropertyImage } from '../services/geminiService';
import { speak } from '../services/voiceService';
import MarketStats from './MarketStats';
import { parsePrice, calculateListingStats } from '../utils/listingProcessor';
import PropertyChat from './PropertyChat';
import HarmonyDashboard from './HarmonyDashboard';

interface BuyDashboardProps {
  result: BuyResult;
  lang?: AppLang;
  onAnalyzeFinance?: (value: number) => void;
}

const formatPrice = (val: any): string => {
  if (val === null || val === undefined) return "";
  const str = String(val);
  const num = parseFloat(str.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return str;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
};

const safeRender = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  return String(value);
};

const AIListingImage = ({ listing }: { listing: SaleListing }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchImg = async () => {
      setLoading(true);
      const url = await generatePropertyImage(`${listing.bhk} in ${listing.societyName || listing.title}, ${listing.address}`);
      setImgUrl(url);
      setLoading(false);
    };
    fetchImg();
  }, [listing.societyName, listing.title]);

  return (
    <div className="w-full h-48 rounded-2xl overflow-hidden mb-4 bg-white/5 flex items-center justify-center relative">
      {loading ? (
        <Zap className="text-neo-neon animate-pulse" size={24} />
      ) : (
        <img 
            src={imgUrl || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop'} 
            className="w-full h-full object-cover" 
            alt={safeRender(listing.title)} 
        />
      )}
    </div>
  );
};

const BuyDashboard: React.FC<BuyDashboardProps> = ({ result, lang = 'EN', onAnalyzeFinance }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'stats' | 'harmony'>('dashboard');

  useEffect(() => {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    const priceText = formatPrice(result.fairValue);
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
                {formatPrice(result.fairValue)}
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="px-8 py-3 rounded-full bg-neo-neon/20 text-neo-neon text-xs font-black border border-neo-neon/30 uppercase tracking-widest">
                  {safeRender(result.recommendation)}
                </div>
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
              {result.listings?.map((listing, i) => (
                <a key={i} href={listing.sourceUrl} target="_blank" rel="noopener" className="bg-white/5 rounded-[48px] p-8 border border-white/10 hover:border-neo-neon/50 hover:-translate-y-2 transition-all flex flex-col group shadow-glass-3d">
                  <AIListingImage listing={listing} />
                  <div className="flex-1 flex flex-col space-y-3">
                    <h4 className="font-black text-white text-lg leading-tight line-clamp-2">{safeRender(listing.societyName || listing.title)}</h4>
                    <div className="text-2xl font-black text-white tracking-tight">{formatPrice(listing.price)}</div>
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
