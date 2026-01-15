import React, { useState } from 'react';

// ---- Dummy imports (adjust paths if needed) ----
import EssentialsDashboard from './components/EssentialsDashboard';
import BuyDashboard from './components/BuyDashboard';
import RentDashboard from './components/RentDashboard';
import LandReport from './components/LandReport';
import CommercialDashboard from './components/CommercialDashboard';

// -----------------------------------------------

type Stage = 'input' | 'results';
type Mode = 'essentials' | 'buy' | 'rent' | 'land' | 'commercial';

const App: React.FC = () => {
  const [stage] = useState<Stage>('results');
  const [mode] = useState<Mode>('buy');
  const [lang] = useState<'en' | 'hi'>('en');

  const [showFinance, setShowFinance] = useState(false);
  const [financeTab, setFinanceTab] = useState<'calc' | 'summary'>('calc');

  const [userBudget] = useState<number>(5000000);

  const locationContext = {
    city: 'Mumbai',
    area: 'Andheri',
    pincode: '400053',
  };

  const buyData = {};
  const rentData = null;
  const landData = null;
  const commercialData = null;

  const commercialMeta = {
    type: 'office',
    sqft: 1200,
  };

  return (
    <div className="h-screen w-full">
      {stage === 'results' ? (
        <div className="h-full relative animate-in fade-in slide-in-from-right-10 duration-700">

          {mode === 'essentials' && (
            <EssentialsDashboard
              city={locationContext.city}
              area={locationContext.area}
            />
          )}

          {buyData && mode === 'buy' && (
            <BuyDashboard
              result={buyData}
              lang={lang}
              userBudget={userBudget}
              onAnalyzeFinance={() => {
                setFinanceTab('calc');
                setShowFinance(true);
              }}
              city={locationContext.city}
              area={locationContext.area}
            />
          )}

          {rentData && mode === 'rent' && (
            <RentDashboard
              result={rentData}
              lang={lang}
              userBudget={userBudget}
              onAnalyzeFinance={() => {
                setFinanceTab('calc');
                setShowFinance(true);
              }}
              city={locationContext.city}
              area={locationContext.area}
            />
          )}

          {landData && mode === 'land' && (
            <LandReport
              result={landData}
              lang={lang}
              onAnalyzeFinance={() => {
                setFinanceTab('calc');
                setShowFinance(true);
              }}
              city={locationContext.city}
              area={locationContext.area}
            />
          )}

          {commercialData && mode === 'commercial' && (
            <CommercialDashboard
              result={commercialData}
              lang={lang}
              onAnalyzeFinance={() => {
                setFinanceTab('calc');
                setShowFinance(true);
              }}
              city={locationContext.city}
              area={locationContext.area}
              pincode={locationContext.pincode}
              initialType={commercialMeta.type}
              initialSqft={commercialMeta.sqft}
            />
          )}

          {showFinance && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-[400px]">
                <h2 className="text-lg font-semibold mb-4">
                  Finance Calculator
                </h2>

                <p className="text-sm text-gray-600 mb-4">
                  Active tab: {financeTab}
                </p>

                <button
                  className="px-4 py-2 bg-black text-white rounded"
                  onClick={() => setShowFinance(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-500">
          Waiting for input…
        </div>
      )}
    </div>
  );
};

export default App;
