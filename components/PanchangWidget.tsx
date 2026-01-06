
import React, { useMemo } from 'react';
import { Calendar, Sun, Moon, Zap, Info, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { getDailyPanchang } from '../utils/panchangCalc';
import { AppLang } from '../types';

interface PanchangWidgetProps {
  lang: AppLang;
}

const PanchangWidget: React.FC<PanchangWidgetProps> = ({ lang }) => {
  const panchang = useMemo(() => getDailyPanchang(new Date()), []);

  return (
    <div className="bg-neo-glass border border-white/10 rounded-[40px] p-8 space-y-8 shadow-neo-glow animate-in fade-in zoom-in duration-700">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-neo-gold/10 rounded-2xl text-neo-gold shadow-gold-glow">
            <Calendar size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tighter uppercase">Home Harmony Index</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Daily Panchang & Property Pulse</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-3xl font-black text-neo-gold">{panchang.harmonyScore}%</div>
          <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Score</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/5 p-4 rounded-3xl">
          <div className="flex items-center gap-2 mb-2 text-neo-neon">
            <Moon size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">Tithi</span>
          </div>
          <div className="text-lg font-black text-white">{panchang.tithi}</div>
        </div>
        <div className="bg-white/5 border border-white/5 p-4 rounded-3xl">
          <div className="flex items-center gap-2 mb-2 text-neo-pink">
            <Sun size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">Nakshatra</span>
          </div>
          <div className="text-lg font-black text-white">{panchang.nakshatra}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-5 bg-neo-neon/10 border border-neo-neon/20 rounded-3xl flex items-start gap-4">
          <Clock className="text-neo-neon mt-1 shrink-0" size={20} />
          <div>
            <h4 className="text-xs font-black text-neo-neon uppercase tracking-widest mb-1">Auspicious Window</h4>
            <p className="text-sm font-bold text-white">{panchang.auspiciousTiming}</p>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest leading-relaxed">Optimal for registrations & payments</p>
          </div>
        </div>

        <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-start gap-4">
          <AlertTriangle className="text-red-500 mt-1 shrink-0" size={20} />
          <div>
            <h4 className="text-xs font-black text-red-500 uppercase tracking-widest mb-1">Inauspicious Period</h4>
            <p className="text-sm font-bold text-white">Rahu Kaal: {panchang.rahuKaal}</p>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest leading-relaxed">Avoid signing critical asset documents</p>
          </div>
        </div>

        <div className="p-6 bg-neo-gold/5 border border-neo-gold/20 rounded-[32px] flex items-start gap-4">
          <Zap className="text-neo-gold mt-1 shrink-0" size={20} />
          <div>
            <h4 className="text-xs font-black text-neo-gold uppercase tracking-widest mb-1">Expert Property Advice</h4>
            <p className="text-sm text-gray-300 leading-relaxed font-medium italic">
              "{panchang.propertyAdvice}"
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-white/5 flex items-center gap-2 opacity-40">
        <CheckCircle size={12} className="text-neo-gold" />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Astro-Engine V2 Connected</span>
      </div>
    </div>
  );
};

export default PanchangWidget;
