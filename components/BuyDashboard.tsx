import React, { useState, useEffect } from 'react';
import { BuyResult, AppLang } from '../types';
import { Home, TrendingUp, Map as MapIcon, LayoutGrid, ShoppingBag, AlertCircle } from 'lucide-react';
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
  if (!result || typeof result !== 'object') {
    return <div className="text-center text-gray-400 py-20">No data available</div>;
  }

  const comparables = Array.isArray(result?.comparables)
    ? result.comparables
    : [];

  const [viewMode, setViewMode] =
    useState<'dashboard' | 'map' | 'essentials'>('dashboard');

  const [essentialNodes] = useState<any[]>([]);

  useEffect(() => {
    if (!result.fairValue) return;
    speak(
      lang === 'HI'
        ? `संपत्ति का उचित मूल्य ${result.fairValue} है।`
        : `The fair market value is ${result.fairValue}.`,
      lang === 'HI' ? 'hi-IN' : 'en-IN'
    );
  }, [result.fairValue, lang]);

  const propertyNodes = comparables.map((comp, i) => ({
    title: comp?.title ?? 'Unknown',
    price: comp?.price ?? 'N/A',
    address: comp?.address ?? '',
    lat: comp?.latitude,
    lng: comp?.longitude,
    isSubject: i === 0,
  }));

  const allMapNodes = [...propertyNodes, ...essentialNodes];

  return (
    <div className="h-full flex flex-col gap-8 pb-20">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Home />
          <div>
            <h2 className="text-xl font-bold text-white">Property Analysis</h2>
            <p className="text-xs text-gray-400">{area}, {city}</p>
          </div>
        </div>

        <div className="flex gap-1">
          <button onClick={() => setViewMode('dashboard')}><LayoutGrid size={14} /></button>
          <button onClick={() => setViewMode('map')}><MapIcon size={14} /></button>
          <button onClick={() => setViewMode('essentials')}><ShoppingBag size={14} /></button>
        </div>
      </div>

      {viewMode === 'dashboard' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <span>Fair Value</span>
              <div>{result.fairValue}</div>
              {onAnalyzeFinance && (
                <button onClick={onAnalyzeFinance}>
                  <TrendingUp size={12} /> Finance
                </button>
              )}
            </div>

            <div>
              <span>Appreciation</span>
              <div>{result.appreciationRate}</div>
            </div>

            <div>
              <span>Market Score</span>
              <div>{result.confidenceScore}/100</div>
            </div>
          </div>

          {userBudget && (
            <div>
              <AlertCircle size={16} />
              Budget: ₹{(userBudget / 1e7).toFixed(2)} Cr
            </div>
          )}

          <div>
            <p>"{result.valuationJustification}"</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {comparables.length > 0 ? (
              comparables.map((comp, idx) => (
                <div key={idx}>
                  <h4>{comp.title}</h4>
                  <p>{comp.address}</p>
                  <strong>{comp.price}</strong>
                </div>
              ))
            ) : (
              <div className="text-gray-400">No comparable properties found</div>
            )}
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
          autoFetchCategories={['Grocery Store', 'Chemist/Ph]()
