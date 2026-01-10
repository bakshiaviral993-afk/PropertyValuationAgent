
import React, { useState } from 'react';
import { Building2, Map as MapIcon, ArrowRight, Globe, Zap, ShieldCheck, Sparkles, ShoppingBag, Briefcase, Calculator } from 'lucide-react';
import Logo from './Logo';
import { AppMode, AppLang } from '../types';
import { speak } from '../services/voiceService';

interface OnboardingProps {
  onComplete: (mode: AppMode, lang: AppLang) => void;
}

const TRANSLATIONS = {
  EN: {
    hero: "Find your property's true value.",
    sub: "AI-powered reports with market trends & fair price estimates.",
    buy: "Buy 🏠",
    rent: "Rent 🏘️",
    land: "Land 🏗️",
    expert: "AI Expert ✨",
    essentials: "Essentials 🛍️",
    commercial: "Commercial 🏢",
    started: "Get started",
    greeting: "Welcome to QuantCasa. I am your property intelligence agent. Let's find your asset value together."
  },
  HI: {
    hero: "अपनी संपत्ति का सही मूल्य जानें।",
    sub: "बाजार के रुझान और सटीक मूल्य अनुमान के साथ एआई रिपोर्ट।",
    buy: "खरीदें 🏠",
    rent: "किराया 🏘️",
    land: "ज़मीन 🏗️",
    expert: "एआई विशेषज्ञ ✨",
    essentials: "आवश्यकताएं 🛍️",
    commercial: "व्यावसायिक 🏢",
    started: "शुरू करें",
    greeting: "QuantCasa में आपका स्वागत है। मैं आपका प्रॉपर्टी इंटेलिजेंस एजेंट हूँ। आइए मिलकर आपकी संपत्ति का मूल्य खोजें।"
  }
};

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [lang, setLang] = useState<AppLang>('EN');
  const [showModes, setShowModes] = useState(false);

  const t = TRANSLATIONS[lang];

  const handleLangSelect = (l: AppLang) => {
    setLang(l);
    speak(TRANSLATIONS[l].greeting, l === 'EN' ? 'en-IN' : 'hi-IN');
  };

  return (
    <div className="min-h-screen bg-neo-bg flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-neo-neon rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-neo-pink rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl w-full space-y-12 relative z-10">
        <div className="flex justify-center sm:justify-end gap-3">
          {(['EN', 'HI'] as AppLang[]).map((l) => (
            <button
              key={l}
              onClick={() => handleLangSelect(l)}
              className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${
                lang === l
                  ? 'bg-neo-neon text-white border-neo-neon shadow-neo-glow scale-105'
                  : 'bg-white/5 text-gray-400 border-white/20 hover:border-neo-neon hover:text-white'
              }`}
            >
              {l === 'EN' ? 'English' : 'हिंदी'}
            </button>
          ))}
        </div>

        {!showModes ? (
          <div className="text-center space-y-8 animate-in fade-in zoom-in duration-700">
            <div className="flex justify-center mb-8">
               <div className="p-8 rounded-[40px] bg-white/5 border border-white/10 shadow-neo-glow">
                 <Logo size={80} />
               </div>
            </div>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-neo-neon/10 border border-neo-neon/20 rounded-full text-neo-neon text-[10px] font-black uppercase tracking-[0.3em] shadow-neo-glow">
              <Zap size={14} className="animate-pulse" /> Free Intelligence • Direct Access
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none">
              {t.hero.split(' ').map((w, i) => (
                <span key={i} className={w.includes('true') || w.includes('सही') ? 'text-neo-neon neon-text-glow' : ''}>{w} </span>
              ))}
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium uppercase tracking-tight">
              {t.sub}
            </p>
            <button 
              onClick={() => setShowModes(true)}
              className="px-14 py-6 bg-neo-neon text-white rounded-[32px] text-xl font-black shadow-neo-glow hover:scale-105 active:scale-95 transition-all flex items-center gap-4 mx-auto group border-t border-white/20"
            >
              {t.started} <ArrowRight className="group-hover:translate-x-3 transition-transform" />
            </button>
          </div>
        ) : (
          <div className="space-y-10 animate-in slide-in-from-bottom-12 duration-500">
            <div className="text-center">
               <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Objective Selection</h2>
               <p className="text-gray-500 mt-3 font-medium uppercase text-xs tracking-widest">Identify target asset class or expertise required</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { id: 'buy', title: t.buy, desc: 'Residential capital asset valuation and acquisition', icon: <Logo size={32} /> },
                { id: 'rent', title: t.rent, desc: 'Leasehold market estimates and yield analysis', icon: <Building2 /> },
                { id: 'land', title: t.land, desc: 'Plot valuation, FSI analysis and development ROI', icon: <MapIcon /> },
                { id: 'commercial', title: t.commercial, desc: 'Shops, Offices, and Warehouses. Buy or Lease.', icon: <Briefcase /> },
                { id: 'essentials', title: t.essentials, desc: 'Discover local vendors, chemists, and life pulse', icon: <ShoppingBag /> },
                { id: 'expert', title: t.expert, desc: 'Conversational AI for legal, Vastu and trends', icon: <Sparkles /> }
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => onComplete(mode.id as any, lang)}
                  className="group bg-white/5 p-8 rounded-[40px] border border-white/10 shadow-glass-3d hover:border-neo-neon/40 transition-all text-left space-y-6 hover:-translate-y-3"
                >
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500 bg-white/5 text-neo-neon group-hover:bg-neo-neon group-hover:text-white shadow-neo-glow`}>
                    {typeof mode.icon === 'object' && React.isValidElement(mode.icon) ? (
                        mode.icon
                    ) : (
                        React.cloneElement(mode.icon as React.ReactElement, { size: 32 })
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{mode.title}</h3>
                    <p className="text-[10px] text-gray-500 mt-2 leading-relaxed font-bold uppercase tracking-widest">{mode.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-neo-neon opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                    Initialize Scan <ArrowRight size={14} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">
          <div className="flex items-center gap-2"><Globe size={16} /> Global Market Sync Ready</div>
          <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-gray-800" />
          <div className="flex items-center gap-2"><ShieldCheck size={16} /> Quantum Encrypted Tunnel</div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
