
import React from 'react';
import { LandResult } from '../types';
import { Map, Zap, Layers, Globe, MessageSquare, ExternalLink, Info, Database } from 'lucide-react';

interface LandReportProps {
  result: LandResult;
}

const LandReport: React.FC<LandReportProps> = ({ result }) => {
  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-right-8 duration-1000 overflow-y-auto pr-2 pb-10 scrollbar-thin">
      <div className="glass-panel rounded-3xl p-6 md:p-8 bg-gradient-to-br from-cyber-orange/10 to-transparent border-cyber-orange/20 relative overflow-hidden shrink-0 min-h-[200px]">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Map size={200} className="text-cyber-orange" />
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-mono font-bold text-white uppercase tracking-tighter">LAND_VALUATION_RECON</h2>
            <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-500 font-mono mt-1">
              <Zap size={14} className="text-cyber-orange" /> SECURE_VECTOR_HYBRID_ANALYSIS
            </div>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-cyber-orange/30 p-4 md:p-6 rounded-2xl text-right w-full md:w-auto min-h-[100px] flex flex-col justify-center shadow-inner">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-1">Hybrid Market Valuation</span>
            <div className="text-3xl md:text-4xl font-mono font-bold text-cyber-orange tracking-tight break-words text-glow-orange leading-tight">{result.landValue}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
            <span className="text-[10px] font-mono text-gray-400 uppercase">Unit Value Breakdown</span>
            <div className="text-xs md:text-sm text-white mt-2 font-mono font-bold">{result.perSqmValue}</div>
          </div>
          <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
            <span className="text-[10px] font-mono text-gray-400 uppercase">Dev ROI Projection</span>
            <p className="text-[11px] md:text-xs text-cyber-lime mt-2 font-mono font-bold uppercase">{result.devROI}</p>
          </div>
          <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
            <span className="text-[10px] font-mono text-gray-400 uppercase">Confidence Score</span>
            <div className="mt-2 text-xl font-mono font-bold text-white">{result.confidenceScore}%</div>
          </div>
        </div>
      </div>

      {/* Expanded Valuation Rationale */}
      <div className="glass-panel rounded-3xl p-6 border-l-4 border-l-cyber-orange bg-cyber-orange/5">
        <h3 className="text-sm font-mono font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
          <Info size={16} className="text-cyber-orange" /> Market Valuation Logic
        </h3>
        <div className="bg-black/60 p-5 rounded-2xl border border-cyber-orange/20">
            <p className="text-[11px] text-gray-300 font-mono leading-relaxed italic whitespace-pre-wrap">
              {result.valuationJustification}
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-3xl p-6 border-l-4 border-l-cyber-teal bg-cyber-teal/5">
          <h3 className="text-sm font-mono font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
            <Layers size={16} className="text-cyber-teal" /> Zoning & Usage Intel
          </h3>
          <p className="text-[11px] text-gray-400 font-mono leading-relaxed italic whitespace-pre-wrap">
            {result.zoningAnalysis}
          </p>
        </div>
        <div className="glass-panel rounded-3xl p-6 border-l-4 border-l-cyber-lime bg-cyber-lime/5">
          <h3 className="text-sm font-mono font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
            <MessageSquare size={16} className="text-cyber-lime" /> Negotiation Strategy
          </h3>
          <div className="bg-black/60 p-5 rounded-2xl border border-cyber-lime/20 h-full min-h-[100px]">
            <p className="text-[11px] text-gray-300 font-mono leading-relaxed italic">
                {result.negotiationStrategy}
            </p>
          </div>
        </div>
      </div>

      {result.listings && result.listings.length > 0 && (
        <div className="glass-panel rounded-3xl p-6 border border-white/5 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-cyber-orange" />
              <h3 className="text-sm font-mono font-bold text-white tracking-widest uppercase">Asset Market Discovery</h3>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-cyber-orange/10 border border-cyber-orange/30 rounded-lg text-[9px] font-mono text-cyber-orange uppercase">
                <Database size={12} /> Vector Match Active
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.listings.map((item, idx) => (
              <div key={idx} className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 hover:border-cyber-orange/40 transition-all group">
                <div className="flex flex-col gap-3 h-full justify-between">
                  <div className="flex flex-col gap-1">
                    <h4 className="font-bold text-white text-xs line-clamp-2 uppercase tracking-tight">{item.title}</h4>
                    <p className="text-[9px] text-gray-500 font-mono truncate">{item.address}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-cyber-orange font-bold leading-none text-glow-orange">{item.price}</span>
                      <span className="text-[9px] text-gray-600 font-mono">{item.size}</span>
                    </div>
                  </div>
                  <a 
                    href={item.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-cyber-orange/10 border border-cyber-orange/30 text-cyber-orange text-[9px] font-mono font-bold hover:bg-cyber-orange hover:text-black transition-all shadow-neon-orange"
                  >
                    SECURE_LISTING <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LandReport;
