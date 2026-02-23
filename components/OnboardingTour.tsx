import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import {
  X, ChevronRight, ChevronLeft, Zap, Bookmark, Activity,
  PieChart, Target, Sparkles, CheckCircle2, ArrowRight,
  BarChart3, BrainCircuit, TrendingUp, Home, Search
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  targetSelector?: string;          // CSS selector of element to spotlight
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  accentColor: string;
  glowColor: string;
  badge?: string;
  tip?: string;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

// ─── TOUR STEPS ───────────────────────────────────────────────────────────────
const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: "Welcome to QuantCasa",
    description: "India's most intelligent AI property platform. In the next 60 seconds, we'll show you every superpower at your fingertips — and why no other app comes close.",
    icon: <BrainCircuit size={28} />,
    placement: 'center',
    accentColor: '#585FD8',
    glowColor: 'rgba(88,95,216,0.4)',
    badge: '🚀 Public Beta',
  },
  {
    id: 'ticker',
    title: "Live Market Intelligence",
    description: "This live ticker streams real-time signals from 8 major Indian cities — price momentum, investor demand, and micro-market shifts. It's your Bloomberg Terminal for real estate.",
    icon: <Activity size={28} />,
    targetSelector: '[data-tour="ticker"]',
    placement: 'bottom',
    accentColor: '#f97316',
    glowColor: 'rgba(249,115,22,0.4)',
    badge: '📡 Live Feed',
    tip: 'Signals update every session based on market conditions',
  },
  {
    id: 'modes',
    title: "Choose Your Analysis Mode",
    description: "Buy, Rent, Land, Commercial, Expert Chat, Vastu Harmony, Essentials Finder — 7 modes powered by Gemini AI. Each runs a full deep-market analysis in seconds.",
    icon: <Home size={28} />,
    targetSelector: '[data-tour="mode-selector"]',
    placement: 'bottom',
    accentColor: '#585FD8',
    glowColor: 'rgba(88,95,216,0.4)',
    badge: '7 Modes',
    tip: 'Start with Buy or Rent — the most powerful modes',
  },
  {
    id: 'deal-score',
    title: "AI Deal Score",
    description: "Every property gets a Deal Score from 0–100. It's computed from AI confidence, market comparables, location quality, and negotiation signals. Your instant gut-check, supercharged.",
    icon: <Target size={28} />,
    targetSelector: '[data-tour="deal-score"]',
    placement: 'bottom',
    accentColor: '#10b981',
    glowColor: 'rgba(16,185,129,0.4)',
    badge: '🎯 Unique Feature',
    tip: 'Score 75+ = strong buy signal. Below 50 = negotiate hard',
  },
  {
    id: 'fab',
    title: "Your Power Tools",
    description: "Tap the ⚡ button anytime to access Smart Search, Market Pulse, ROI Simulator, and your Watchlist. These tools turn you from a buyer into a real estate strategist.",
    icon: <Zap size={28} />,
    targetSelector: '[data-tour="fab"]',
    placement: 'top',
    accentColor: '#585FD8',
    glowColor: 'rgba(88,95,216,0.6)',
    badge: '⚡ Quick Access',
    tip: 'The ROI Simulator alone will save you lakhs in bad decisions',
  },
  {
    id: 'roi',
    title: "ROI Investment Simulator",
    description: "Drag 6 sliders — price, down payment, loan rate, rental income, appreciation, and time horizon — and watch your returns calculate in real-time. No spreadsheet needed, ever.",
    icon: <PieChart size={28} />,
    placement: 'center',
    accentColor: '#10b981',
    glowColor: 'rgba(16,185,129,0.4)',
    badge: '💰 Must-Use',
    tip: 'Tap ⚡ → ROI Simulator after your first valuation',
  },
  {
    id: 'watchlist',
    title: "Property Watchlist",
    description: "Save any analyzed property to your Watchlist with one tap. Track multiple properties, see deal scores side-by-side, and monitor your total portfolio value — all offline-persistent.",
    icon: <Bookmark size={28} />,
    targetSelector: '[data-tour="watchlist-btn"]',
    placement: 'bottom',
    accentColor: '#a855f7',
    glowColor: 'rgba(168,85,247,0.4)',
    badge: '🔖 Your Portfolio',
    tip: 'Saved properties persist between sessions automatically',
  },
  {
    id: 'ready',
    title: "You're Ready. Let's Find Your Property.",
    description: "You now know more about QuantCasa than 99% of users. Run your first AI valuation — it takes under 90 seconds and will change how you think about property forever.",
    icon: <CheckCircle2 size={28} />,
    placement: 'center',
    accentColor: '#585FD8',
    glowColor: 'rgba(88,95,216,0.4)',
    badge: '✅ Setup Complete',
  },
];

// ─── CONFETTI BURST ───────────────────────────────────────────────────────────
const triggerConfetti = () => {
  try {
    // @ts-ignore
    if (typeof window.confetti === 'function') {
      // @ts-ignore
      window.confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#585FD8', '#FF6B9D', '#FCD34D', '#10b981'] });
    }
  } catch {}
};

