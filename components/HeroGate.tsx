import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface HeroGateProps {
  onEnter: () => void;
}

const HeroGate: React.FC<HeroGateProps> = ({ onEnter }) => {
  const [animationStage, setAnimationStage] = useState(0);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timers: number[] = [];
    
    const schedule = [
      { stage: 1, delay: 500 },
      { stage: 2, delay: 1500 },
      { stage: 3, delay: 2500 },
      { stage: 4, delay: 3500 },
      { stage: 5, delay: 4000 },
      { stage: 6, delay: 5000 },
      { btn: true, delay: 6000 },
    ];

    schedule.forEach(item => {
      const t = window.setTimeout(() => {
        if (item.stage !== undefined) setAnimationStage(item.stage);
        if (item.btn !== undefined) setShowButton(item.btn);
      }, item.delay);
      timers.push(t);
    });

    return () => timers.forEach(t => window.clearTimeout(t));
  }, []);

  const drawEffect = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (custom: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: { 
        pathLength: { delay: custom, duration: 1, ease: "easeInOut" },
        opacity: { delay: custom, duration: 0.5 }
      },
    }),
  };

  const scaleIn = {
    hidden: { scale: 0, opacity: 0 },
    visible: (custom: number) => ({
      scale: 1,
      opacity: 1,
      transition: { delay: custom, duration: 0.8, ease: "backOut" },
    }),
  };

  return (
    <div className="fixed inset-0 bg-[#000000] flex flex-col items-center justify-center overflow-hidden z-[1000] font-sans">
      <div className="relative w-[300px] h-[300px] flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_0_20px_rgba(0,246,255,0.3)]">
          <defs>
            <linearGradient id="gate-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F6FF" />
              <stop offset="100%" stopColor="#585FD8" />
            </linearGradient>
          </defs>

          <AnimatePresence>
            {animationStage >= 1 && (
              <motion.circle
                cx="72" cy="45" r="4.5"
                fill="url(#gate-logo-gradient)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                transition={{ scale: { repeat: Infinity, duration: 2, ease: "easeInOut" }, opacity: { duration: 0.5 } }}
              />
            )}

            {animationStage >= 2 && (
              <>
                <motion.line x1="79" y1="36" x2="88" y2="28" stroke="url(#gate-logo-gradient)" strokeWidth="4.5" strokeLinecap="round" variants={drawEffect} initial="hidden" animate="visible" custom={0.1} />
                <motion.line x1="83" y1="45" x2="93" y2="45" stroke="url(#gate-logo-gradient)" strokeWidth="4.5" strokeLinecap="round" variants={drawEffect} initial="hidden" animate="visible" custom={0.3} />
                <motion.line x1="79" y1="54" x2="88" y2="62" stroke="url(#gate-logo-gradient)" strokeWidth="4.5" strokeLinecap="round" variants={drawEffect} initial="hidden" animate="visible" custom={0.5} />
              </>
            )}

            {animationStage >= 3 && (
              <motion.path
                d="M25 75 L52 45 L79 75"
                stroke="url(#gate-logo-gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                variants={drawEffect}
                initial="hidden"
                animate="visible"
                custom={0}
              />
            )}

            {animationStage >= 4 && (
              <>
                <motion.rect x="42" y="65" width="5.5" height="10" rx="1.5" fill="url(#gate-logo-gradient)" variants={scaleIn} initial="hidden" animate="visible" custom={0.1} opacity="0.6" />
                <motion.rect x="50" y="55" width="5.5" height="20" rx="1.5" fill="url(#gate-logo-gradient)" variants={scaleIn} initial="hidden" animate="visible" custom={0.3} />
                <motion.rect x="58" y="68" width="5.5" height="7" rx="1.5" fill="url(#gate-logo-gradient)" variants={scaleIn} initial="hidden" animate="visible" custom={0.5} opacity="0.6" />
              </>
            )}

            {animationStage >= 5 && (
              <motion.path
                d="M25 75 A 32 32 0 1 1 72 45"
                stroke="url(#gate-logo-gradient)"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              />
            )}
          </AnimatePresence>

          {animationStage >= 6 && (
            <motion.circle
              cx="50" cy="50" r="50"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [0.8, 1.1, 1], opacity: [0, 0.2, 0] }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              fill="url(#gate-logo-gradient)"
            />
          )}
        </svg>
      </div>

      <AnimatePresence>
        {showButton && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 flex flex-col items-center text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase neon-text-glow">QuantCasa</h1>
              <p className="text-[10px] text-neo-neon font-black uppercase tracking-[0.4em] opacity-80">INTELLIGENCE_LAYER_V5.3</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onEnter}
              className="group flex items-center gap-4 px-10 py-5 bg-neo-neon text-white rounded-full font-black uppercase tracking-[0.2em] shadow-neo-glow border-t border-white/20 transition-all"
            >
              Enter QuantCasa <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeroGate;