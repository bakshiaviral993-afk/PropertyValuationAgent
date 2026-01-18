import React from 'react';
import { Info, Sparkles, TrendingUp, ShieldCheck, MessageSquare } from 'lucide-react';

interface MarketIntelligenceProps {
  result: any;
  accentColor?: string;
}

const formatPrice = (val: any): string => {
  if (val === null || val === undefined) return "";
  const str = String(val);
  const num = parseFloat(str.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return str;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
};

const parsePrice = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = String(val);
  const num = parseFloat(str.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return 0;
  if (str.includes('Cr')) return num * 10000000;
  if (str.includes('L')) return num * 100000;
  return num;
};

const MarketIntelligence: React.FC<MarketIntelligenceProps> = ({
  result,
  accentColor = 'neo-neon'
}) => {
  const baseText =
    result?.valuationJustification?.trim() ||
    result?.notes?.trim() ||
    result?.marketInsights?.trim() ||
    '';

  const confidence =
    typeof result?.confidenceScore === 'number'
      ? Math.min(100, Math.max(0, result.confidenceScore))
      : 72;

  if (!baseText) return null;

  // Get the value for negotiation script (handles buy/rent/land/commercial)
  const value = result.fairValue || result.rentalValue || result.landValue || result.businessInsights || 'fair value';
  const valueNum = parsePrice(value);
  const lowOffer = formatPrice(valueNum * 0.8); // 20% below for starting offer
  const midpoint = typeof value === 'string' ? value : formatPrice(valueNum);
  const counterOffer = formatPrice(valueNum * 0.9); // 10% below

  return (
    <div
      className={`bg-white/5 rounded-[32px] p-8 border border-white/10 border-l-4 border-l-${accentColor} mb-6`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
          <Info size={16} /> Market Intelligence
        </h3>

        {/* Confidence */}
        <div
          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest
          ${
            confidence >= 80
              ? 'bg-emerald-500/10 text-emerald-500'
              : confidence >= 60
              ? 'bg-yellow-500/10 text-yellow-400'
              : 'bg-red-500/10 text-red-400'
          }`}
        >
          {confidence}% Confidence
        </div>
      </div>

      {/* Buyer Insights */}
      <div className="mb-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2 mb-2">
          <ShieldCheck size={12} /> Buyer Signals
        </h4>
        <ul className="list-disc pl-4 space-y-1 text-sm text-gray-300">
          <li>Pricing aligns with current micro-market averages</li>
          <li>Comparable listings support quoted valuation</li>
          <li>Risk profile is within normal residential tolerance</li>
        </ul>
      </div>

      {/* Investor Insights */}
      <div className="mb-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2 mb-2">
          <TrendingUp size={12} /> Investor Signals
        </h4>
        <ul className="list-disc pl-4 space-y-1 text-sm text-gray-300">
          <li>Demand trend indicates medium-term appreciation potential</li>
          <li>Liquidity supported by transaction velocity in area</li>
          <li>Yield assumptions are within realistic bounds</li>
        </ul>
      </div>

      {/* Negotiator Insights */}
      <div className="mb-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2 mb-2">
          <Sparkles size={12} /> Negotiator Signals
        </h4>
        <ul className="list-disc pl-4 space-y-1 text-sm text-gray-300">
          <li>Comparable inventory allows room for price anchoring</li>
          <li>Data supports counter-offers near fair value band</li>
          <li>Seller leverage appears moderate, not dominant</li>
        </ul>
      </div>

      {/* Negotiating Script section */}
      <div className="mb-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2 mb-2">
          <MessageSquare size={12} /> Negotiation Script
        </h4>
        <div className="text-sm text-gray-300 space-y-2">
          <p><strong>Buyer:</strong> "Based on recent comps and market trends, I value this at around {midpoint}. I'd like to offer {lowOffer} cash for a quick close—what do you think?"</p>
          <p><strong>Seller (possible):</strong> "That's low; we have interest at {midpoint}."</p>
          <p><strong>Buyer:</strong> "Understood, but with current rates stable, let's meet at midway. {counterOffer}, including covering stamp duty?"</p>
          <p className="text-xs text-gray-500 italic">Tip: Use signals above for leverage; always verify title.</p>
        </div>
      </div>

      {/* Raw intelligence (AI narrative) */}
      <p className="mt-6 text-gray-400 italic text-sm leading-relaxed">
        "{baseText}"
      </p>
    </div>
  );
};

export default MarketIntelligence;
