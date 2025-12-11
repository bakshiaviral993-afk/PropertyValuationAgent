import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import ValuationReport from './components/ValuationReport';
import { ValuationRequest, ValuationResult } from './types';
import { getValuationAnalysis } from './services/geminiService';
import { Home, ArrowLeft, BarChart2, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [valuationData, setValuationData] = useState<ValuationResult | null>(null);
  const [requestData, setRequestData] = useState<ValuationRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Add a session key to force re-mounting of ChatInterface on reset
  const [sessionKey, setSessionKey] = useState(0);

  const handleValuationRequest = async (data: ValuationRequest) => {
    setIsLoading(true);
    setError(null);
    setRequestData(data);
    try {
      const result = await getValuationAnalysis(data);
      setValuationData(result);
    } catch (err) {
      console.error(err);
      setError("Analysis interrupted. Network anomaly detected.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetApp = () => {
    setValuationData(null);
    setRequestData(null);
    setError(null);
    // Increment session key to completely reset ChatInterface state (messages, wizard step)
    setSessionKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-cyber-black text-cyber-text overflow-hidden relative selection:bg-cyber-teal selection:text-cyber-black">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-cyber-teal/5 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyber-teal/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Brand Header */}
      <header className="px-6 py-4 flex items-center justify-between z-30 border-b border-cyber-border bg-cyber-black/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="bg-cyber-teal/10 p-2 rounded-xl border border-cyber-teal/20 backdrop-blur-sm shadow-neon-teal">
              <Zap size={20} className="text-cyber-teal" />
          </div>
          <span className="font-bold text-xl tracking-wider font-mono text-white">QUANT<span className="text-cyber-teal">CASA</span></span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-cyber-card border border-cyber-border text-xs font-mono text-cyber-lime">
            <span className="w-2 h-2 rounded-full bg-cyber-lime animate-pulse"></span>
            SYSTEM ONLINE
          </div>
          {valuationData && (
              <button 
                  onClick={resetApp}
                  className="flex items-center text-sm font-medium text-cyber-text hover:text-cyber-teal transition-colors"
              >
                  <ArrowLeft size={16} className="mr-1" />
                  NEW SEARCH
              </button>
          )}
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 flex flex-col md:flex-row gap-6 p-6 h-[calc(100vh-80px)] overflow-hidden relative">
        
        {/* Loading Overlay */}
        {isLoading && (
            <div className="absolute inset-0 z-50 bg-cyber-black/90 backdrop-blur-md flex flex-col items-center justify-center">
                 <div className="relative">
                   <div className="w-24 h-24 border-t-4 border-l-4 border-cyber-teal rounded-full animate-spin"></div>
                   <div className="absolute inset-0 border-r-4 border-b-4 border-cyber-lime rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                 </div>
                 <p className="mt-8 text-cyber-teal font-mono tracking-widest text-lg animate-pulse">COMPUTING VALUATION MODEL...</p>
                 <p className="text-xs text-cyber-text font-mono mt-2">ANALYZING 50+ DATA POINTS</p>
            </div>
        )}

        {/* Left Panel: Chat / Input */}
        <div className={`transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex-shrink-0 flex flex-col ${valuationData ? 'w-full md:w-[380px]' : 'w-full md:w-[600px] md:mx-auto'}`}>
             {/* Key ensures complete reset of internal state on new search */}
             <ChatInterface key={sessionKey} onComplete={handleValuationRequest} isLoading={isLoading} />
             {error && (
                 <div className="mt-4 p-4 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 text-sm font-mono text-center shadow-lg">
                     ⚠ {error}
                 </div>
             )}
        </div>

        {/* Center & Right Panels: Result Dashboard */}
        {valuationData && requestData && (
            <div className="flex-1 min-h-0 animate-[fadeInUp_0.8s_cubic-bezier(0.23,1,0.32,1)]">
                <ValuationReport result={valuationData} request={requestData} />
            </div>
        )}

      </main>

      <style>{`
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default App;