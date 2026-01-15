import React, { useState, useEffect } from 'react';
import { BuyResult, AppLang } from '../types';
import { Home, TrendingUp, MapPin, Map as MapIcon, LayoutGrid, ShoppingBag, AlertCircle } from 'lucide-react';
import GoogleMapView from './GoogleMapView';
import EssentialsDashboard from './EssentialsDashboard';
import { speak } from '../services/voiceService';

interface BuyDashboardProps {
  result: BuyResult;
  lang?: AppLang;
  userBudget?: number;
  onAnalyzeFinance?: () => void;
  city: string;
  area: string;
}

const BuyDashboard: React.FC<BuyDashboardProps> = ({ 
  result, 
  lang = 'EN', 
  userBudget, 
  onAnalyzeFinance,
  city,
  area
}) => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'map' | 'essentials'>('dashboard');
  const [essentialNodes, setEssentialNodes] = useState<any[]>([]);
  
  // Auto-fetch essential categories
  const autoFetchCategories = ['Grocery Store', 'Chemist/Pharmacy', 'Hospital/Clinic'];

  useEffect(() => {
    const speechText = lang === 'HI' 
      ? `संपत्ति का उचित मूल्य ${result.fairValue} है।` 
      : `The fair market value is ${result.fairValue}.`;
    speak(speechText, lang === 'HI' ? 'hi-IN' : 'en-IN');
  }, [result.fairValue, lang]);

  // Prepare property nodes for map
  const propertyNodes = result.comparables.map((comp, i) => ({
    title: comp.title,
    price: comp.price,
    address: comp.address,
    lat: comp.latitude,
    lng: comp.longitude,
    isSubject: i === 0
  }));

  // Combine property and essential nodes for map view
  const allMapNodes = [...propertyNodes, ...essentialNodes];

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-right-8 duration-1000 pb-20">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-neo-neon/10 rounded-2xl text-neo-neon shadow-neo-glow">
            <Home size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
              Property Analysis
            </h2>
            <p className="text-[10px] text-gray-500 uppercase font-black opacity-60 tracking-widest">
              {area}, {city}
            </p>
          </div>
        </div>

        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 gap-1">
          <button
            onClick={() => setViewMode('dashboard')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'dashboard' ? 'bg-neo-neon text-white shadow-neo-glow' : 'text-gray-400'
            }`}
          >
            <LayoutGrid size={12} className="inline mr-2" />
            Dashboard
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'map' ? 'bg-neo-neon text-white shadow-neo-glow' : 'text-gray-400'
            }`}
          >
            <MapIcon size={12} className="inline mr-2" />
            Map View
          </button>
          <button
            onClick={() => setViewMode('essentials')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'essentials' ? 'bg-neo-gold text-white shadow-neo-glow' : 'text-gray-400'
            }`}
          >
            <ShoppingBag size={12} className="inline mr-2" />
            Essentials
          </button>
        </div>
      </div>

      {viewMode === 'dashboard' && (
        <>
          {/* Existing Buy Dashboard Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 border-t-2 border-t-neo-neon shadow-glass-3d">
              <span className="text-[10px] font-black text-neo-neon uppercase block mb-1">Fair Value</span>
              <div className="text-4xl font-black text-white tracking-tighter">{result.fairValue}</div>
              {onAnalyzeFinance && (
                <button
                  onClick={onAnalyzeFinance}
                  className="mt-6 w-full px-4 py-2 rounded-xl bg-neo-neon/10 border border-neo-neon/30 text-neo-neon text-[10px] font-black uppercase tracking-widest hover:bg-neo-neon hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <TrendingUp size={12} /> Fiscal Simulator
                </button>
              )}
            </div>

            <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 border-t-2 border-t-emerald-500 shadow-glass-3d">
              <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">Appreciation</span>
              <div className="text-4xl font-black text-emerald-500 tracking-tighter">
                {result.appreciationRate}
              </div>
            </div>

            <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 border-t-2 border-t-neo-gold shadow-glass-3d">
              <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">Market Score</span>
              <div className="text-4xl font-black text-white tracking-tighter">
                {result.confidenceScore}/100
              </div>
            </div>
          </div>

          {userBudget && (
            <div className="bg-gradient-to-r from-neo-pink/10 to-neo-neon/10 border border-neo-pink/20 rounded-[32px] p-6 flex items-center gap-4">
              <AlertCircle size={24} className="text-neo-pink shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-black text-white uppercase mb-1">Budget Analysis</h4>
                <p className="text-xs text-gray-400">
                  Your budget: ₹{(userBudget / 10000000).toFixed(2)} Cr • 
                  Fair value: {result.fairValue} • 
                  {/* Add budget comparison logic */}
                </p>
              </div>
            </div>
          )}

          <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 border-l-4 border-l-neo-neon">
            <h3 className="text-xs font-black text-white mb-4 uppercase tracking-widest">
              Market Intelligence
            </h3>
            <p className="text-gray-300 leading-relaxed italic text-sm">
              "{result.valuationJustification}"
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {result.comparables.map((comp, idx) => (
              <div
                key={idx}
                className="bg-white/5 border border-white/10 rounded-[32px] p-8 shadow-glass-3d hover:border-neo-neon/40 transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="font-black text-white text-lg uppercase leading-tight">
                      {comp.title}
                    </h4>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">
                      {comp.address}
                    </p>
                  </div>
                  <div className="text-xl font-black text-white">{comp.price}</div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    {comp.sqft || 'N/A'} SQFT
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    {comp.bedrooms || 'N/A'} BHK
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    {comp.age || 'N/A'}
                  </div>
                </div>

                <a
                  href={comp.sourceUrl}
                  target="_blank"
                  rel="noopener"
                  className="w-full py-4 rounded-2xl bg-neo-neon text-white text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-neo-glow transition-all active:scale-95"
                >
                  Verify Listing
                </a>
              </div>
            ))}
          </div>
        </>
      )}

      {viewMode === 'map' && (
        <GoogleMapView 
          nodes={allMapNodes} 
          showEssentials={essentialNodes.length > 0}
        />
      )}

      {viewMode === 'essentials' && (
        <EssentialsDashboard
          city={city}
          area={area}
          autoFetchCategories={autoFetchCategories}
          propertyNodes={propertyNodes}
        />
      )}
    </div>
  );
};

export default BuyDashboard;
