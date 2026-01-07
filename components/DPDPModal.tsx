
import React from 'react';
import { ShieldCheck, ArrowRight, Lock, Eye } from 'lucide-react';

interface DPDPModalProps {
  onAccept: () => void;
  onReadMore: () => void;
}

const DPDPModal: React.FC<DPDPModalProps> = ({ onAccept, onReadMore }) => {
  return (
    <div className="fixed inset-0 z-[999] bg-neo-bg/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-lg bg-neo-bg border border-white/10 rounded-[48px] p-10 shadow-neo-glow relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5 -rotate-12 transition-transform group-hover:scale-110 duration-1000">
          <ShieldCheck size={120} className="text-neo-neon" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-neo-neon/10 border border-neo-neon/20 flex items-center justify-center text-neo-neon">
              <Lock size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Data Protection</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em] font-black opacity-60">DPDP Act 2023 Compliance</p>
            </div>
          </div>

          <div className="space-y-6 mb-10">
            <p className="text-sm text-gray-400 leading-relaxed font-medium">
              QuantCasa values your digital privacy. To provide hyper-local real estate valuations, we process your search data under the <span className="text-white font-black">Digital Personal Data Protection Act 2023</span>.
            </p>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <ShieldCheck size={18} className="text-neo-neon mt-1 shrink-0" />
                <p className="text-xs text-gray-300 font-medium">Your data is encrypted and used strictly for search grounding and valuation analysis.</p>
              </div>
              <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <Eye size={18} className="text-neo-pink mt-1 shrink-0" />
                <p className="text-xs text-gray-300 font-medium">We do not sell your personal search history to third-party brokers.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={onAccept}
              className="w-full py-5 bg-neo-neon text-white rounded-[24px] text-sm font-black uppercase tracking-widest shadow-neo-glow hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 border-t border-white/20"
            >
              Accept & Continue <ArrowRight size={18} />
            </button>
            <button 
              onClick={onReadMore}
              className="w-full py-5 bg-white/5 text-gray-500 rounded-[24px] text-xs font-black uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all"
            >
              Review Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DPDPModal;
