import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import ChatInterface from './components/ChatInterface';
import ValuationReport from './components/ValuationReport';
import RentDashboard from './components/RentDashboard';
import { ValuationRequest, ValuationResult, RentRequest, RentResult, AppMode, UserProfile } from './types';
import { getValuationAnalysis, getRentAnalysis } from './services/geminiService';
import { REAL_ESTATE_KNOWLEDGE_BASE } from './data/knowledgeBase';
import { ArrowLeft, Zap, Search, BarChart3, ShieldAlert, Database, Info, User, Sun, Moon } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mode, setMode] = useState<AppMode>('valuation');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [valuationData, setValuationData] = useState<ValuationResult | null>(null);
  const [requestData, setRequestData] = useState<ValuationRequest | null>(null);
  const [rentData, setRentData] = useState<RentResult | null>(null);
  const [rentRequest, setRentRequest] = useState<RentRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  // Engagement: Rotate market facts during loading
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setCurrentFactIndex(prev => (prev + 1) % REAL_ESTATE_KNOWLEDGE_BASE.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Handle Dark/Light Mode
  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const handleComplete = async (data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'valuation') {
        setRequestData(data as ValuationRequest);
        const result = await getValuationAnalysis(data as ValuationRequest);
        setValuationData(result);
      } else {
        setRentRequest(data as RentRequest);
        const result = await getRentAnalysis(data as RentRequest);
        setRentData(result);
      }
    } catch (err) {
      console.error(err);
      setError("Intelligence wing encountered a signal disruption. Lead Tester verification failed to find high-integrity data clusters.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetApp = () => {
    setValuationData(null);
    setRequestData(null);
    setRentData(null);
    setRentRequest(null);
    setError(null);
    setSessionKey(prev => prev + 1);
  };

  const switchMode = (newMode: AppMode) => {
    if (mode === newMode) return;
    setMode(newMode);
    resetApp();
  };

  const isAnyResult = !!valuationData || !!rentData;

  if (!user) {
    return <Onboarding onComplete={(profile) => setUser(profile)} />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-cyber-black dark:bg-cyber-black bg-slate-50 text-cyber-text overflow-hidden relative selection:bg-cyber-teal selection:text-cyber-black transition-colors duration-500">
      
      {/* Dynamic Aura Background */}
      <div className={`absolute top-0 left-0 w-full h-[600px] transition-all duration-1000 pointer-events-none opacity-20 ${mode === 'valuation' ? 'bg-gradient-to-b from-cyber-teal/40' : 'bg-gradient-to-b from-cyber-lime/40'}`} />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyber-teal/5 blur-[160px] rounded-full pointer-events-none animate-pulse-slow" />

      {/* Primary Navigation Hub */}
      <header className="px-8 py-5 flex items-center justify-between z-30 border-b border-cyber-border bg-cyber-black/90 dark:bg-cyber-black/90 bg-white/90 backdrop-blur-2xl transition-colors duration-500">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={resetApp}>
            <div className={`p-2.5 rounded-2xl border backdrop-blur-xl transition-all shadow-xl group-hover:scale-105 ${mode === 'valuation' ? 'bg-cyber-teal/10 border-cyber-teal/30 shadow-neon-teal' : 'bg-cyber-lime/10 border-cyber-lime/30 shadow-neon-lime'}`}>
                <Zap size={22} className={mode === 'valuation' ? 'text-cyber-teal' : 'text-cyber-lime'} />
            </div>
            <span className="font-bold text-2xl tracking-tighter font-mono dark:text-white text-slate-900">QUANT<span className={mode === 'valuation' ? 'text-cyber-teal' : 'text-cyber-lime'}>CASA</span> <span className="text-[10px] ml-1 opacity-40 font-normal uppercase tracking-widest">Research Wing</span></span>
          </div>

          {!isAnyResult && (
            <nav className="hidden xl:flex items-center bg-white/5 dark:bg-white/5 bg-slate-100 rounded-2xl p-1.5 border border-white/5 dark:border-white/5 border-slate-200 shadow-inner">
              <button 
                onClick={() => switchMode('valuation')}
                className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-[11px] font-mono font-bold tracking-[0.2em] transition-all duration-500 ${mode === 'valuation' ? 'bg-cyber-teal text-cyber-black shadow-neon-teal' : 'text-gray-500 dark:text-gray-500 hover:text-white dark:hover:text-white hover:text-slate-900'}`}
              >
                <BarChart3 size={16} /> VALUATION_MATRIX
              </button>
              <button 
                onClick={() => switchMode('rent')}
                className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-[11px] font-mono font-bold tracking-[0.2em] transition-all duration-500 ${mode === 'rent' ? 'bg-cyber-lime text-cyber-black shadow-neon-lime' : 'text-gray-500 dark:text-gray-500 hover:text-white dark:hover:text-white hover:text-slate-900'}`}
              >
                <Search size={16} /> RENTAL_WING
              </button>
            </nav>
          )}
        </div>
        
        <div className="flex items-center gap-5">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white/5 dark:bg-white/5 bg-slate-100 border border-white/10 dark:border-white/10 border-slate-200 text-gray-500 dark:text-gray-400 hover:text-cyber-teal transition-all shadow-lg"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 dark:bg-white/5 bg-slate-100 border border-white/10 dark:border-white/10 border-slate-200 font-mono text-[10px] text-gray-400 dark:text-gray-400">
             <User size={12} className="text-cyber-teal" />
             <span className="truncate max-w-[100px] uppercase font-bold dark:text-white text-slate-800">{user.name.split(' ')[0]}</span>
          </div>
          {isAnyResult && (
              <button 
                  onClick={resetApp}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 dark:bg-white/5 bg-slate-100 border border-white/10 dark:border-white/10 border-slate-200 text-[11px] font-bold text-cyber-text dark:text-cyber-text text-slate-600 hover:text-white dark:hover:text-white hover:bg-cyber-teal/10 hover:border-cyber-teal/30 transition-all font-mono tracking-widest"
              >
                  <ArrowLeft size={16} /> RE_INITIALIZE
              </button>
          )}
        </div>
      </header>

      {/* Main Command Center */}
      <main className="flex-1 flex flex-col md:flex-row gap-8 p-8 h-[calc(100vh-80px)] overflow-hidden relative z-10">
        
        {/* Research Wing Engaging Loading Sequence */}
        {isLoading && (
            <div className="absolute inset-0 z-50 bg-cyber-black/98 dark:bg-cyber-black/98 bg-slate-50/98 backdrop-blur-3xl flex flex-col items-center justify-center animate-in fade-in duration-500 p-8">
                 <div className="relative mb-12">
                   <div className={`w-48 h-48 border-t-2 border-l-2 rounded-full animate-spin duration-[2s] ${mode === 'valuation' ? 'border-cyber-teal shadow-neon-teal' : 'border-cyber-lime shadow-neon-lime'}`}></div>
                   <div className="absolute inset-2 border-r-2 border-b-2 border-white/5 dark:border-white/5 border-slate-200 rounded-full animate-spin-reverse duration-[4s]"></div>
                   
                   {/* Scanning Effect */}
                   <div className="absolute inset-0 overflow-hidden rounded-full">
                      <div className={`w-full h-1 bg-gradient-to-r from-transparent via-cyber-lime to-transparent absolute top-0 left-0 animate-[scan_2s_linear_infinite] shadow-[0_0_15px_#B4FF5C] opacity-50`} />
                   </div>

                   <div className="absolute inset-0 flex items-center justify-center">
                      <Database size={48} className={`animate-pulse ${mode === 'valuation' ? 'text-cyber-teal' : 'text-cyber-lime'}`} />
                   </div>
                 </div>

                 <div className="max-w-xl text-center">
                    <p className={`text-3xl font-mono font-bold tracking-[0.4em] mb-4 uppercase ${mode === 'valuation' ? 'text-cyber-teal' : 'text-cyber-lime'}`}>
                      {mode === 'valuation' ? 'Extracting_Market_Data' : 'Locating_Geo_Clusters'}
                    </p>
                    
                    {/* Engagement: Intelligence Feed */}
                    <div className="glass-panel rounded-2xl p-6 border-l-4 border-cyber-lime bg-white/[0.02] dark:bg-white/[0.02] bg-white mb-8 animate-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center gap-2 mb-3">
                            <Info size={14} className="text-cyber-lime" />
                            <span className="text-[10px] font-mono text-gray-500 dark:text-gray-500 text-slate-400 uppercase tracking-widest">Market Intelligence Feed</span>
                        </div>
                        <p className="text-sm font-mono dark:text-white text-slate-800 leading-relaxed italic">
                           "{REAL_ESTATE_KNOWLEDGE_BASE[currentFactIndex]}"
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-3">
                       <div className="h-px w-16 bg-white/10 dark:bg-white/10 bg-slate-200"></div>
                       <p className="text-[10px] text-gray-500 dark:text-gray-500 text-slate-400 font-mono tracking-[0.3em] uppercase animate-pulse">Lead Tester Verification in Progress</p>
                       <div className="h-px w-16 bg-white/10 dark:bg-white/10 bg-slate-200"></div>
                    </div>
                 </div>
            </div>
        )}

        {/* Input/Interaction Stream */}
        <div className={`transition-all duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] flex-shrink-0 flex flex-col ${isAnyResult ? 'w-full md:w-[420px]' : 'w-full md:w-[680px] md:mx-auto'}`}>
             
             {!isAnyResult && (
               <div className="flex xl:hidden mb-8 bg-white/5 dark:bg-white/5 bg-white p-1.5 rounded-2xl border border-white/5 dark:border-white/5 border-slate-200 shadow-sm">
                 <button 
                  onClick={() => switchMode('valuation')}
                  className={`flex-1 py-4 rounded-xl text-[11px] font-mono font-bold tracking-widest transition-all ${mode === 'valuation' ? 'bg-cyber-teal text-cyber-black shadow-neon-teal' : 'text-gray-500 dark:text-gray-500 text-slate-400'}`}
                 >
                   VALUATION
                 </button>
                 <button 
                  onClick={() => switchMode('rent')}
                  className={`flex-1 py-4 rounded-xl text-[11px] font-mono font-bold tracking-widest transition-all ${mode === 'rent' ? 'bg-cyber-lime text-cyber-black shadow-neon-lime' : 'text-gray-500 dark:text-gray-500 text-slate-400'}`}
                 >
                   RENT_APP
                 </button>
               </div>
             )}

             <div className="flex-1 min-h-0">
               <ChatInterface 
                  key={`${sessionKey}-${mode}`} 
                  mode={mode} 
                  onComplete={handleComplete} 
                  isLoading={isLoading} 
                />
             </div>

             {error && (
                 <div className="mt-6 p-5 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/30 text-[11px] font-mono flex items-center gap-4 animate-in slide-in-from-top-4">
                     <ShieldAlert size={20} className="shrink-0" />
                     <p className="uppercase tracking-widest font-bold leading-relaxed">Intelligence wing signal failure. <br/> Reason: {error}</p>
                 </div>
             )}
        </div>

        {/* Intelligence Visualization Area */}
        <div className="flex-1 min-h-0 relative">
          {valuationData && requestData && (
              <div className="h-full animate-in fade-in zoom-in-95 duration-1000 slide-in-from-right-16">
                  <ValuationReport result={valuationData} request={requestData} />
              </div>
          )}
          {rentData && rentRequest && (
              <div className="h-full animate-in fade-in zoom-in-95 duration-1000 slide-in-from-right-16">
                  <RentDashboard result={rentData} request={rentRequest} />
              </div>
          )}
          
          {/* Neutral State */}
          {!isAnyResult && !isLoading && (
            <div className="hidden md:flex h-full flex-col items-center justify-center text-center opacity-40 select-none group">
              <div className={`mb-10 p-12 rounded-full border border-dashed transition-all duration-700 ${mode === 'valuation' ? 'border-cyber-teal/30 dark:border-cyber-teal/30 border-slate-300 group-hover:border-cyber-teal' : 'border-cyber-lime/30 dark:border-cyber-lime/30 border-slate-300 group-hover:border-cyber-lime'}`}>
                {mode === 'valuation' ? <BarChart3 size={80} className="text-cyber-teal" /> : <Search size={80} className="text-cyber-lime" />}
              </div>
              <h1 className="text-3xl font-mono font-bold tracking-[0.5em] uppercase dark:text-white text-slate-900 drop-shadow-lg mb-4">Awaiting_指令</h1>
              <div className="mt-4 flex flex-col items-center gap-3">
                <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-gray-500">Research Wing Offline • Initialize Protocol</p>
                <div className="flex gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-cyber-lime animate-bounce"></div>
                   <div className="w-1.5 h-1.5 rounded-full bg-cyber-lime animate-bounce [animation-delay:200ms]"></div>
                   <div className="w-1.5 h-1.5 rounded-full bg-cyber-lime animate-bounce [animation-delay:400ms]"></div>
                </div>
              </div>
            </div>
          )}
        </div>

      </main>

      <style>{`
        .animate-spin-reverse {
          animation: spin 3s linear infinite reverse;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes scan {
          0% { top: -10%; }
          100% { top: 110%; }
        }
        .animate-pulse-slow {
          animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default App;