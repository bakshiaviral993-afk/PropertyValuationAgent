import React from 'react';
import { X, Globe, ShieldCheck, Zap, Layers, Cpu, Database, Binary, MessageSquare, Landmark, Info } from 'lucide-react';
import Logo from './Logo';

interface AboutModalProps {
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[700] bg-neo-bg/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-3xl bg-neo-bg border border-white/10 rounded-[48px] p-8 md:p-12 shadow-neo-glow relative overflow-y-auto max-h-[90vh] scrollbar-hide border-t-white/20">
        <button onClick={onClose} className="absolute top-8 right-8 p-4 bg-white/5 rounded-2xl hover:bg-neo-pink hover:text-white transition-all text-gray-500 active:scale-90">
          <X size={24} />
        </button>

        <div className="space-y-12">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center gap-6">
            <div className="p-8 bg-white/5 border border-white/10 rounded-[40px] shadow-neo-glow group">
              <Logo size={80} className="group-hover:rotate-12 transition-transform duration-700" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-2 neon-text-glow">About QuantCasa</h2>
              <span className="text-[10px] font-black text-neo-neon uppercase tracking-[0.4em] opacity-80">Real Estate Intelligence Node v5.3.1</span>
            </div>
          </div>

          {/* Purpose Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-neo-neon">
              <Globe size={20} />
              <h3 className="text-xs font-black uppercase tracking-[0.3em]">Mission Protocol</h3>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed font-medium italic border-l-2 border-neo-neon/30 pl-6">
              "QuantCasa is engineered to solve the chronic price asymmetry in global micro-markets. By leveraging high-compute neural grounding of live verified listings and macroeconomic signals, we provide users with the scientific 'Fair Value' of any property asset, protecting capital and optimizing yields."
            </p>
          </section>

          {/* Features Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: <Database />, title: "Live Grounding", desc: "Aggregates indices from 50+ verified market signal sources in real-time." },
              { icon: <Binary />, title: "Fiscal Simulator", desc: "Regulatory-compliant EMI, Stamp Duty, and ROI calculators." },
              { icon: <ShieldCheck />, title: "Trust Verified", desc: "DPDP 2023 compliant data encryption for individual search privacy." },
              { icon: <MessageSquare />, title: "Neural Expert", desc: "LLM-driven logical reasoning for Vastu, legal, and interior diagnostics." },
            ].map((f, i) => (
              <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-[28px] flex gap-4 items-start hover:border-neo-neon/40 transition-all group">
                <div className="p-3 bg-neo-neon/10 text-neo-neon rounded-xl group-hover:scale-110 transition-transform">
                  {React.cloneElement(f.icon as React.ReactElement, { size: 18 })}
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">{f.title}</h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed font-bold uppercase">{f.desc}</p>
                </div>
              </div>
            ))}
          </section>

          {/* Tester NDA Section */}
          <section className="p-8 bg-neo-gold/5 border border-neo-gold/20 rounded-[32px] space-y-5">
            <div className="flex items-center gap-3 text-neo-gold">
              <Landmark size={20} />
              <h3 className="text-xs font-black uppercase tracking-[0.3em]">Tester Non-Disclosure Agreement</h3>
            </div>
            <div className="text-[11px] text-gray-400 leading-relaxed font-medium italic space-y-4">
              <p>
                <strong className="text-neo-gold uppercase tracking-widest block mb-1">1. Proprietary Tech:</strong> All UI/UX logic, valuation weights, and neural prompts within QuantCasa v5.3 are trade secrets of QuantCasa Labs. Disclosure to any third party without written consent is strictly prohibited.
              </p>
              <p>
                <strong className="text-neo-gold uppercase tracking-widest block mb-1">2. Data Processing:</strong> Tester search signals are used exclusively for internal node calibration. No personal data is permanently indexed per the Digital Personal Data Protection Act (2023).
              </p>
              <p>
                <strong className="text-neo-gold uppercase tracking-widest block mb-1">3. Liability Disclaimer:</strong> Valuations are algorithmic estimates. This tool is a decision-support node and not a legal financial appraisal.
              </p>
            </div>
          </section>

          <div className="pt-8 border-t border-white/5 flex justify-center">
            <button 
              onClick={onClose}
              className="px-12 py-5 bg-neo-neon text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-neo-glow hover:scale-105 active:scale-95 transition-all"
            >
              Acknowledge & Access Terminal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;