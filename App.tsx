
import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import ChatInterface from './components/ChatInterface';
import BuyDashboard from './components/BuyDashboard';
import RentDashboard from './components/RentDashboard';
import LandReport from './components/LandReport';
import { 
  BuyRequest, BuyResult, 
  RentRequest, RentResult, 
  LandRequest, LandResult,
  SellRequest,
  AppMode, UserProfile
} from './types';
import { 
  getBuyAnalysis, getRentAnalysis, getLandValuationAnalysis 
} from './services/geminiService';
import { REAL_ESTATE_KNOWLEDGE_BASE } from './data/knowledgeBase';
import { Zap, ShieldAlert, Database, User, ShoppingBag, Search, Map as MapIcon, Layers, ArrowLeft, Tag, Building2, Landmark } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mode, setMode] = useState<AppMode>('buy');
  const [buyType, setBuyType] = useState<'New Buy' | 'Resale'>('New Buy');
  
  const [buyData, setBuyData] = useState<BuyResult | null>(null);
  const [rentData, setRentData] = useState<RentResult | null>(null);
  const [landData, setLandData] = useState<LandResult | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  // For expansion logic
  const [suggestExpansion, setSuggestExpansion] = useState(false);
  const [pendingRequestData, setPendingRequestData] = useState<any>(null);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setCurrentFactIndex(prev => (prev + 1) % REAL_ESTATE_KNOWLEDGE_BASE.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleComplete = async (data: any) => {
    setIsLoading(true);
    setError(null);
    setSuggestExpansion(false);
    try {
      if (mode === 'buy' || mode === 'sell') {
        // Inject current buyType into the request
        const requestData = { ...data, purchaseType: buyType === 'New Buy' ? 'New Booking' : 'Resale Purchase' };
        const result = await getBuyAnalysis(requestData as BuyRequest);
        setBuyData(result);
      } else if (mode === 'rent') {
        const result = await getRentAnalysis(data as RentRequest);
        if (result.suggestRadiusExpansion && !data.forceExpandRadius) {
           setSuggestExpansion(true);
           setPendingRequestData(data);
        } else {
           setRentData(result);
        }
      } else if (mode === 'land') {
        const result = await getLandValuationAnalysis(data as LandRequest);
        setLandData(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Intelligence Wing signal disruption.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmExpansion = () => {
    if (pendingRequestData) {
      handleComplete({ ...pendingRequestData, forceExpandRadius: true });
    }
  };

  const resetMode = () => {
    setBuyData(null);
    setRentData(null);
    setLandData(null);
    setError(null);
    setSuggestExpansion(false);
    setPendingRequestData(null);
    setSessionKey(prev => prev + 1);
  };

  const isAnyResult = !!buyData || !!rentData || !!landData;

  if (!user) return <Onboarding onComplete={setUser} />;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-cyber-black text-cyber-text overflow-hidden relative selection:bg-cyber-teal selection:text-black">
      <header className="px-4 md:px-8 py-4 md:py-5 flex flex-col md:flex-row items-center justify-between z-30 border-b border-cyber-border bg-cyber-black/95 backdrop-blur-2xl gap-4">
        <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-12">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { resetMode(); }}>
            <div className="p-2 rounded-xl border border-cyber-teal/30 bg-cyber-teal/10 shadow-neon-teal group-hover:bg-cyber-teal group-hover:text-black transition-all">
                <Zap size={18} className="group-hover:animate-pulse" />
            </div>
            <span className="font-bold text-xl tracking-tighter font-mono text-white hidden sm:inline">QUANT<span className="text-cyber-teal">CASA</span></span>
          </div>

          <nav className="flex items-center bg-white/5 rounded-2xl p-1 border border-white/5 shadow-inner overflow-x-auto no-scrollbar max-w-full">
            <button 
              onClick={() => { setMode('buy'); resetMode(); }}
              className={`flex items-center gap-2 px-3 md:px-5 py-2 rounded-xl text-[9px] md:text-[10px] font-mono font-bold tracking-widest transition-all whitespace-nowrap ${mode === 'buy' ? 'bg-cyber-teal text-cyber-black shadow-neon-teal' : 'text-gray-500 hover:text-white'}`}
            >
              <ShoppingBag size={14} /> BUY
            </button>
            <button 
              onClick={() => { setMode('sell'); resetMode(); }}
              className={`flex items-center gap-2 px-3 md:px-5 py-2 rounded-xl text-[9px] md:text-[10px] font-mono font-bold tracking-widest transition-all whitespace-nowrap ${mode === 'sell' ? 'bg-cyber-teal text-cyber-black shadow-neon-teal' : 'text-gray-500 hover:text-white'}`}
            >
              <Tag size={14} /> SELL
            </button>
            <button 
              onClick={() => { setMode('rent'); resetMode(); }}
              className={`flex items-center gap-2 px-3 md:px-5 py-2 rounded-xl text-[9px] md:text-[10px] font-mono font-bold tracking-widest transition-all whitespace-nowrap ${mode === 'rent' ? 'bg-cyber-teal text-cyber-black shadow-neon-teal' : 'text-gray-500 hover:text-white'}`}
            >
              <Search size={14} /> RENT
            </button>
            <button 
              onClick={() => { setMode('land'); resetMode(); }}
              className={`flex items-center gap-2 px-3 md:px-5 py-2 rounded-xl text-[9px] md:text-[10px] font-mono font-bold tracking-widest transition-all whitespace-nowrap ${mode === 'land' ? 'bg-cyber-teal text-cyber-black shadow-neon-teal' : 'text-gray-500 hover:text-white'}`}
            >
              <MapIcon size={14} /> LAND
            </button>
          </nav>
        </div>
        
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          {(mode === 'buy' || mode === 'sell') && !isAnyResult && (
            <div className="flex bg-cyber-black border border-white/10 rounded-xl p-1 shadow-inner">
               <button 
                onClick={() => { setBuyType('New Buy'); resetMode(); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all ${buyType === 'New Buy' ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30' : 'text-gray-600 hover:text-gray-400'}`}
               >
                 <Building2 size={12} /> NEW BUY
               </button>
               <button 
                onClick={() => { setBuyType('Resale'); resetMode(); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all ${buyType === 'Resale' ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30' : 'text-gray-600 hover:text-gray-400'}`}
               >
                 <Landmark size={12} /> RESALE
               </button>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 font-mono text-[9px] text-gray-400">
             <User size={10} className="text-cyber-teal" /> {user.name.toUpperCase()}
          </div>
          {isAnyResult && (
              <button onClick={resetMode} className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-cyber-teal/10 border border-cyber-teal text-cyber-teal text-[10px] font-bold font-mono shadow-neon-teal hover:bg-cyber-teal hover:text-black transition-all">
                  <ArrowLeft size={14} /> NEW_VAL
              </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col md:flex-row gap-4 md:gap-8 p-4 md:p-8 overflow-hidden relative">
          {isLoading && (
              <div className="absolute inset-0 z-50 bg-cyber-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8">
                   <div className="relative mb-8 md:mb-12 animate-pulse">
                     <div className="w-32 h-32 md:w-48 md:h-48 border-t-2 border-cyber-teal rounded-full animate-spin"></div>
                     <div className="absolute inset-0 flex items-center justify-center">
                        <Database size={32} className="md:size-[48px] text-cyber-teal" />
                     </div>
                   </div>
                   <p className="text-xl md:text-2xl font-mono font-bold tracking-widest text-cyber-teal uppercase mb-4 animate-glow text-center">QUANT_PROCESSOR_ENGAGED</p>
                   <div className="max-w-xl glass-panel p-4 md:p-6 border-l-4 border-cyber-lime">
                      <p className="text-[11px] md:text-sm font-mono text-white italic leading-relaxed">"{REAL_ESTATE_KNOWLEDGE_BASE[currentFactIndex]}"</p>
                   </div>
              </div>
          )}

          <div className={`transition-all duration-700 flex-shrink-0 flex flex-col ${isAnyResult ? 'w-full md:w-[420px]' : 'w-full md:w-[600px] md:mx-auto'}`}>
               <div className="flex-1 min-h-[400px] md:min-h-0">
                 <ChatInterface 
                    key={`${sessionKey}-${mode}-${buyType}`} 
                    mode={mode} 
                    buyType={buyType}
                    onComplete={handleComplete} 
                    isLoading={isLoading} 
                    suggestExpansion={suggestExpansion}
                    onConfirmExpansion={handleConfirmExpansion}
                 />
               </div>
               {error && (
                   <div className="mt-4 p-4 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/30 text-[10px] font-mono flex items-center gap-3">
                       <ShieldAlert size={16} className="shrink-0" />
                       <p className="uppercase tracking-widest">{error}</p>
                   </div>
               )}
          </div>

          <div className="flex-1 min-h-0 relative">
            {(buyData || mode === 'sell' && buyData) && <BuyDashboard result={buyData} buyType={buyType} />}
            {rentData && mode === 'rent' && <RentDashboard result={rentData} />}
            {landData && mode === 'land' && <LandReport result={landData} />}
            
            {!isAnyResult && !isLoading && (
              <div className="hidden md:flex h-full flex-col items-center justify-center text-center opacity-30 select-none">
                <div className="mb-10 p-12 rounded-full border border-dashed border-white/20 animate-pulse-slow">
                  <Layers size={80} className="text-cyber-teal" />
                </div>
                <h1 className="text-4xl font-mono font-bold tracking-[0.6em] text-white uppercase mb-4 tracking-tighter">MODE_INACTIVE</h1>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em]">Use Chat Interface to Input Sector Parameters</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default App;
