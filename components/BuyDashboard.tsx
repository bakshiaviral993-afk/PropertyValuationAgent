import React, { useState, useEffect } from 'react';
import { BuyResult, AppLang } from '../types';
import {
  Home,
  TrendingUp,
  Map as MapIcon,
  LayoutGrid,
  ShoppingBag,
  AlertCircle,
} from 'lucide-react';
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
  area,
}) => {
  /* ---------- HARD GUARD ---------- */
  if (!result || typeof result !== 'object') {
    return (
      <div className="text-center text-gray-400 py-20">
        Unable to load property analysis
      </div>
    );
  }

  /* ---------- SAFE DATA ---------- */
  const comparables = Array.isArray(result?.comparables)
    ? result.comparables
    : [];

  const [viewMode, setViewMode] =
    useState<'dashboard' | 'map' | 'essentials'>('dashboard');

  const [essentialNodes] = useState<any[]>([]);

  /* ---------- VOICE ---------- */
  useEffect(() => {
    if (!result.fairValue) return;

    speak(
      lang === 'HI'
        ? `संपत्ति का उचित मूल्य ${result.fairValue} है।`
        : `The fair market value is ${result.fairValue}.`,
      lang === 'HI' ? 'hi-IN' : 'en-IN'
    );
  }, [result.fairValue, lang]);

  /* ---------- MAP NODES ---------- */
  const propertyNodes = comparables.map((comp, i) => ({
    title: comp?.title ?? 'Unknown',
    price: comp?.price ?? 'N/A',
    address: comp?.address ?? '',
    lat: comp?.latitude,
    lng: comp?.longitude,
    isSubject: i === 0,
  }));

  const allMapNodes = [...propertyNodes, ...essentialNodes];

  /* ---------- UI ---------- */
  return (
    <div className="h-full flex flex-col gap-8 pb-20 animate-in fade-in slide-in-from-right-8 duration-700">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/5 rounded-2xl">
            <Home size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase">
              Property Analysis
            </h2>
            <p className="text-[10px] text-gray-500 uppercase font-black">
              {area}, {city}
            </p>
          </div>
        </div>

        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 gap-1">
          <button
            onClick={() => setViewMode('dashboard')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${
              viewMode === 'dashboard'
                ? 'bg-white text-black'
                : 'text-gray-400'
            }`}
          >
            <LayoutGrid size={12} className="inline mr-2" />
            Dashboard
          </button>

          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${
              viewMode === 'map'
                ? 'bg-white text-black'
                : 'text-gray-400'
            }`}
          >
            <MapIcon size={12} className="inline mr-2" />
            Map
          </button>

          <button
            onClick={() => setViewMode('essentials')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${
              viewMode === 'essentials'
                ? 'bg-white text-black'
                : 'text-gray-400'
            }`}
          >
            <ShoppingBag size={12} className="inline mr-2" />
            Essentials
          </button>
        </div>
      </div>

      {/* Dashboard View */}
      {viewMode === 'dashboard' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 p-6 rounded-2xl">
              <span className="text-[10px] uppercase text-gray-400 font-black">
                Fair Value
              </span>
              <div className="text-3xl font-black text-white">
                {result.fairValue}
              </div>

              {onAnalyzeFinance && (
                <button
                  onClick={onAnalyzeFinance}
                  className="mt-4 w-full py-2 rounded-xl bg-white text-black text-[10px] font-black uppercase"
                >
                  <TrendingUp size={12} className="inline mr-2" />
                  Finance
                </button>
              )}
            </div>

            <div className="bg-white/5 p-6 rounded-2xl">
              <span className="text-[10px] uppercase text-gray-400 font-black">
                Appreciation
              </span>
              <div className="text-3xl font-black text-white">
                {result.appreciationRate}
              </div>
            </div>

            <div className="bg-white/5 p-6 rounded-2xl">
              <span className="text-[10px] uppercase text-gray-400 font-black">
                Market Score
              </span>
              <div className="text-3xl font-black text-white">
                {result.confidenceScore}/100
              </div>
            </div>
          </div>

          {userBudget && (
            <div className="bg-white/5 p-5 rounded-2xl flex gap-3 items-center">
              <AlertCircle size={18} className="text-white" />
              <p className="text-xs text-gray-300">
                Budget: ₹{(userBudget / 1e7).toFixed(2)} Cr
              </p>
            </div>
          )}

          <div className="bg-white/5 p-6 rounded-2xl italic text-gray-300">
            “{result.valuationJustification}”
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comparables.length > 0 ? (
              comparables.map((comp, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 p-6 rounded-2xl"
                >
                  <h4 className="font-black text-white">
                    {comp.title}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {comp.address}
                  </p>
                  <div className="mt-2 font-black text-white">
                    {comp.price}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500">
                No comparable properties available
              </div>
            )}
          </div>
        </>
      )}

      {/* Map View */}
      {viewMode === 'map' && (
        <GoogleMapView
          nodes={allMapNodes}
          showEssentials={essentialNodes.length > 0}
        />
      )}

      {/* Essentials View */}
      {viewMode === 'essentials' && (
        <EssentialsDashboard
          city={city}
          area={area}
          autoFetchCategories={[
            'Grocery Store',
            'Chemist/Pharmacy',
            'Hospital/Clinic',
          ]}
          propertyNodes={propertyNodes}
        />
      )}
    </div>
  );
};

export default BuyDashboard;
