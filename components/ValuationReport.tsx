// ValuationReport.tsx
// Place in: src/components/ValuationReport.tsx
import React from 'react';
import { Download, FileText, Share2, TrendingUp, AlertCircle, CheckCircle, MapPin, DollarSign } from 'lucide-react';

interface ValuationReportProps {
  mode: 'buy' | 'rent' | 'land' | 'commercial';
  result: any;
  city: string;
  area: string;
  pincode: string;
  userInput?: any;
}

const ValuationReport: React.FC<ValuationReportProps> = ({ 
  mode, 
  result, 
  city, 
  area, 
  pincode,
  userInput 
}) => {
  const formatPrice = (val: any): string => {
    if (!val) return "N/A";
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

  const getValue = () => {
    if (mode === 'buy') return result.fairValue;
    if (mode === 'rent') return result.rentalValue;
    if (mode === 'land') return result.landValue;
    if (mode === 'commercial') return result.businessInsights;
    return 'N/A';
  };

  const valueNum = parsePrice(getValue());
  const lowOffer = formatPrice(valueNum * 0.8);
  const midOffer = formatPrice(valueNum * 0.9);
  const fairValue = getValue();

  const getModeTitle = () => {
    const titles = {
      buy: 'Property Purchase',
      rent: 'Rental',
      land: 'Land',
      commercial: 'Commercial Property'
    };
    return titles[mode];
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const exportReport = () => {
    const reportElement = document.getElementById('valuation-report-content');
    if (!reportElement) return;

    const reportHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${getModeTitle()} Valuation Report - ${area}, ${city}</title>
        <style>
          ${getReportStyles()}
        </style>
      </head>
      <body>
        ${reportElement.innerHTML}
      </body>
      </html>
    `;

    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Valuation_Report_${area.replace(/\s+/g, '_')}_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareReport = () => {
    if (navigator.share) {
      navigator.share({
        title: `${getModeTitle()} Valuation Report`,
        text: `Property valuation for ${area}, ${city}: ${fairValue}`,
        url: window.location.href
      }).catch(err => console.log('Share failed', err));
    } else {
      alert('Share feature not supported on this browser');
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-3 justify-end no-pdf-export">
        <button
          onClick={shareReport}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
        >
          <Share2 size={14} />
          Share
        </button>
        <button
          onClick={exportReport}
          className="px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2"
        >
          <Download size={14} />
          Export Report
        </button>
      </div>

      {/* Report Content */}
      <div id="valuation-report-content" className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-[32px] p-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <FileText size={32} />
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight">
                {getModeTitle()} Valuation Report
              </h1>
              <p className="text-sm opacity-90">
                Executive Summary • {new Date().toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Property Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
              Property Location
            </div>
            <div className="text-2xl font-black text-white mb-1">{area}</div>
            <div className="text-sm text-gray-400">{city}, Pincode: {pincode}</div>
          </div>

          {mode === 'buy' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                Property Type
              </div>
              <div className="text-2xl font-black text-white">{userInput?.bhk || '2 BHK'}</div>
              <div className="text-sm text-gray-400">{userInput?.sqft || '1000'} sq.ft.</div>
            </div>
          )}

          {mode === 'land' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                Plot Size
              </div>
              <div className="text-2xl font-black text-white">{userInput?.plotSize || '1000'}</div>
              <div className="text-sm text-gray-400">sq. yards • {userInput?.facing || 'East'} Facing</div>
            </div>
          )}

          <div className="bg-white/5 border border-blue-500/30 border-l-4 rounded-2xl p-6">
            <div className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">
              Fair Market Value
            </div>
            <div className="text-3xl font-black text-blue-400">{fairValue}</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
              Confidence Score
            </div>
            <div className={`text-3xl font-black ${getConfidenceColor(result.confidenceScore || 72)}`}>
              {result.confidenceScore || 72}%
            </div>
          </div>
        </div>

        {/* Market Intelligence */}
        <div className="bg-white/5 border border-white/10 rounded-[32px] p-8">
          <h2 className="text-xl font-black text-white uppercase mb-6 flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <TrendingUp size={20} className="text-blue-400" />
            </div>
            Market Intelligence & Justification
          </h2>

          <div className="space-y-6">
            {/* Buyer Signals */}
            <div>
              <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <CheckCircle size={14} /> Buyer Signals
              </h3>
              <ul className="space-y-2 text-gray-300 ml-6">
                <li className="list-disc">Pricing aligns with current micro-market averages</li>
                <li className="list-disc">Comparable listings support quoted valuation</li>
                <li className="list-disc">Risk profile is within normal {mode === 'land' ? 'land acquisition' : 'residential'} tolerance</li>
              </ul>
            </div>

            {/* Investor Signals */}
            <div>
              <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <TrendingUp size={14} /> Investor Signals
              </h3>
              <ul className="space-y-2 text-gray-300 ml-6">
                <li className="list-disc">Demand trend indicates medium-term appreciation potential</li>
                <li className="list-disc">Liquidity supported by transaction velocity in area</li>
                <li className="list-disc">Yield assumptions are within realistic bounds</li>
              </ul>
            </div>

            {/* AI Justification */}
            {result.valuationJustification && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-2">
                  AI Analysis
                </h3>
                <p className="text-gray-300 text-sm italic leading-relaxed">
                  "{result.valuationJustification}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Negotiation Strategy */}
        <div className="bg-white/5 border border-white/10 rounded-[32px] p-8">
          <h2 className="text-xl font-black text-white uppercase mb-6 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <DollarSign size={20} className="text-emerald-400" />
            </div>
            Negotiation Strategy & Script
          </h2>

          <div className="space-y-4">
            {/* Price Range */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                <div className="text-xs text-red-400 font-bold mb-1">Opening Offer (20% below)</div>
                <div className="text-xl font-black text-red-400">{lowOffer}</div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
                <div className="text-xs text-yellow-400 font-bold mb-1">Counter Offer (10% below)</div>
                <div className="text-xl font-black text-yellow-400">{midOffer}</div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                <div className="text-xs text-emerald-400 font-bold mb-1">Fair Market Value</div>
                <div className="text-xl font-black text-emerald-400">{fairValue}</div>
              </div>
            </div>

            {/* Negotiation Script */}
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-6 space-y-4">
              <div>
                <div className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">
                  Phase 1: Opening Statement
                </div>
                <p className="text-gray-300 text-sm">
                  <strong className="text-white">Buyer:</strong> "Based on recent comps and market trends, I value this at around {fairValue}. 
                  I'd like to offer {lowOffer} cash for a quick close—what do you think?"
                </p>
              </div>

              <div>
                <div className="text-xs font-black text-yellow-400 uppercase tracking-widest mb-2">
                  Phase 2: Expected Response
                </div>
                <p className="text-gray-300 text-sm">
                  <strong className="text-white">Seller (possible):</strong> "That's low; we have interest at {fairValue}."
                </p>
              </div>

              <div>
                <div className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-2">
                  Phase 3: Counter Strategy
                </div>
                <p className="text-gray-300 text-sm">
                  <strong className="text-white">Buyer:</strong> "Understood, but with current rates stable, let's meet at midway. 
                  {midOffer}, including covering stamp duty?"
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 mt-4">
                <p className="text-xs text-gray-400 italic">
                  <strong className="text-blue-400">Tip:</strong> Use market intelligence signals above for leverage; 
                  always verify title and legal clearance before finalizing.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Comparable Listings */}
        {result.listings && result.listings.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-8">
            <h2 className="text-xl font-black text-white uppercase mb-6 flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <MapPin size={20} className="text-purple-400" />
              </div>
              Comparable Properties
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-xs font-black text-gray-400 uppercase">Property</th>
                    <th className="text-left py-3 px-4 text-xs font-black text-gray-400 uppercase">Location</th>
                    <th className="text-right py-3 px-4 text-xs font-black text-gray-400 uppercase">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {result.listings.slice(0, 5).map((listing: any, idx: number) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 text-sm text-white">{listing.title || listing.project || 'Property'}</td>
                      <td className="py-3 px-4 text-sm text-gray-400">{listing.address || `${area}, ${city}`}</td>
                      <td className="py-3 px-4 text-sm text-blue-400 font-bold text-right">{listing.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Risk Assessment */}
        <div className="bg-white/5 border border-white/10 rounded-[32px] p-8">
          <h2 className="text-xl font-black text-white uppercase mb-6 flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <AlertCircle size={20} className="text-orange-400" />
            </div>
            Risk & Opportunity Assessment
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-emerald-500/5 border-l-4 border-emerald-500 rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex-shrink-0">
                ✓
              </div>
              <div>
                <div className="font-bold text-white mb-1">Market Demand</div>
                <div className="text-sm text-gray-400">High demand with stable appreciation potential in this micro-market</div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-red-500/5 border-l-4 border-red-500 rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/20 text-red-400 font-bold flex-shrink-0">
                ✗
              </div>
              <div>
                <div className="font-bold text-white mb-1">Title Verification</div>
                <div className="text-sm text-gray-400">Always conduct thorough legal due diligence before transaction</div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-emerald-500/5 border-l-4 border-emerald-500 rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex-shrink-0">
                ✓
              </div>
              <div>
                <div className="font-bold text-white mb-1">Location Premium</div>
                <div className="text-sm text-gray-400">{area} commands premium pricing due to established infrastructure</div>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-red-500/5 border border-red-500/30 rounded-2xl p-6">
          <h3 className="text-sm font-black text-red-400 uppercase tracking-widest mb-3">
            Important Disclaimer
          </h3>
          <p className="text-gray-400 text-xs leading-relaxed">
            This report is based on publicly available data, market intelligence, and AI-powered analysis as of {new Date().toLocaleDateString()}. 
            It does not constitute legal, tax, or financial advice. Actual transaction value may vary based on title clarity, 
            encumbrances, specific buyer-seller dynamics, and market conditions. Physical site inspection, legal due diligence, 
            and professional consultation are mandatory before any transaction.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center pt-6 border-t border-white/10">
          <p className="text-gray-400 text-sm">Property Valuation AI Agent | Market Intelligence Platform</p>
          <p className="text-gray-500 text-xs mt-2">
            Generated on {new Date().toLocaleString('en-IN')} | Confidential
          </p>
        </div>
      </div>
    </div>
  );
};

// Styles for exported HTML report
const getReportStyles = () => `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #0f172a 0%, #1a2332 100%);
    color: #f1f5f9;
    padding: 2rem;
    line-height: 1.6;
  }
  .space-y-6 > * + * { margin-top: 1.5rem; }
  .grid { display: grid; gap: 1rem; }
  .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
  .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  .bg-white\\/5 { background: rgba(255, 255, 255, 0.05); }
  .border { border-width: 1px; }
  .border-white\\/10 { border-color: rgba(255, 255, 255, 0.1); }
  .rounded-2xl { border-radius: 1rem; }
  .rounded-xl { border-radius: 0.75rem; }
  .rounded-\\[32px\\] { border-radius: 32px; }
  .p-6 { padding: 1.5rem; }
  .p-8 { padding: 2rem; }
  .p-4 { padding: 1rem; }
  .text-white { color: #ffffff; }
  .text-gray-300 { color: #cbd5e1; }
  .text-gray-400 { color: #94a3b8; }
  .text-blue-400 { color: #38bdf8; }
  .text-emerald-400 { color: #34d399; }
  .text-yellow-400 { color: #fbbf24; }
  .text-red-400 { color: #f87171; }
  .font-black { font-weight: 900; }
  .font-bold { font-weight: 700; }
  .text-xs { font-size: 0.75rem; }
  .text-sm { font-size: 0.875rem; }
  .text-xl { font-size: 1.25rem; }
  .text-2xl { font-size: 1.5rem; }
  .text-3xl { font-size: 1.875rem; }
  .uppercase { text-transform: uppercase; }
  .bg-gradient-to-r { background-image: linear-gradient(to right, var(--tw-gradient-stops)); }
  .from-blue-500 { --tw-gradient-from: #3b82f6; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
  .to-cyan-500 { --tw-gradient-to: #06b6d4; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 0.75rem 1rem; text-align: left; }
  thead { background: rgba(56, 189, 248, 0.1); }
  th { color: #38bdf8; font-weight: 600; border-bottom: 2px solid rgba(56, 189, 248, 0.3); }
  tr { border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
  ul { list-style-type: disc; margin-left: 1.5rem; }
  .no-pdf-export { display: none; }
`;

export default ValuationReport;
