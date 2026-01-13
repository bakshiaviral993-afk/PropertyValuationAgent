import React, { useState, useEffect } from 'react';
import { LandResult, LandListing, AppLang } from '../types';
import { ExternalLink, Map as MapIcon, ImageIcon, Loader2, Zap, Info, Calculator, RefreshCw, TrendingUp, Plus } from 'lucide-react';
import { generatePropertyImage } from '../services/geminiService';
import { speak } from '../services/voiceService';
import { parsePrice } from '../services/geminiService';
import GoogleMapView from './GoogleMapView';
import { getMoreListings } from '../services/valuationService';
// @ts-ignore
import confetti from 'canvas-confetti';

interface LandReportProps {
  result: LandResult;
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

const AIPropertyImage = ({ title, address, type }: { title: string, address: string, type: string }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    setLoading(true);
    const prompt = `Aerial photograph of: ${type} land named ${title} in ${address}`;
    const url = await generatePropertyImage(prompt);
    setImgUrl(url);
    setLoading(false);
  };

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/5 bg-black/40 group mb-4">
      <img src={imgUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${title}`} alt={title} className={`w-full h-full object-cover transition-all ${imgUrl ? 'opacity-100' : 'opacity-20 grayscale'}`} />
      {!imgUrl && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button onClick={handleGenerate} disabled={loading} className="px-4 py-2 bg-orange-500 text-white rounded-full text-[10px] font-black uppercase hover:bg-orange-600 transition-all">
            {loading ? <Loader2 size={12} className="animate-spin" /> : 'AI REVIEW'}
          </button>
        </div>
      )}
    </div>
  );
};

const LandReport: React.FC<LandReportProps> = ({ result, lang = 'EN', onAnalyzeFinance }) => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'map'>('dashboard');
  const [isSearchingPincode, setIsSearchingPincode] = useState(false);
  
  const [allListings, setAllListings] = useState<LandListing[]>(result.listings || []);
  const [isDeepScanning, setIsDeepScanning] = useState(false);

  useEffect(() => {
    setAllListings(result.listings || []);
  }, [result.listings]);

  useEffect(() => {
    const landValueStr = typeof result.landValue === 'string' ? result.landValue : formatPrice(result.landValue);
    const speechText = lang === 'HI' ? `प्लॉट का मूल्य ${landValueStr} है।` : `The plot's market value is ${landValueStr}.`;
    speak(speechText, lang === 'HI' ? 'hi-IN' : 'en-IN');
  }, [result.landValue, lang]);

  const handleDeepScan = async () => {
    if (isDeepScanning) return;
    setIsDeepScanning(true);
    setIsSearchingPincode(true);
    
    try {
      const city = allListings[0]?.address?.split(',').pop()?.trim() || 'Unknown City';
      const area = allListings[0]?.address?.split(',')[0]?.trim() || '';
      
      const more = await getMoreListings({
        city,
        area,
        propertyType: 'Plot',
        size: 1000,
        mode: 'land'
      });
      
      const formattedMore: LandListing[] = more.map(l => ({
        title: l.project || "Land Parcel",
        price: formatPrice(l.totalPrice || l.price),
        size: `${l.size_sqyd || 1000} sqyd`,
        address: `${l.project}, ${area}, ${city}`,
        sourceUrl: 'https://www.99acres.com',
        latitude: l.latitude,
        longitude: l.longitude,
        facing: 'East'
      }));

      const uniqueNew = formattedMore.filter(nm => !allListings.some(al => al.title === nm.title));
      setAllListings(prev => [...prev, ...uniqueNew]);
      
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.8 } });
    } catch (e) {
      console.error("Land Deep Scan Failed:", e);
    } finally {
      setIsDeepScanning(false);
      setIsSearchingPincode(false);
    }
  };

  const mapNodes = allListings.map((l, i) => ({
    title: l.title,
    price: l.price,
    address: l.address,
    lat: l.latitude,
    lng: l.longitude,
    isSubject: i === 0
  }));

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-right-8 duration-1000 pb-20">
      {isSearchingPincode && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 bg-orange-500 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-neo-glow flex items-center gap-3 animate-bounce">
          <RefreshCw size={14} className="animate-spin" /> Deep land registry scan in progress...
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-50 rounded-2xl">
            <Calculator size={24} className="text-orange-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Plot Valuation Node</h2>
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Strict Grounding Engine</p>
          </div>
        </div>
        
        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 no-pdf-export overflow-x-auto scrollbar-hide">
          <button onClick={() => setViewMode('dashboard')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest shrink-0 ${viewMode === 'dashboard' ? 'bg-orange-500 text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>DASHBOARD</button>
          <button onClick={() => setViewMode('map')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest shrink-0 ${viewMode === 'map' ? 'bg-orange-500 text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}>MAP VIEW</button>
        </div>
      </div>

      {viewMode === 'map' ? (
        <GoogleMapView nodes={mapNodes} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-[32px] p-6 border border-white/10 border-t-2 border-t-orange-500 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">Total Fair Value</span>
                <div className="text-2xl font-black text-white">{typeof result.landValue === 'string' ? result.landValue : formatPrice(result.landValue)}</div>
              </div>
              {onAnalyzeFinance && (
                <button onClick={() => { setIsSearchingPincode(true); setTimeout(() => { onAnalyzeFinance(parsePrice(result.landValue)); setIsSearchingPincode(false); }, 800); }} className="mt-4 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[8px] font-black uppercase flex items-center gap-2 hover:bg-orange-500 hover:text-white transition-all">
                  <TrendingUp size={10}/> Simulator
                </button>
              )}
            </div>
            <div className="bg-white/5 rounded-[32px] p-6 border border-white/10">
              <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">Rate Breakdown</span>
              <div className="text-xl font-black text-white">{result.perSqmValue}</div>
            </div>
            <div className="bg-white/5 rounded-[32px] p-6 border border-white/10">
              <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">Yield (Proj)</span>
              <div className="text-2xl font-black text-emerald-500">{result.devROI}</div>
            </div>
            <div className="bg-white/5 rounded-[32px] p-6 border border-white/10">
              <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">Confidence</span>
              <div className="text-2xl font-black text-white">{result.confidenceScore}%</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-10 scrollbar-hide">
            <div className="space-y-8">
              <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 border-l-4 border-l-orange-500">
                <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2 uppercase">
                  <Zap size={18} className="text-orange-500" /> Grounded Justification
                </h3>
                <p className="text-gray-400 leading-relaxed italic text-sm">"{result.valuationJustification}"</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allListings.map((item, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-[32px] p-6 group shadow-glass-3d animate-in fade-in zoom-in duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                    <AIPropertyImage title={item.title} address={item.address} type="Plot" />
                    <div className="mb-4">
                      <h4 className="font-black text-white truncate uppercase">{item.title}</h4>
                      <p className="text-[10px] text-gray-500 truncate font-bold tracking-widest mt-1 uppercase">{item.address}</p>
                      <div className="mt-4 flex justify-between items-center pt-4 border-t border-white/5">
                        <span className="text-xl font-black text-orange-500">{typeof item.price === 'string' ? item.price : formatPrice(item.price)}</span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.size}</span>
                      </div>
                    </div>
                    <a href={item.sourceUrl} target="_blank" rel="noopener" className="w-full py-4 rounded-2xl bg-white/5 text-white text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-orange-500 transition-all border border-white/10">Verify Listing <ExternalLink size={14} /></a>
                  </div>
                ))}
              </div>

              {allListings.length > 0 && (
                <div className="flex flex-col items-center gap-6 py-10">
                  <div className="flex items-center gap-2 mb-2">
                     <div className="h-1 w-20 bg-gradient-to-r from-transparent to-orange-500/20" />
                     <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Extended Land Registry Network</p>
                     <div className="h-1 w-20 bg-gradient-to-l from-transparent to-orange-500/20" />
                  </div>
                  <button 
                    onClick={handleDeepScan}
                    disabled={isDeepScanning}
                    className="px-12 py-5 bg-white/5 border border-white/10 rounded-full text-xs font-black uppercase tracking-widest text-white hover:bg-orange-500 hover:border-orange-500 transition-all flex items-center gap-3 shadow-neo-glow group active:scale-95 disabled:opacity-50"
                  >
                    {isDeepScanning ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} className="group-hover:rotate-90 transition-transform" />}
                    {isDeepScanning ? 'Syncing Land Registries...' : 'Load All Available Plots & Parcels'}
                  </button>
                </div>
              )}

              {allListings.length === 0 && !isSearchingPincode && (
                <div className="text-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10">
                   <MapIcon size={48} className="mx-auto text-gray-600 mb-6 opacity-20" />
                   <p className="text-gray-500 font-black uppercase tracking-widest text-xs">No active land listings detected in this micro-market.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LandReport;