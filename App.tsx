
import React, { useState } from 'react';
import Onboarding from './components/Onboarding';
import ChatInterface from './components/ChatInterface';
import BuyDashboard from './components/BuyDashboard';
import RentDashboard from './components/RentDashboard';
import LandReport from './components/LandReport';
import LoanCalculator from './components/LoanCalculator';
import { AppMode, AppLang, BuyResult, RentResult, LandResult, BuyRequest, RentRequest, LandRequest } from './types';
import { getBuyAnalysis, getRentAnalysis, getLandValuationAnalysis } from './services/geminiService';
// Fix: Added missing 'Navigation' import from lucide-react
import { ArrowLeft, Home, Zap, ShieldCheck, Sparkles, Binary, X, BarChart3, Navigation } from 'lucide-react';

const App: React.FC = () => {
  const [stage, setStage] = useState<'onboarding' | 'chat' | 'results'>('onboarding');
  const [mode, setMode] = useState<AppMode>('buy');
  const [lang, setLang] = useState<AppLang>('EN');
  const [isLoading, setIsLoading] = useState(false);
  const [showFinance, setShowFinance] = useState(false);
  
  const [buyData, setBuyData] = useState<BuyResult | null>(null);
  const [rentData, setRentData] = useState<RentResult | null>(null);
  const [landData, setLandData] = useState<LandResult | null>(null);

  const startAnalysis = (selectedMode: AppMode, selectedLang: AppLang) => {
    setMode(selectedMode);
    setLang(selectedLang);
    setStage('chat');
  };

  const handleComplete = async (data: any) => {
    setIsLoading(true);
    try {
      if (mode === 'buy') {
        const result = await getBuyAnalysis(data as BuyRequest);
        setBuyData(result);
      } else if (mode === 'rent') {
        const result = await getRentAnalysis(data as RentRequest);
        setRentData(result);
      } else if (mode === 'land') {
        const result = await getLandValuationAnalysis(data as LandRequest);
        setLandData(result);
      }
      setStage('results');
    } catch (err) {
      console.error(err);
      alert("Intelligence node timed out. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const extractPriceValue = (priceStr: string): number => {
      if (!priceStr) return 10000000;
      const num = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
      if (priceStr.includes('Cr')) return num * 10000000;
      if (priceStr.includes('L')) return num * 100000;
      return num;
  };

  if (stage === 'onboarding') {
    return <Onboarding onComplete={startAnalysis} />;
  }

  return (
    <div className="min-h-screen bg-neo-bg text-white flex flex-col font-sans selection:bg-neo-neon/40 overflow-x-hidden">
      <header className="px-6 md:px-10 py-6 border-b border-white/5 bg-neo-glass/60 backdrop-blur-2xl sticky top-0 z-[100] flex items-center justify-between">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => { setStage('onboarding'); setBuyData(null); setRentData(null); setLandData(null); setShowFinance(false); }}>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-neo-neon to-neo-pink rounded-2xl flex items-center justify-center text-white shadow-neo-glow transition-all group-hover:rotate-12 group-hover:scale-110">
            <Home size={24} />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-black text-xl md:text-2xl text-white tracking-tighter leading-none neon-text-glow">QuantCasa</h1>
            <span className="text-[8px] font-black text-neo-neon uppercase tracking-[0.4em] opacity-80">INTELLIGENCE_LAYER_V5.2</span>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setStage('onboarding')} className="h-10 px-6 rounded-2xl bg-white/5 text-[10px] font-black hover:bg-white/10 transition-all flex items-center gap-2 border border-white/5 uppercase tracking-widest shadow-glass-3d active:scale-95">
            <ArrowLeft size={14} /> Back to Start
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-10 flex flex-col lg:flex-row gap-10">
        <div className={`transition-all duration-1000 w-full lg:w-[440px] shrink-0 ${stage === 'results' ? 'hidden lg:block opacity-20 pointer-events-none grayscale' : 'mx-auto'}`}>
          <ChatInterface mode={mode} lang={lang} onComplete={handleComplete} isLoading={isLoading} />
        </div>

        <div className="flex-1 min-w-0">
          {stage === 'results' ? (
            <div className="h-full relative animate-in fade-in slide-in-from-right-10 duration-700">
              {buyData && <BuyDashboard result={buyData} onAnalyzeFinance={() => setShowFinance(true)} />}
              {rentData && <RentDashboard result={rentData} />}
              {landData && <LandReport result={landData} />}

              {showFinance && (
                <div className="fixed inset-0 z-[200] bg-neo-bg/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
                  <div className="w-full max-w-5xl max-h-[90vh] bg-neo-bg border border-white/10 rounded-[64px] p-10 md:p-16 overflow-y-auto relative shadow-neo-glow border-t-white/20">
                    <button onClick={() => setShowFinance(false)} className="absolute top-10 right-10 p-4 bg-white/5 rounded-2xl hover:bg-neo-pink hover:text-white transition-all text-gray-500 shadow-glass-3d active:scale-90"><X size={24}/></button>
                    <div className="mb-12">
                      <div className="flex items-center gap-4 mb-3">
                          <BarChart3 className="text-neo-neon" size={32} />
                          <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Fiscal Simulator</h2>
                      </div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em] font-black pl-12 opacity-60">High-Precision Asset Financing Engine</p>
                    </div>
                    <LoanCalculator initialValue={buyData ? extractPriceValue(buyData.fairValue) : 10000000} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden lg:flex h-full flex-col items-center justify-center text-center p-12 opacity-30">
              <div className="relative mb-12">
                <Binary size={120} className="text-neo-neon animate-pulse" />
                <div className="absolute inset-0 bg-neo-neon blur-[100px] opacity-20" />
              </div>
              <h2 className="text-5xl font-black text-white tracking-tighter uppercase mb-6 leading-none">Awaiting Input Signal...</h2>
              <p className="text-base text-gray-500 max-w-lg leading-relaxed font-medium uppercase tracking-widest">Provide property metrics via the interface to initiate market grounding.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="p-10 text-center border-t border-white/5 bg-neo-glass/20 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-center gap-10 opacity-40">
          <div className="flex items-center gap-3 text-[10px] font-black tracking-widest uppercase"><ShieldCheck size={16} className="text-neo-neon"/> Secure_Encrypted</div>
          <div className="flex items-center gap-3 text-[10px] font-black tracking-widest uppercase"><Sparkles size={16} className="text-neo-pink"/> AI_Grounded</div>
          <div className="flex items-center gap-3 text-[10px] font-black tracking-widest uppercase"><Navigation size={16} className="text-neo-gold"/> RealTime_Mapping</div>
          <div className="text-[10px] font-black tracking-widest uppercase">© 2025 QUANTCASA LABS</div>
        </div>
      </footer>
    </div>
  );
};

export default App;
