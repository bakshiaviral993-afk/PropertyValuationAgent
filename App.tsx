import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import ValuationReport from './components/ValuationReport';
import { ValuationRequest, ValuationResult } from './types';
import { getValuationAnalysis } from './services/geminiService';
import { Home, ArrowLeft, BarChart2, Moon, Sun } from 'lucide-react';

const App: React.FC = () => {
  const [valuationData, setValuationData] = useState<ValuationResult | null>(null);
  const [requestData, setRequestData] = useState<ValuationRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Dark Mode Toggle Logic
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleValuationRequest = async (data: ValuationRequest) => {
    setIsLoading(true);
    setError(null);
    setRequestData(data);
    try {
      const result = await getValuationAnalysis(data);
      setValuationData(result);
    } catch (err) {
      console.error(err);
      setError("We encountered an issue analyzing the property. Please check your internet connection or try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetApp = () => {
    setValuationData(null);
    setRequestData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 transition-colors duration-300">
      
      {/* Brand Header */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-30 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg border border-white/10 backdrop-blur-sm">
                <Home size={20} className="text-teal-500" />
            </div>
            <span className="font-bold text-xl tracking-tight font-sans">Quant<span className="text-teal-500">Casa</span></span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle */}
            <button 
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-teal-400 transition-all border border-transparent hover:border-white/10"
                aria-label="Toggle Dark Mode"
            >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {valuationData && (
                <button 
                    onClick={resetApp}
                    className="flex items-center text-sm font-medium text-gray-300 hover:text-teal-500 transition-colors"
                >
                    <ArrowLeft size={16} className="mr-1" />
                    New Estimate
                </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col md:flex-row gap-6 relative">
        
        {/* Loading Overlay */}
        {isLoading && (
            <div className="absolute inset-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
                 <div className="w-16 h-16 bg-slate-900 dark:bg-teal-500 mask-house animate-morph-house mb-4"></div>
                 <p className="text-slate-900 dark:text-white font-bold animate-pulse">Analyzing Data Points...</p>
            </div>
        )}

        {/* Left Column: Input / Chat Wizard */}
        <div className={`transition-all duration-500 ease-in-out w-full ${valuationData ? 'md:w-1/3 h-[500px] md:h-[800px]' : 'md:w-1/2 md:mx-auto h-[600px] md:h-[700px]'}`}>
             <ChatInterface onComplete={handleValuationRequest} isLoading={isLoading} />
             {error && (
                 <div className="mt-4 p-4 bg-coral-500/10 text-coral-500 rounded-xl border border-coral-500/20 text-sm text-center">
                     {error}
                 </div>
             )}
        </div>

        {/* Right Column: Valuation Result (The Money Screen) */}
        {valuationData && requestData && (
            <div className="w-full md:w-2/3 h-[800px] animate-fade-in-up">
                <ValuationReport result={valuationData} request={requestData} />
            </div>
        )}

      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-slate-400 text-sm bg-slate-50 dark:bg-black border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="flex items-center justify-center gap-2 mb-1">
          <BarChart2 size={14} className="text-teal-500"/>
          <span className="font-semibold text-slate-600 dark:text-slate-400">QuantCasa Analytics</span>
        </div>
        <p>&copy; 2024 QuantCasa. Powered by Gemini AI.</p>
      </footer>

      {/* Styles for animation */}
      <style>{`
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;