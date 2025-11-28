import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import ValuationReport from './components/ValuationReport';
import { ValuationRequest, ValuationResult } from './types';
import { getValuationAnalysis } from './services/geminiService';
import { Building2, ArrowLeft } from 'lucide-react';

const App: React.FC = () => {
  const [valuationData, setValuationData] = useState<ValuationResult | null>(null);
  const [requestData, setRequestData] = useState<ValuationRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-600">
            <div className="bg-brand-50 p-2 rounded-lg">
                <Building2 size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">Aviral<span className="text-brand-600">ProValuate</span></span>
          </div>
          {valuationData && (
              <button 
                onClick={resetApp}
                className="flex items-center text-sm font-medium text-gray-500 hover:text-brand-600 transition-colors"
              >
                  <ArrowLeft size={16} className="mr-1" />
                  New Valuation
              </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col md:flex-row gap-6">
        
        {/* Left Column: Chat/Input */}
        <div className={`transition-all duration-500 ease-in-out w-full ${valuationData ? 'md:w-1/3 h-[500px] md:h-[800px]' : 'md:w-1/2 md:mx-auto h-[600px] md:h-[700px]'}`}>
             <ChatInterface onComplete={handleValuationRequest} isLoading={isLoading} />
             {error && (
                 <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm text-center">
                     {error}
                 </div>
             )}
        </div>

        {/* Right Column: Results */}
        {valuationData && requestData && (
            <div className="w-full md:w-2/3 h-[800px] animate-fade-in-up">
                <ValuationReport result={valuationData} request={requestData} />
            </div>
        )}

      </main>

      {/* Simple Footer */}
      <footer className="py-6 text-center text-gray-400 text-sm">
        <p>&copy; 2024 Aviral ProValuate. Powered by Gemini AI.</p>
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