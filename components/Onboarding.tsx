
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Zap, ShieldCheck, Database, ArrowRight, User, Phone, Mail, Activity, Lock } from 'lucide-react';

interface OnboardingProps {
  onComplete: (user: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState<UserProfile>({ name: '', mobile: '', email: '' });
  const [stage, setStage] = useState<'input' | 'authorizing' | 'entering'>('input');
  const [statusText, setStatusText] = useState('SYSTEM_IDLE');

  const statuses = [
    'ENCRYPTING_IDENTITY...',
    'STABILIZING_GEOLINK...',
    'GENERATING_HOUSE_WIREFRM...',
    'THRESHOLD_SYNC_COMPLETE'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile || !formData.email) return;

    setStage('authorizing');
    let i = 0;
    const interval = setInterval(() => {
      setStatusText(statuses[i]);
      i++;
      if (i === statuses.length) {
        clearInterval(interval);
        setTimeout(() => {
          setStage('entering');
          setTimeout(() => onComplete(formData), 1500);
        }, 500);
      }
    }, 700);
  };

  return (
    <div className={`fixed inset-0 z-[100] bg-cyber-black flex items-center justify-center overflow-hidden font-mono transition-colors duration-1000 ${stage === 'entering' ? 'bg-white dark:bg-black' : ''}`}>
      
      <div className={`absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-1000 ${stage === 'entering' ? 'opacity-0' : ''}`}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] transform perspective-1000 rotateX-60 origin-top h-[200vh]" />
      </div>

      {stage !== 'entering' && (
        <div className={`relative w-full max-w-lg px-8 py-12 transition-all duration-700 ${stage === 'authorizing' ? 'scale-95 opacity-50' : 'animate-in fade-in zoom-in-95'}`}>
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-cyber-teal/10 border border-cyber-teal/30 mb-6 shadow-neon-teal">
              <Zap size={40} className="text-cyber-teal" />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tighter mb-2">QUANT<span className="text-cyber-teal">CASA</span></h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.5em]">Analytics & Research Wing</p>
          </div>

          <div className="glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
            {stage === 'authorizing' && (
               <div className="absolute inset-0 bg-cyber-black/80 backdrop-blur-md z-20 flex flex-col items-center justify-center">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 border-2 border-cyber-teal/20 rounded-full" />
                    <div className="absolute inset-0 border-t-2 border-cyber-teal rounded-full animate-spin" />
                  </div>
                  <p className="text-cyber-teal text-[10px] tracking-[0.3em] font-bold animate-pulse uppercase">{statusText}</p>
               </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2 group">
                <label className="text-[9px] text-gray-500 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-cyber-teal transition-colors">
                  <User size={10} className="text-cyber-teal" /> Investigator Name
                </label>
                <input
                  required
                  type="text"
                  placeholder="ENTER FULL NAME"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-cyber-teal transition-all font-mono placeholder:text-gray-700"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2 group">
                <label className="text-[9px] text-gray-500 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-cyber-teal transition-colors">
                  <Phone size={10} className="text-cyber-teal" /> Mobile Verification
                </label>
                <input
                  required
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-cyber-teal transition-all font-mono placeholder:text-gray-700"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                />
              </div>

              <div className="space-y-2 group">
                <label className="text-[9px] text-gray-500 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-cyber-teal transition-colors">
                  <Mail size={10} className="text-cyber-teal" /> Digital Mailbox
                </label>
                <input
                  required
                  type="email"
                  placeholder="RESEARCHER@QUANTCASA.IO"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-cyber-teal transition-all font-mono placeholder:text-gray-700"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-cyber-teal text-cyber-black font-bold py-5 rounded-xl flex items-center justify-center gap-3 hover:bg-white transition-all shadow-neon-teal group mt-6 active:scale-[0.98]"
              >
                <Lock size={16} /> INITIALIZE ENTRY <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>

          <div className="mt-8 flex justify-between items-center px-4 opacity-50">
             <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-cyber-lime" />
                <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Secure Protocol 2.5</span>
             </div>
             <div className="flex items-center gap-2">
                <Activity size={14} className="text-cyber-teal" />
                <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Latency: 14ms</span>
             </div>
          </div>
        </div>
      )}

      {stage === 'entering' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black overflow-hidden">
          <div className="relative flex items-center justify-center animate-portal-zoom">
            <svg viewBox="0 0 100 100" className="w-[100px] h-[100px] text-cyber-teal stroke-[0.5] fill-none">
              <path d="M50 10 L90 40 V90 H10 V40 Z" className="animate-draw-path shadow-neon-teal" />
              <rect x="40" y="60" width="20" height="30" className="animate-draw-path" />
              <rect x="25" y="45" width="15" height="15" className="animate-draw-path" />
              <rect x="60" y="45" width="15" height="15" className="animate-draw-path" />
            </svg>
            <div className="absolute inset-0 bg-cyber-teal/20 blur-[60px] animate-pulse" />
          </div>
        </div>
      )}

      <style>{`
        @keyframes portal-zoom {
          0% { transform: scale(1); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: scale(60); opacity: 0; }
        }
        @keyframes draw-path {
          0% { stroke-dasharray: 0 300; stroke-dashoffset: 0; }
          100% { stroke-dasharray: 300 0; stroke-dashoffset: 0; }
        }
        .animate-portal-zoom { animation: portal-zoom 1.8s cubic-bezier(0.7, 0, 0.3, 1) forwards; }
        .animate-draw-path { stroke-dasharray: 300; animation: draw-path 2s ease-out forwards; }
        .rotateX-60 { transform: rotateX(60deg); }
        .perspective-1000 { perspective: 1000px; }
      `}</style>
    </div>
  );
};

export default Onboarding;
