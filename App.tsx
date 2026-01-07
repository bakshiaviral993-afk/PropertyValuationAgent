import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import ChatInterface from './components/ChatInterface';
import PropertyChat from './components/PropertyChat';
import BuyDashboard from './components/BuyDashboard';
import RentDashboard from './components/RentDashboard';
import LandReport from './components/LandReport';
import LoanCalculator from './components/LoanCalculator';
import ValuationCalculator from './components/ValuationCalculator';
import HarmonyDashboard from './components/HarmonyDashboard';
import DPDPModal from './components/DPDPModal';
import PrivacyPolicy from './components/PrivacyPolicy';
import Logo from './components/Logo';
import { AppMode, AppLang, BuyResult, RentResult, LandResult, BuyRequest, RentRequest, LandRequest } from './types';
import { getBuyAnalysis, getRentAnalysis, getLandValuationAnalysis, parsePrice } from './services/geminiService';
import { ArrowLeft, Zap, ShieldCheck, Sparkles, Binary, X, BarChart3, Navigation, MessageSquareText, Bell, Shield, Calculator } from 'lucide-react';

const App: React.FC = () => {
  const [stage, setStage] = useState<'onboarding' | 'chat' | 'results' | 'privacy'>('onboarding');
  const [mode, setMode] = useState<AppMode>('buy');
  const [lang, setLang] = useState<AppLang>('EN');
  const [isLoading, setIsLoading] = useState(false);
  const [showFinance, setShowFinance] = useState(false);
  const [showQuickCalc, setShowQuickCalc] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  
  const [buyData, setBuyData] = useState<BuyResult | null>(null);
  const [rentData, setRentData] = useState<RentResult | null>(null);
  const [landData, setLandData] = useState<LandResult | null>(null);

  useEffect(() => {
    const consent = localStorage.getItem('quantcasa_dpdp_consent');
    if (!consent) {
      setShowConsentModal(true);
    }
  }, []);

  const handleConsent = () => {
    localStorage.setItem('quantcasa_dpdp_consent', 'true');
    setShowConsentModal(false);
  };

  const getContextData = () => {
      if (mode === 'buy' && buyData) return { type: 'Sale', ...buyData };
      if (mode === 'rent' && rentData) return { type: 'Rental', ...rentData };
      if (mode === 'land' && landData) return { type: 'Land', ...landData };
      return null;
  };

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
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An unexpected error occurred in the valuation node. Please check your connection or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitialFinanceValue = (): number => {
    if (mode === 'buy' && buyData) return parsePrice(buyData.fairValue);
    if (mode === 'rent' && rentData) return parsePrice(rentData.rentalValue);
    if (mode === 'land' && landData) return parsePrice(landData.landValue);
    return 10000000;
  };

  if (stage === 'privacy') {
    return <PrivacyPolicy onBack={() => setStage('onboarding')} />;
  }

  if (stage === 'onboarding') {
    return (
      <>
        <Onboarding onComplete={startAnalysis} />
        {showConsentModal && <DPDPModal onAccept={handleConsent} onReadMore={() => setStage('privacy')} />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-neo-bg text-white flex flex-col font-sans selection:bg-neo-neon/40 overflow-x-hidden">
      <header className="px-6 md:px-10 py-6 border-b border-white/5 bg-neo-glass/60 backdrop-blur-2xl sticky top-0 z-[100] flex items-center justify-between">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => { setStage('onboarding'); setBuyData(null); setRentData(null); setLandData(null); setShowFinance(false); setShowQuickCalc(false); }}>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white shadow-neo-glow transition-all group-hover:rotate-12 group-hover:scale-110 group-hover:border-neo-neon/50">
            <Logo size={28} />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-black text-xl md:text-2xl text-white tracking-tighter leading-none neon-text-glow">QuantCasa</h1>
            <span className="text-[8px] font-black text-neo-neon uppercase tracking-[0.4em] opacity-80">INTELLIGENCE_LAYER_V5.2</span>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowQuickCalc(!showQuickCalc)}
            className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-neo-neon hover:bg-white/10 transition-all border border-white/10"
            title="Quick Calculator"
          >
            <Calculator size={20} />
          </button>
          <button 
            onClick={() => setShowAlerts(!showAlerts)}
            className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-neo-gold hover:bg-white/10 transition-all border border-white/10 relative"
          >
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-neo-pink rounded-full animate-pulse shadow-pink-glow" />
          </button>
          {stage === 'results' && (
             <button 
              onClick={() => { setMode('expert'); setStage('chat'); }} 
              className="h-10 px-6 rounded-2xl bg-neo-neon/10 text-neo-neon text-[10px] font-black hover:bg-neo-neon hover:text-white transition-all flex items-center gap-2 border border-neo-neon/20 uppercase tracking-widest shadow-neo-glow active:scale-95"
             >
                <MessageSquareText size={14} /> Expert Chat
             </button>
          )}
          <button onClick={() => setStage('onboarding')} className="h-10 px-6 rounded-2xl bg-white/5 text-[10px] font-black hover:bg-white/10 transition-all flex items-center gap-2 border border-white/5 uppercase tracking-widest shadow-glass-3d active:scale-95">
            <ArrowLeft size={14} /> Reset
          </button>
        </div>
      </header>

      {/* Harmony Alerts Portal */}
      {showAlerts && (
        <div className="fixed top-24 right-6 md:right-10 z-[200] w-full max-w-sm animate-in slide-in-from-top-10 duration-500">
          <div className="bg-neo-glass backdrop-blur-3xl border border-neo-gold/30 rounded-[32px] p-6 shadow-neo-glow">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xs font-black text-neo-gold uppercase tracking-widest">Auspicious Alerts</h4>
              <button onClick={() => setShowAlerts(false)} className="text-gray-500 hover:text-white"><X size={16}/></button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-neo-neon/10 border border-neo-neon/20 rounded-2xl">
                <p className="text-[10px] text-neo-neon font-black uppercase mb-1">Today's Pulse</p>
                <p className="text-xs text-gray-300">Swati Nakshatra detected. Ideal for property site visits before 2 PM.</p>
              </div>
              <div className="p-4 bg-neo-gold/10 border border-neo-gold/20 rounded-2xl">
                <p className="text-[10px] text-neo-gold font-black uppercase mb-1">Market Alert</p>
                <p className="text-xs text-gray-300">Mumbai residential index projected to rise 2.5% this quarter.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Calculator Modal */}
      {showQuickCalc && (
        <div className="fixed inset-0 z-[300] bg-neo-bg/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className="w-full max-w-2xl relative">
            <ValuationCalculator onClose={() => setShowQuickCalc(false)} />
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-10 flex flex-col lg:flex-row gap-10">
        <div className={`transition-all duration-1000 w-full lg:w-[440px] shrink-0 ${stage === 'results' ? 'hidden lg:block opacity-20 pointer-events-none grayscale' : 'mx-auto'}`}>
          {mode === 'expert' ? (
              <PropertyChat lang={lang} contextResult={getContextData()} />
          ) : (
              <ChatInterface mode={mode} lang={lang} onComplete={handleComplete} isLoading={isLoading} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {stage === 'results' ? (
            <div className="h-full relative animate-in fade-in slide-in-from-right-10 duration-700">
              {buyData && <BuyDashboard result={buyData} lang={lang} onAnalyzeFinance={() => setShowFinance(true)} />}
              {rentData && <RentDashboard result={rentData} lang={lang} onAnalyzeFinance={() => setShowFinance(true)} />}
              {landData && <LandReport result={landData} lang={lang} onAnalyzeFinance={() => setShowFinance(true)} />}

              {showFinance && (
                <div className="fixed inset-0 z-[200] bg-neo-bg/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
                  <div className="w-full max-w-5xl max-h-[90vh] bg-neo-bg border border-white/10 rounded-[64px] p-10 md:p-16 overflow-y-auto relative shadow-neo-glow border-t-white/20">
                    <button onClick={() => setShowFinance(false)} className="absolute top-10 right-10 p-4 bg-white/5 rounded-2xl hover:bg-neo-pink hover:text-white transition-all text-gray-500 shadow-glass-3d active:scale-90"><X size={24}/></button>
                    <div className="mb-12">
                      <div className="flex items-center gap-4 mb-3">
                          <BarChart3 className={mode === 'rent' ? 'text-emerald-500' : mode === 'land' ? 'text-orange-500' : 'text-neo-neon'} size={32} />
                          <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Fiscal Simulator</h2>
                      </div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em] font-black pl-12 opacity-60">{mode.toUpperCase()} _ ASSET _ FEASIBILITY _ ENGINE</p>
                    </div>
                    <LoanCalculator initialValue={getInitialFinanceValue()} mode={mode} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden lg:flex h-full flex-col items-center justify-center text-center p-12 opacity-30">
              <div className="relative mb-12">
                <Logo size={120} className="animate-pulse" />
                <div className="absolute inset-0 bg-neo-neon blur-[100px] opacity-20" />
              </div>
              <h2 className="text-5xl font-black text-white tracking-tighter uppercase mb-6 leading-none">Awaiting Signal...</h2>
              <p className="text-base text-gray-500 max-w-lg leading-relaxed font-medium uppercase tracking-widest">Grounding neural nodes for regional analysis.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="p-10 text-center border-t border-white/5 bg-neo-glass/20 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-center gap-10 opacity-40 mb-4">
          <div className="flex items-center gap-3 text-[10px] font-black tracking-widest uppercase"><ShieldCheck size={16} className="text-neo-neon"/> Secure_Encrypted</div>
          <div className="flex items-center gap-3 text-[10px] font-black tracking-widest uppercase"><Sparkles size={16} className="text-neo-pink"/> AI_Grounded</div>
          <div className="flex items-center gap-3 text-[10px] font-black tracking-widest uppercase"><Navigation size={16} className="text-neo-gold"/> RealTime_Mapping</div>
          <button onClick={() => setStage('privacy')} className="flex items-center gap-3 text-[10px] font-black tracking-widest uppercase hover:text-white transition-colors"><Shield size={16} className="text-neo-neon"/> Privacy_Policy</button>
        </div>
        <div className="text-[10px] font-black tracking-widest uppercase opacity-30">© 2025 QUANTCASA LABS</div>
      </footer>
      {showConsentModal && <DPDPModal onAccept={handleConsent} onReadMore={() => setStage('privacy')} />}
    </div>
  );
};

export default App;