// ─── SPOTLIGHT OVERLAY ────────────────────────────────────────────────────────
const SpotlightOverlay: React.FC<{ rect: SpotlightRect | null; color: string }> = ({ rect, color }) => {
  const padding = 12;

  if (!rect) {
    return <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[900]" />;
  }

  const x = rect.left - padding;
  const y = rect.top - padding;
  const w = rect.width + padding * 2;
  const h = rect.height + padding * 2;
  const r = 16;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const clipPath = `polygon(
    0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
    ${x}px ${y + r}px,
    ${x}px ${y + h - r}px,
    ${x + r}px ${y + h}px,
    ${x + w - r}px ${y + h}px,
    ${x + w}px ${y + h - r}px,
    ${x + w}px ${y + r}px,
    ${x + w - r}px ${y}px,
    ${x + r}px ${y}px,
    ${x}px ${y + r}px
  )`;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[900] transition-all duration-500"
        style={{ clipPath }}
      />
      {/* Glow ring around spotlight */}
      <div
        className="fixed z-[901] rounded-2xl pointer-events-none transition-all duration-500"
        style={{
          top: y - 2,
          left: x - 2,
          width: w + 4,
          height: h + 4,
          boxShadow: `0 0 0 2px ${color}, 0 0 30px ${color}`,
          borderRadius: r + 2,
        }}
      />
    </>
  );
};

// ─── STEP INDICATOR ───────────────────────────────────────────────────────────
const StepDots: React.FC<{ total: number; current: number; color: string }> = ({ total, current, color }) => (
  <div className="flex items-center gap-2">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className="rounded-full transition-all duration-300"
        style={{
          width: i === current ? 20 : 6,
          height: 6,
          background: i === current ? color : 'rgba(255,255,255,0.15)',
          boxShadow: i === current ? `0 0 8px ${color}` : 'none',
        }}
      />
    ))}
  </div>
);

// ─── TOOLTIP CARD ─────────────────────────────────────────────────────────────
const TooltipCard: React.FC<{
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  tooltipPos: { top: number; left: number; transformOrigin: string };
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  isFirst: boolean;
  isLast: boolean;
}> = ({ step, stepIndex, totalSteps, tooltipPos, onNext, onPrev, onSkip, isFirst, isLast }) => {
  const isCenter = step.placement === 'center';

  return (
    <div
      className="fixed z-[950] w-[340px] sm:w-[380px]"
      style={
        isCenter
          ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
          : { top: tooltipPos.top, left: tooltipPos.left, transformOrigin: tooltipPos.transformOrigin }
      }
    >
      {/* Arrow connector for non-center */}
      {!isCenter && step.placement === 'bottom' && (
        <div className="flex justify-center mb-2">
          <div
            className="w-3 h-3 rotate-45 border-t border-l"
            style={{ background: '#0d0d1a', borderColor: `${step.accentColor}40` }}
          />
        </div>
      )}
      {!isCenter && step.placement === 'top' && (
        <div className="flex justify-center order-last mt-2">
          <div
            className="w-3 h-3 rotate-45 border-b border-r"
            style={{ background: '#0d0d1a', borderColor: `${step.accentColor}40` }}
          />
        </div>
      )}

      <div
        className="rounded-3xl border overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #0d0d1a 0%, #12121f 100%)',
          borderColor: `${step.accentColor}40`,
          boxShadow: `0 0 60px ${step.glowColor}, 0 24px 48px rgba(0,0,0,0.6)`,
        }}
      >
        {/* Top accent bar */}
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${step.accentColor}, transparent)` }} />

        {/* Skip button */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-all z-10"
        >
          <X size={14} />
        </button>

        <div className="p-6">
          {/* Badge + Icon */}
          <div className="flex items-center justify-between mb-4">
            <span
              className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest"
              style={{ background: `${step.accentColor}20`, color: step.accentColor }}
            >
              {step.badge || `Step ${stepIndex + 1}`}
            </span>
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: `${step.accentColor}15`, color: step.accentColor }}
            >
              {step.icon}
            </div>
          </div>

          {/* Title */}
          <h3
            className="text-xl font-black text-white leading-tight mb-2 tracking-tight"
          >
            {step.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            {step.description}
          </p>

          {/* Tip */}
          {step.tip && (
            <div
              className="flex items-start gap-2.5 p-3 rounded-xl mb-4"
              style={{ background: `${step.accentColor}08`, border: `1px solid ${step.accentColor}20` }}
            >
              <Sparkles size={13} style={{ color: step.accentColor, flexShrink: 0, marginTop: 1 }} />
              <p className="text-[11px] leading-relaxed" style={{ color: step.accentColor }}>
                {step.tip}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <StepDots total={totalSteps} current={stepIndex} color={step.accentColor} />

            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={onPrev}
                  className="w-9 h-9 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all border border-white/5"
                >
                  <ChevronLeft size={16} />
                </button>
              )}
              <button
                onClick={onNext}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white transition-all hover:scale-105 active:scale-95"
                style={{
                  background: step.accentColor,
                  boxShadow: `0 0 20px ${step.glowColor}`,
                }}
              >
                {isLast ? (
                  <>Let's Go <ArrowRight size={14} /></>
                ) : (
                  <>Next <ChevronRight size={14} /></>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-white/5">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${((stepIndex + 1) / totalSteps) * 100}%`,
              background: step.accentColor,
              boxShadow: `0 0 8px ${step.accentColor}`,
            }}
          />
        </div>
      </div>

      {!isCenter && step.placement === 'top' && (
        <div className="flex justify-center mt-2">
          <div
            className="w-3 h-3 rotate-45 border-b border-r"
            style={{ background: '#0d0d1a', borderColor: `${step.accentColor}40` }}
          />
        </div>
      )}
    </div>
  );
};

