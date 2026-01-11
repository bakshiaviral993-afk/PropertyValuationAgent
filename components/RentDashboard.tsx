import React, { useState, useEffect, useRef } from 'react';
import { RentResult, RentalListing, AppLang } from '../types';
import { 
  MapPin, ExternalLink, Globe, Info, Layers, Building2, ImageIcon, Loader2, BarChart3, LayoutGrid,
  Receipt, Wallet, TrendingUp, Gavel, Target, ShieldAlert, MessageSquare, RefreshCw
} from 'lucide-react';
import { generatePropertyImage } from '../services/geminiService';
import { speak } from '../services/voiceService';
import MarketStats from './MarketStats';
import { parsePrice, calculateListingStats } from '../utils/listingProcessor';

interface RentDashboardProps {
  result: RentResult;
  lang?: AppLang;
  onAnalyzeFinance?: () => void;
}

const formatPriceDisplay = (val: any): string => {
  if (val === null || val === undefined) return "N/A";
  let cleanVal = val;
  if (typeof val === 'object') {
    cleanVal = val.value || val.text || JSON.stringify(val);
  } else {
    cleanVal = String(val);
  }
  if (cleanVal.includes('₹') || cleanVal.toLowerCase().includes('lakh')) return cleanVal;
  const num = parseFloat(cleanVal.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return cleanVal;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
};

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
      <img src={imgUrl || placeholderUrl} alt={title} className={`w-full h-full object-cover transition-all duration-700 ${imgUrl ? 'scale-100' : 'scale-50 opacity-30 grayscale'}`} />
      {!imgUrl && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button onClick={handleGenerate} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-emerald-100 border border-emerald-200 rounded-full text-emerald-700 text-[10px] font-bold hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50">
            {loading ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />} {loading ? 'GENERATING...' : 'AI PREVIEW'}
          </button>
        </div>
      )}
    </div>
  );
};

const RentDashboard: React.FC<RentDashboardProps> = ({ result, lang = 'EN', onAnalyzeFinance }) => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'map' | 'stats'>('dashboard');
  const [isSearchingPincode, setIsSearchingPincode] = useState(false);
  const listings = result.listings || [];

  useEffect(() => {
    const rentText = formatPriceDisplay(result.rentalValue);
    const speechText = lang === 'HI' 
      ? `आपके क्षेत्र के लिए अनुमानित किराया ${rentText} प्रति माह है।`
      : `The estimated rental value for your area is ${rentText} per month.`;
    speak(speechText, lang === 'HI' ? 'hi-IN' : 'en-IN');
  }, [result.rentalValue, lang]);

  const listingPrices = result.listings?.map(l => parsePrice(l.rent)) || [];
  const listingStats = calculateListingStats(listingPrices);

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
      {isSearchingPincode && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 bg-emerald-500 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-neo-glow flex items-center gap-3 animate-bounce">
          <RefreshCw size={14} className="animate-spin" /> Grounding local rental indices...
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 rounded-2xl">
            <Building2 size={24} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Rental Intel</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black opacity-60">Verified Valuation Node</p>
          </div>
        </div>
        
        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 no-pdf-export">
          <button onClick={() => setViewMode('dashboard')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === 'dashboard' ? 'bg-emerald-500 text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>
            <LayoutGrid size={12} /> Dashboard
          </button>
          <button onClick={() => setViewMode('stats')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === 'stats' ? 'bg-emerald-500 text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>
            <BarChart3 size={12} /> Stats
          </button>
        </div>
      </div>

      {viewMode === 'stats' && listingStats ? (
        <MarketStats stats={listingStats} prices={listingPrices} labelPrefix="Monthly Rent" />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 shadow-glass-3d border-t-2 border-t-emerald-500 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Receipt size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">Monthly Rent</span>
                </div>
                <div className="text-4xl font-black text-white tracking-tighter">
                  {formatPriceDisplay(result.rentalValue)}
                </div>
              </div>
              {onAnalyzeFinance && (
                <button onClick={() => { setIsSearchingPincode(true); setTimeout(() => { onAnalyzeFinance(); setIsSearchingPincode(false); }, 800); }} className="mt-6 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all w-full flex items-center justify-center gap-2">
                  <TrendingUp size={12}/> Fiscal Simulator
                </button>
              )}
            </div>
            <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 shadow-glass-3d border-t-2 border-t-blue-500">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-2">Projected Yield</span>
              <div className="text-4xl font-black text-white tracking-tighter">{result.yieldPercentage || "3.5%"}</div>
            </div>
            <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 shadow-glass-3d border-t-2 border-t-orange-500">
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block mb-2">Confidence</span>
              <div className="text-4xl font-black text-white tracking-tighter">{result.confidenceScore}%</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 pb-10 scrollbar-hide">
            <div className="space-y-8">
              <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 shadow-glass-3d border-l-4 border-l-emerald-500">
                <h3 className="text-xs font-black text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <Info size={18} className="text-emerald-500" /> Market Reasoning
                </h3>
                <p className="text-gray-300 leading-relaxed italic text-sm">"{result.valuationJustification}"</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {listings.map((item, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-[32px] p-6 shadow-glass-3d hover:border-emerald-500/30 transition-all group">
                    <AIPropertyImage title={item.title} address={item.address} type={item.bhk} />
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0 pr-4">
                        <h4 className="font-black text-white truncate">{item.title}</h4>
                        <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-1 font-bold uppercase tracking-widest truncate"><MapPin size={12}/> {item.address}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xl font-black text-emerald-500">{formatPriceDisplay(item.rent)}</div>
                      </div>
                    </div>
                    <a href={item.sourceUrl} target="_blank" rel="noopener" className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500 hover:border-emerald-500 transition-all">
                      Verify Source <ExternalLink size={14} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RentDashboard;