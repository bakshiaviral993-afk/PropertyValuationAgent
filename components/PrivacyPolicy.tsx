
import React from 'react';
import { ArrowLeft, Shield, Lock, Eye, Database, Globe, Scale } from 'lucide-react';
import Logo from './Logo';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-neo-bg text-white flex flex-col font-sans overflow-x-hidden">
      <header className="px-6 md:px-10 py-6 border-b border-white/5 bg-neo-glass/60 backdrop-blur-2xl sticky top-0 z-[100] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white shadow-neo-glow">
            <Logo size={24} />
          </div>
          <h1 className="font-black text-xl text-white tracking-tighter uppercase">Privacy Guard</h1>
        </div>
        <button onClick={onBack} className="h-10 px-6 rounded-2xl bg-white/5 text-[10px] font-black hover:bg-white/10 transition-all flex items-center gap-2 border border-white/5 uppercase tracking-widest shadow-glass-3d active:scale-95">
          <ArrowLeft size={14} /> Return
        </button>
      </header>

      <main className="max-w-4xl mx-auto w-full p-8 md:p-16 space-y-16">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-neo-neon/10 border border-neo-neon/20 rounded-full text-neo-neon text-[10px] font-black uppercase tracking-[0.3em]">
            <Shield size={16} /> Data Trust Protocol V1.0
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none uppercase">Privacy Policy</h2>
          <p className="text-gray-400 text-lg font-medium max-w-2xl mx-auto uppercase tracking-tight">
            Comprehensive framework for digital asset data protection under DPDP Act 2023.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12">
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-neo-neon/10 rounded-2xl text-neo-neon"><Database size={24} /></div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">1. Data Collection</h3>
            </div>
            <div className="bg-white/5 rounded-[32px] p-8 border border-white/5 space-y-4">
              <p className="text-gray-400 leading-relaxed font-medium">
                QuantCasa collects data necessary for property valuation, including but not limited to:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['Locality/Area Search Data', 'Property Configuration Specs', 'Approximate Geolocation', 'User Sentiment Inputs'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300 font-bold uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-neo-neon" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-neo-pink/10 rounded-2xl text-neo-pink"><Lock size={24} /></div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">2. Purpose of Processing</h3>
            </div>
            <div className="bg-white/5 rounded-[32px] p-8 border border-white/5">
              <p className="text-gray-400 leading-relaxed font-medium">
                Your data is processed solely to provide real-time market intelligence, accurate price estimations, and regional real estate forecasts. We do not use your data for unsolicited marketing or sell your individual search patterns to external brokers.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-neo-gold/10 rounded-2xl text-neo-gold"><Scale size={24} /></div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">3. User Rights (DPDP 2023)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Right to Correct', desc: 'Update inaccurate data records.' },
                { title: 'Right to Erase', desc: 'Request deletion of search history.' },
                { title: 'Right to Withdraw', desc: 'Revoke consent at any time.' }
              ].map((right, i) => (
                <div key={i} className="bg-white/5 rounded-[32px] p-8 border border-white/5 space-y-3">
                  <h4 className="text-xs font-black text-neo-gold uppercase tracking-widest">{right.title}</h4>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">{right.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500"><Globe size={24} /></div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">4. Storage & Security</h3>
            </div>
            <div className="bg-white/5 rounded-[32px] p-8 border border-white/5">
              <p className="text-gray-400 leading-relaxed font-medium">
                QuantCasa utilizes enterprise-grade encryption for all data transmissions. Search metadata is stored in secure localized nodes to comply with data residency requirements. In the event of a breach, we adhere to the mandatory notification protocols specified under the DPDP Act.
              </p>
            </div>
          </section>
        </div>

        <div className="pt-16 border-t border-white/5 text-center">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Last Updated: December 2025</p>
          <button onClick={onBack} className="mt-10 px-12 py-5 bg-neo-neon text-white rounded-[24px] text-xs font-black uppercase tracking-widest shadow-neo-glow hover:scale-105 active:scale-95 transition-all">
            Understood & Acknowledge
          </button>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