// ─── MAIN ONBOARDING TOUR ─────────────────────────────────────────────────────
const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, transformOrigin: 'top left' });
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const isFirst = currentStep === 0;

  // Fade in on mount
  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Compute spotlight + tooltip position
  const positionForStep = useCallback((s: TourStep) => {
    if (!s.targetSelector || s.placement === 'center') {
      setSpotlightRect(null);
      return;
    }
    const el = document.querySelector(s.targetSelector) as HTMLElement | null;
    if (!el) {
      setSpotlightRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    const padding = 12;
    const spotlight: SpotlightRect = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };
    setSpotlightRect(spotlight);

    // Tooltip position
    const tooltipWidth = 380;
    const tooltipHeight = 340;
    const margin = 20;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = 0;
    let left = 0;
    let transformOrigin = 'top left';

    if (s.placement === 'bottom') {
      top = rect.bottom + padding + margin;
      left = Math.min(Math.max(rect.left + rect.width / 2 - tooltipWidth / 2, 16), vw - tooltipWidth - 16);
      transformOrigin = 'top center';
    } else if (s.placement === 'top') {
      top = rect.top - padding - margin - tooltipHeight;
      left = Math.min(Math.max(rect.left + rect.width / 2 - tooltipWidth / 2, 16), vw - tooltipWidth - 16);
      transformOrigin = 'bottom center';
    } else if (s.placement === 'left') {
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.left - tooltipWidth - margin;
      transformOrigin = 'center right';
    } else if (s.placement === 'right') {
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.right + margin;
      transformOrigin = 'center left';
    }

    // Clamp vertically
    top = Math.max(16, Math.min(top, vh - tooltipHeight - 16));

    setTooltipPos({ top, left, transformOrigin });
  }, []);

  useLayoutEffect(() => {
    positionForStep(step);
  }, [step, positionForStep]);

  // Scroll target into view
  useEffect(() => {
    if (!step.targetSelector) return;
    const el = document.querySelector(step.targetSelector) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setTimeout(() => positionForStep(step), 350);
    }
  }, [step, positionForStep]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSkip();
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentStep]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => positionForStep(step);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [step, positionForStep]);

  const transition = (fn: () => void) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsVisible(false);
    setTimeout(() => {
      fn();
      setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(false);
      }, 80);
    }, 200);
  };

  const handleNext = () => {
    if (isLast) {
      handleComplete();
      return;
    }
    transition(() => setCurrentStep(s => s + 1));
  };

  const handlePrev = () => {
    if (isFirst) return;
    transition(() => setCurrentStep(s => s - 1));
  };

  const handleSkip = () => {
    localStorage.setItem('qc_tour_done', 'true');
    onSkip();
  };

  const handleComplete = () => {
    localStorage.setItem('qc_tour_done', 'true');
    triggerConfetti();
    setIsVisible(false);
    setTimeout(onComplete, 400);
  };

  return (
    <div
      className="transition-opacity duration-200"
      style={{ opacity: isVisible ? 1 : 0 }}
      aria-modal="true"
      role="dialog"
      aria-label={`Onboarding tour step ${currentStep + 1} of ${TOUR_STEPS.length}: ${step.title}`}
    >
      {/* Spotlight */}
      <SpotlightOverlay rect={spotlightRect} color={step.accentColor} />

      {/* Tooltip */}
      <TooltipCard
        step={step}
        stepIndex={currentStep}
        totalSteps={TOUR_STEPS.length}
        tooltipPos={tooltipPos}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={handleSkip}
        isFirst={isFirst}
        isLast={isLast}
      />

      {/* Keyboard hint — only on first step */}
      {currentStep === 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[950] flex items-center gap-3 text-[10px] text-gray-600 uppercase tracking-widest font-semibold animate-pulse">
          <kbd className="bg-white/5 border border-white/10 px-2 py-1 rounded-lg text-gray-500">→</kbd>
          <span>Navigate</span>
          <kbd className="bg-white/5 border border-white/10 px-2 py-1 rounded-lg text-gray-500">Esc</kbd>
          <span>Skip</span>
        </div>
      )}
    </div>
  );
};

export default OnboardingTour;
