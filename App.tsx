
import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import ChatInterface from './components/ChatInterface';
import BuyDashboard from './components/BuyDashboard';
import RentDashboard from './components/RentDashboard';
import LandReport from './components/LandReport';
import LoanCalculator from './components/LoanCalculator';
import TutorialOverlay from './components/TutorialOverlay';
import { 
  BuyRequest, BuyResult, 
  RentRequest, RentResult, 
  LandRequest, LandResult,
  AppMode, UserProfile, SavedSearch
} from './types';
import { 
  getBuyAnalysis, getRentAnalysis, getLandValuationAnalysis 
} from './services/geminiService';
import { REAL_ESTATE_KNOWLEDGE_BASE } from './data/knowledgeBase';
import { Zap, User, ShoppingBag, Search, Map as MapIcon, Layers, ArrowLeft, Tag, Building2, Landmark, Bookmark, Trash2, Clock, X, Globe, Calculator } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [mode, setMode] = useState<AppMode>('buy');
  const [buyType, setBuyType] = useState<'New Buy' | 'Resale'>('New Buy');
  
  const [buyData, setBuyData] = useState<BuyResult | null>(null);
  const [rentData, setRentData] = useState<RentResult | null>(null);
  const [landData, setLandData] = useState<LandResult | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("INITIALIZING_SEARCH_GROUNDING");
  const [error, setError] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  const [suggestExpansion, setSuggestExpansion] = useState(false);
  const [pendingRequestData, setPendingRequestData] = useState<any>(null);
  
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSavedPanel, setShowSavedPanel] = useState(false);

  useEffect(() => {
    // Check if user is already in storage
    const storedUser = localStorage.getItem('quantcasa_user_profile');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const tutorialComplete = localStorage.getItem('quantcasa_tutorial_complete');
    if (!tutorialComplete && storedUser) {
      setShowTutorial(true);
    }

    const stored = localStorage.getItem('quantcasa_saved_intel');
    if (stored) {
      try {
        setSavedSearches(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load saved searches");
      }
    }
  }, []);

  const statuses = [
    "SCANNING_PROPERTY_PORTALS...",
    "TRIANGULATING_GEO_CLUSTERS...",
    "GROUNDING_NEURAL_METADATA...",
    "EXTRACTING_MARKET_LISTINGS...",
    "SYNTHESIZING_ASSET_VALUATION...",
    "FINALIZING_REPORT_STREAMS..."
  ];

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      let statusIdx = 0;
      interval = setInterval(() => {
        setLoadingStatus(statuses[statusIdx % statuses.length]);
        statusIdx++;
        setCurrentFactIndex(prev => (prev + 1) % REAL_ESTATE_KNOWLEDGE_BASE.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('quantcasa_user_profile', JSON.stringify(profile));
    setShowTutorial(true);
  };

  const handleTutorialClose = () => {
    setShowTutorial(false);
    localStorage.setItem('quantcasa_tutorial_complete', 'true');
  };

  const handleComplete = async (data: any) => {
    setIsLoading(true);
    setError(null);
    setSuggestExpansion(false);
    setPendingRequestData(data);
    try {
      if (mode === 'buy' || mode === 'sell') {
        const requestData = { ...data, purchaseType: buyType === 'New Buy' ? 'New Booking' : 'Resale Purchase' };
        const result = await getBuyAnalysis(requestData as BuyRequest);
        setBuyData(result);
      } else if (mode === 'rent') {
        const result = await getRentAnalysis(data as RentRequest);
        if (result.suggestRadiusExpansion && !data.forceExpandRadius) {
           setSuggestExpansion(true);
        } else {
           setRentData(result);
        }
      } else if (mode === 'land') {
        const result = await getLandValuationAnalysis(data as LandRequest);
        setLandData(result);
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Signal disruption.");
    } finally {
      setIsLoading(false);
      if (window.innerWidth < 768) {
        setTimeout(() => {
          window.scrollTo({ top: 400, behavior: 'smooth' });
        }, 100);
      }
    }
  };

  const handleSaveSearch = () => {
    if (!pendingRequestData) return;
    
    const configStr = mode === 'land' 
      ? `${pendingRequestData.plotSize} ${pendingRequestData.unit}`
      : `${pendingRequestData.bhk || 'N/A'} • ${pendingRequestData.sqft} SQFT`;

    const newSaved: SavedSearch = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      mode,
      location: pendingRequestData.address,
      city: pendingRequestData.city,
      config: configStr,
      data: pendingRequestData
    };

    const updated = [newSaved, ...savedSearches].slice(0, 20);
    setSavedSearches(updated);
    localStorage.setItem('quantcasa_saved_intel', JSON.stringify(updated));
  };

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedSearches.filter(s => s.id !== id);
    setSavedSearches(updated);
    localStorage.setItem('quantcasa_saved_intel', JSON.stringify(updated));
  };

  const handleRecallSearch = (saved: SavedSearch) => {
    setMode(saved.mode);
    setBuyData(null);
    setRentData(null);
    setLandData(null);
    setShowSavedPanel(false);
    handleComplete(saved.data);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAnyResult = !!buyData || !!rentData || !!landData || mode === 'finance';

  const parseValue = (val: string) => {
    const numeric = parseFloat(val.replace(/[^\d.]/g, ''));
    if (val.includes('Cr')) return numeric * 10000000;
    if (val.includes('L')) return numeric * 100000;
    return numeric;
  };

  if (!user) return <Onboarding onComplete={handleOnboardingComplete} />;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-cyber-black text-cyber-text selection:bg-cyber-teal selection:text-black">
      {showTutorial && <TutorialOverlay onClose={handleTutorialClose} />}
      
      <header className="sticky top-0 px-4 md:px-8 py-4 md:py-5 flex flex-col md:flex-row items-center justify-between z-[60] border-b border-cyber-border bg-cyber-black/95 backdrop-blur-2xl gap-4">
        <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-12">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={resetMode}>
            <div className="p-2 rounded-xl border border-cyber-teal/30 bg-cyber-teal/10 shadow-neon-teal">
                <Zap size={18} />
            </div>
            <span className="font-bold text-xl tracking-tighter font-mono text-white hidden sm:inline">QUANT<span className="text-cyber-teal">CASA</span></span>
          </div>

          <nav className="flex items-center bg-white/5 rounded-2xl p-1 border border-white/5 shadow-inner">
            <button onClick={() => { setMode('buy'); resetMode(); }} className={`flex items-center gap-2 px-3 md:px-5 py-2 rounded-xl text-[9px] md:text-[10px] font-mono font-bold tracking-widest transition-all ${mode === 'buy' ? 'bg-cyber-teal text-cyber-black shadow-neon-teal' : 'text-gray-500 hover:text-white'}`}>
              <ShoppingBag size={14} /> BUY
            </button>
            <button onClick={() => { setMode('sell'); resetMode(); }} className={`flex items-center gap-2 px-3 md:px-5 py-2 rounded-xl text-[9px] md:text-[10px] font-mono font-bold tracking-widest transition-all ${mode === 'sell' ? 'bg-cyber-teal text-cyber-black shadow-neon-teal' : 'text-gray-500 hover:text-white'}`}>
              <Tag size={14} /> SELL
            </button>
            <button onClick={() => { setMode('rent'); resetMode(); }} className={`flex items-center gap-2 px-3 md:px-5 py-2 rounded-xl text-[9px] md:text-[10px] font-mono font-bold tracking-widest transition-all ${mode === 'rent' ? 'bg-cyber-teal text-cyber-black shadow-neon-teal' : 'text-gray-500 hover:text-white'}`}>
              <Search size={14} /> RENT
            </button>
            <button onClick={() => { setMode('land'); resetMode(); }} className={`flex items-center gap-2 px-3 md:px-5 py-2 rounded-xl text-[9px] md:text-[10px] font-mono font-bold tracking-widest transition-all ${mode === 'land' ? 'bg-cyber-teal text-cyber-black shadow-neon-teal' : 'text-gray-500 hover:text-white'}`}>
              <MapIcon size={14} /> LAND
            </button>
            <button onClick={() => { setMode('finance'); resetMode(); }} className={`flex items-center gap-2 px-3 md:px-5 py-2 rounded-xl text-[9px] md:text-[10px] font-mono font-bold tracking-widest transition-all ${mode === 'finance' ? 'bg-cyber-orange text-cyber-black shadow-neon-orange' : 'text-gray-500 hover:text-white'}`}>
              <Calculator size={14} /> FINANCE
            </button>
          </nav>
        </div>
        
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          {(mode === 'buy' || mode === 'sell') && !isAnyResult && (
            <div className="flex bg-cyber-black border border-white/10 rounded-xl p-1 shadow-inner">
               <button onClick={() => { setBuyType('New Buy'); resetMode(); }} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all ${buyType === 'New Buy' ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30' : 'text-gray-600 hover:text-gray-400'}`}>
                 <Building2 size={12} /> NEW BUY
               </button>
               <button onClick={() => { setBuyType('Resale'); resetMode(); }} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all ${buyType === 'Resale' ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30' : 'text-gray-600 hover:text-gray-400'}`}>
                 <Landmark size={12} /> RESALE
               </button>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowSavedPanel(true)}
              className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-cyber-teal transition-all group"
            >
              <Bookmark size={18} />
              {savedSearches.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyber-teal text-cyber-black text-[9px] font-bold rounded-full flex items-center justify-center border border-cyber-black">
                  {savedSearches.length}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 font-mono text-[9px] text-gray-400">
               <User size={10} className="text-cyber-teal" /> {user.name.toUpperCase()}
            </div>
            
            {(isAnyResult && mode !== 'finance') && (
                <button onClick={resetMode} className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-cyber-teal/10 border border-cyber-teal text-cyber-teal text-[10px] font-bold font-mono shadow-neon-teal hover:bg-cyber-teal hover:text-black transition-all">
                    <ArrowLeft size={14} /> NEW_VAL
                </button>
            )}
          </div>
        </div>
      </header>

      {/* Saved Intelligence Hub Sidebar */}
      {showSavedPanel && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={() => setShowSavedPanel(false)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-[380px] bg-cyber-black border-l border-white/10 z-[101] p-6 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Bookmark className="text-cyber-teal" size={20} />
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-widest">SAVED_INTELLIGENCE</h3>
              </div>
              <button onClick={() => setShowSavedPanel(false)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
              {savedSearches.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 opacity-30 text-center">
                  <Bookmark size={40} className="mb-4" />
                  <p className="text-[10px] font-mono uppercase tracking-widest">NO_SAVED_INTEL</p>
                </div>
              ) : (
                savedSearches.map(saved => (
                  <div 
                    key={saved.id} 
                    onClick={() => handleRecallSearch(saved)}
                    className="group relative bg-white/[0.03] border border-white/5 rounded-2xl p-4 cursor-pointer hover:border-cyber-teal/40 hover:bg-white/[0.05] transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-md bg-cyber-teal/10 text-[8px] font-mono font-bold text-cyber-teal uppercase tracking-widest border border-cyber-teal/20">
                        {saved.mode.toUpperCase()}
                      </span>
                      <button 
                        onClick={(e) => handleDeleteSaved(saved.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <h4 className="text-white text-[11px] font-bold uppercase truncate tracking-tight">{saved.location}</h4>
                    <p className="text-[9px] text-gray-500 font-mono mt-1">{saved.city} • {saved.config}</p>
                    <div className="mt-3 flex items-center justify-between text-[8px] text-gray-600 font-mono uppercase">
                      <span className="flex items-center gap-1"><Clock size={10} /> {new Date(saved.timestamp).toLocaleDateString()}</span>
                      <span className="text-cyber-teal opacity-0 group-hover:opacity-100 transition-opacity">RECALL_SIGNAL</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-[9px] text-gray-600 font-mono leading-relaxed uppercase">
                * Saved criteria are stored locally on your device's research cache.
              </p>
            </div>
          </div>
        </>
      )}

      <main className="flex-1 flex flex-col md:flex-row gap-4 md:gap-8 p-4 md:p-8 relative">
        {isLoading && (
            <div className="fixed inset-0 z-[100] bg-cyber-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8">
                 <div className="relative mb-8 md:mb-12">
                   <div className="w-32 h-32 md:w-48 md:h-48 border-t-2 border-cyber-teal rounded-full animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <Globe size={48} className="text-cyber-teal animate-pulse" />
                   </div>
                 </div>
                 <p className="text-xl md:text-2xl font-mono font-bold tracking-widest text-cyber-teal uppercase mb-4 text-center">{loadingStatus}</p>
                 <div className="max-w-xl glass-panel p-4 md:p-6 border-l-4 border-cyber-lime">
                    <p className="text-[11px] md:text-sm font-mono text-white italic leading-relaxed">"{REAL_ESTATE_KNOWLEDGE_BASE[currentFactIndex]}"</p>
                 </div>
            </div>
        )}

        {error && (
          <div className="fixed bottom-8 right-8 z-[200] glass-panel p-4 border border-red-500/50 bg-red-500/10 rounded-xl flex items-center gap-4 animate-in slide-in-from-right">
             <div className="p-2 bg-red-500 text-white rounded-lg"><Trash2 size={16} /></div>
             <div>
                <div className="text-[10px] font-mono font-bold text-red-500 uppercase">Signal_Disruption_Error</div>
                <div className="text-xs text-white/80 font-mono">{error}</div>
             </div>
             <button onClick={() => setError(null)} className="ml-4 p-2 text-gray-400 hover:text-white"><X size={16} /></button>
          </div>
        )}

        {mode !== 'finance' && (
          <div className={`transition-all duration-700 flex-shrink-0 flex flex-col ${isAnyResult ? 'w-full md:w-[420px]' : 'w-full md:w-[600px] md:mx-auto'}`}>
               <div className="flex-1">
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
          </div>
        )}

        <div className="flex-1 min-h-[400px] relative">
          {mode === 'finance' && <LoanCalculator initialValue={buyData ? parseValue(buyData.fairValue) : 10000000} />}
          {(buyData || (mode === 'sell' && buyData)) && mode !== 'finance' && (
            <BuyDashboard 
              result={buyData} 
              buyType={buyType} 
              onSave={handleSaveSearch} 
              onAnalyzeFinance={(val) => setMode('finance')}
            />
          )}
          {rentData && mode === 'rent' && <RentDashboard result={rentData} onSave={handleSaveSearch} />}
          {landData && mode === 'land' && <LandReport result={landData} onSave={handleSaveSearch} />}
          
          {!isAnyResult && !isLoading && (
            <div className="hidden md:flex h-full flex-col items-center justify-center text-center opacity-30 select-none">
              <Layers size={80} className="text-cyber-teal mb-10 animate-pulse-slow" />
              <h1 className="text-4xl font-mono font-bold tracking-[0.6em] text-white uppercase mb-4">MODE_INACTIVE</h1>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em]">Use Chat Interface to Input Sector Parameters</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
