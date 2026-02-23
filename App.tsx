import React, { useState, useEffect, useRef, useCallback } from 'react';
import HeroGate from './components/HeroGate';
import Onboarding from './components/Onboarding';
import ChatInterface from './components/ChatInterface';
import PropertyChat from './components/PropertyChat';
import BuyDashboard from './components/BuyDashboard';
import RentDashboard from './components/RentDashboard';
import LandReport from './components/LandReport';
import CommercialDashboard from './components/CommercialDashboard';
import LoanCalculator from './components/LoanCalculator';
import ValuationCalculator from './components/ValuationCalculator';
import LoanApprovalAIScreen from './components/LoanApprovalAIScreen';
import HarmonyDashboard from './components/HarmonyDashboard';
import EssentialsDashboard from './components/EssentialsDashboard';
import DPDPModal from './components/DPDPModal';
import PrivacyPolicy from './components/PrivacyPolicy';
import FeedbackModal from './components/FeedbackModal';
import AboutModal from './components/AboutModal';
import Logo from './components/Logo';
import { AppMode, AppLang, BuyResult, RentResult, LandResult, CommercialResult, BuyRequest, RentRequest, LandRequest, CommercialRequest } from './types';
import { getBuyAnalysis, getRentAnalysis, getLandValuationAnalysis, getCommercialAnalysis, parsePrice } from './services/geminiService';
import {
  ArrowLeft, Zap, ShieldCheck, Sparkles, Binary, X, BarChart3, Navigation,
  Bell, Shield, Calculator, ShoppingBag, Info, RefreshCw, TrendingUp, TrendingDown,
  Heart, BookmarkPlus, Bookmark, Eye, DollarSign, MapPin, Building2, Home,
  Target, Award, Layers, Activity, ChevronRight, ChevronUp, ChevronDown,
  Star, Flame, Clock, Users, PieChart, BarChart2, Globe, Cpu, Loader2,
  CheckCircle2, AlertTriangle, XCircle, Share2, Download, Lightbulb,
  ArrowUpRight, ArrowDownRight, Minus, Plus, SlidersHorizontal, Search,
  BrainCircuit, Wallet, LineChart, AreaChart, Maximize2
} from 'lucide-react';
import { callLLMWithFallback } from './services/llmFallback';
import OnboardingTour from './components/OnboardingTour';
import PriceAlertPanel from './components/PriceAlertPanel';
import { usePriceAlerts, parseRawPrice as parseAlertPrice } from './components/hooks/usePriceAlerts';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface WatchlistItem {
  id: string;
  city: string;
  area: string;
  bhk: string;
  price: string;
  mode: AppMode;
  addedAt: number;
  dealScore: number;
  trend: 'up' | 'down' | 'stable';
  note?: string;
}

interface MarketSignal {
  city: string;
  signal: string;
  change: string;
  trend: 'up' | 'down' | 'hot';
  icon: string;
}

interface PriceAlert {
  id: string;
  area: string;
  targetPrice: string;
  triggered: boolean;
  createdAt: number;
}

interface ROIInput {
  purchasePrice: number;
  downPayment: number;
  loanRate: number;
  rentalIncome: number;
  appreciationRate: number;
  years: number;
}

// ─── MARKET SIGNALS DATA (live feel) ────────────────────────────────────────
const MARKET_SIGNALS: MarketSignal[] = [
  { city: 'Mumbai', signal: 'Bandra West surging — investor demand +18%', change: '+12.4%', trend: 'hot', icon: '🔥' },
  { city: 'Pune', signal: 'Wagholi corridor: new infra boosts values', change: '+8.1%', trend: 'up', icon: '📈' },
  { city: 'Bangalore', signal: 'Whitefield IT park expansion — buy signal', change: '+14.7%', trend: 'hot', icon: '🚀' },
  { city: 'Hyderabad', signal: 'Gachibowli micro-market cooling slightly', change: '-2.1%', trend: 'down', icon: '📉' },
  { city: 'Delhi NCR', signal: 'Dwarka Expressway: metros drive demand', change: '+9.3%', trend: 'up', icon: '🏗️' },
  { city: 'Chennai', signal: 'OMR tech corridor: strong rental yields', change: '+6.8%', trend: 'up', icon: '💼' },
  { city: 'Ahmedabad', signal: 'Gift City premium — NRI demand rising', change: '+11.2%', trend: 'hot', icon: '🔥' },
  { city: 'Kolkata', signal: 'New Town digital district expanding fast', change: '+5.4%', trend: 'up', icon: '📈' },
];

const MARKET_INSIGHTS = [
  "🧠 AI detected: Properties near metro stations appreciate 2.3x faster than market average",
  "⚡ Real-time signal: RBI rate hold boosts buyer sentiment by 24% this quarter",
  "🎯 Deal alert: Under-construction properties in Tier-2 cities offer 31% better ROI",
  "📊 Market trend: 2BHK configurations seeing 40% higher demand vs last year",
  "🔮 AI prediction: Coastal corridor properties expected to rise 18% in 24 months",
  "💡 Pro insight: South-facing properties sell 15% faster in peak summer months",
  "🏆 Builder watch: Premium builders delivering 94% on-time — verify with QuantCasa",
  "🌍 NRI pulse: Overseas investment in Indian real estate up 38% YoY",
];

const DEAL_TIPS = [
  { tip: "Always negotiate 8-12% below asking in slow market conditions", icon: "💬" },
  { tip: "Check RERA registration before paying any advance amount", icon: "🛡️" },
  { tip: "Carpet Area = 70-75% of Super Built-up — know what you're buying", icon: "📐" },
  { tip: "Stamp duty + registration adds 6-8% to final cost in Maharashtra", icon: "📋" },
  { tip: "East-facing homes reduce AC bills by up to 18% annually", icon: "☀️" },
];

// ─── DEAL SCORE COMPONENT ────────────────────────────────────────────────────
const DealScoreRing: React.FC<{ score: number; size?: 'sm' | 'md' | 'lg' }> = ({ score, size = 'md' }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const sizeMap = { sm: 56, md: 80, lg: 112 };
  const dim = sizeMap[size];
  const r = (dim / 2) - 8;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (animatedScore / 100) * circumference;

  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'HOT DEAL' : score >= 65 ? 'GOOD BUY' : score >= 45 ? 'FAIR' : 'REVIEW';

  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const interval = setInterval(() => {
        current += 2;
        if (current >= score) { setAnimatedScore(score); clearInterval(interval); }
        else setAnimatedScore(current);
      }, 16);
      return () => clearInterval(interval);
    }, 300);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} className="-rotate-90">
          <circle cx={dim/2} cy={dim/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6"/>
          <circle
            cx={dim/2} cy={dim/2} r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.05s ease', filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-black text-white" style={{ fontSize: size === 'sm' ? 14 : size === 'md' ? 20 : 28 }}>{animatedScore}</span>
        </div>
      </div>
      <span className="text-[8px] font-black tracking-widest uppercase" style={{ color }}>{label}</span>
    </div>
  );
};

// ─── LIVE MARKET TICKER ───────────────────────────────────────────────────────
const MarketTicker: React.FC = () => {
  const [offset, setOffset] = useState(0);
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame: number;
    let pos = 0;
    const animate = () => {
      pos -= 0.5;
      setOffset(pos);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const items = [...MARKET_SIGNALS, ...MARKET_SIGNALS];

  return (
    <div className="overflow-hidden relative h-7 flex items-center border-y border-white/5 bg-black/20">
      <div className="absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-neo-bg to-transparent z-10"/>
      <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-neo-bg to-transparent z-10"/>
      <div
        ref={tickerRef}
        className="flex gap-12 whitespace-nowrap absolute"
        style={{ transform: `translateX(${offset}px)`, transition: 'none' }}
      >
        {items.map((s, i) => (
          <div key={i} className="flex items-center gap-3 text-[11px] font-semibold">
            <span>{s.icon}</span>
            <span className="text-gray-400">{s.city}</span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-300">{s.signal}</span>
            <span className={`font-black ${s.trend === 'hot' ? 'text-orange-400' : s.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>{s.change}</span>
            <span className="text-white/10">|</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── WATCHLIST PANEL ─────────────────────────────────────────────────────────
const WatchlistPanel: React.FC<{
  items: WatchlistItem[];
  onRemove: (id: string) => void;
  onClose: () => void;
}> = ({ items, onRemove, onClose }) => {
  const totalValue = items.reduce((sum, item) => {
    const v = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0;
    return sum + v;
  }, 0);

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-2xl flex items-center justify-end">
      <div className="w-full max-w-md h-full bg-[#0d0d1a] border-l border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-[#1a1a2e] to-transparent">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Bookmark size={18} className="text-neo-neon"/>
              <h2 className="text-lg font-black uppercase tracking-tighter text-white">My Watchlist</h2>
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{items.length} properties tracked</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
            <X size={18} className="text-gray-400"/>
          </button>
        </div>

        {/* Portfolio value */}
        {items.length > 0 && (
          <div className="mx-4 mt-4 p-4 rounded-2xl bg-gradient-to-br from-neo-neon/10 to-transparent border border-neo-neon/20">
            <p className="text-[10px] font-black text-neo-neon uppercase tracking-widest mb-1">Portfolio Tracked Value</p>
            <p className="text-2xl font-black text-white">₹{totalValue > 1e7 ? (totalValue/1e7).toFixed(2) + ' Cr' : (totalValue/1e5).toFixed(1) + ' L'}</p>
            <p className="text-[10px] text-gray-500 mt-1">Combined valuation of watched properties</p>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-40">
              <BookmarkPlus size={48} className="text-neo-neon"/>
              <p className="font-black text-white uppercase tracking-widest text-sm">Your watchlist is empty</p>
              <p className="text-xs text-gray-500">Analyze a property and save it here</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="group p-4 rounded-2xl bg-white/3 border border-white/5 hover:border-neo-neon/30 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        item.mode === 'buy' ? 'bg-neo-neon/20 text-neo-neon' :
                        item.mode === 'rent' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-orange-500/20 text-orange-400'
                      }`}>{item.mode}</span>
                      {item.trend === 'up' && <TrendingUp size={12} className="text-emerald-400"/>}
                      {item.trend === 'down' && <TrendingDown size={12} className="text-red-400"/>}
                      {item.trend === 'stable' && <Minus size={12} className="text-gray-400"/>}
                    </div>
                    <p className="font-black text-white text-sm truncate">{item.bhk} · {item.area}</p>
                    <p className="text-[11px] text-gray-500">{item.city}</p>
                    <p className="font-black text-neo-neon text-sm mt-1">{item.price}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <DealScoreRing score={item.dealScore} size="sm"/>
                    <button
                      onClick={() => onRemove(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/30 text-red-400"
                    >
                      <X size={12}/>
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-gray-600 mt-2">
                  Added {new Date(item.addedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ─── ROI CALCULATOR ───────────────────────────────────────────────────────────
const ROICalculator: React.FC<{ initialPrice?: number; onClose: () => void }> = ({ initialPrice = 10000000, onClose }) => {
  const [input, setInput] = useState<ROIInput>({
    purchasePrice: initialPrice,
    downPayment: Math.round(initialPrice * 0.2),
    loanRate: 8.5,
    rentalIncome: Math.round(initialPrice * 0.003),
    appreciationRate: 8,
    years: 10,
  });

  const calc = useCallback(() => {
    const loan = input.purchasePrice - input.downPayment;
    const monthlyRate = input.loanRate / 100 / 12;
    const months = input.years * 12;
    const emi = loan > 0 ? (loan * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1) : 0;
    const totalLoanCost = emi * months;
    const totalRent = input.rentalIncome * 12 * input.years;
    const futureValue = input.purchasePrice * Math.pow(1 + input.appreciationRate / 100, input.years);
    const capitalGain = futureValue - input.purchasePrice;
    const totalReturn = totalRent + capitalGain;
    const totalInvestment = input.downPayment + totalLoanCost;
    const roi = ((totalReturn) / totalInvestment) * 100;
    const annualYield = (input.rentalIncome * 12 / input.purchasePrice) * 100;
    return { emi, futureValue, capitalGain, totalRent, totalReturn, roi, annualYield, totalInvestment };
  }, [input]);

  const result = calc();

  const fmt = (n: number) => n >= 1e7 ? `₹${(n/1e7).toFixed(2)}Cr` : `₹${(n/1e5).toFixed(1)}L`;

  const SliderRow: React.FC<{
    label: string; field: keyof ROIInput; min: number; max: number;
    step: number; format: (v: number) => string;
  }> = ({ label, field, min, max, step, format }) => (
    <div className="space-y-1.5">
      <div className="flex justify-between">
        <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">{label}</span>
        <span className="text-[11px] font-black text-white">{format(input[field] as number)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={input[field] as number}
        onChange={e => setInput(prev => ({ ...prev, [field]: Number(e.target.value) }))}
        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-neo-neon [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(88,95,216,0.8)]"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0d0d1a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-gradient-to-r from-emerald-900/20 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <PieChart size={20} className="text-emerald-400"/>
            </div>
            <div>
              <h3 className="font-black text-white text-lg uppercase tracking-tighter">ROI Intelligence</h3>
              <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-semibold">Property Investment Simulator</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
            <X size={18} className="text-gray-400"/>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Inputs */}
          <div className="p-6 space-y-5 border-r border-white/5">
            <SliderRow label="Purchase Price" field="purchasePrice" min={1000000} max={100000000} step={500000} format={fmt}/>
            <SliderRow label="Down Payment" field="downPayment" min={500000} max={input.purchasePrice} step={500000} format={fmt}/>
            <SliderRow label="Loan Interest Rate" field="loanRate" min={6} max={14} step={0.25} format={v => `${v}%`}/>
            <SliderRow label="Monthly Rental Income" field="rentalIncome" min={5000} max={200000} step={1000} format={v => `₹${(v/1000).toFixed(0)}K`}/>
            <SliderRow label="Appreciation Rate (Annual)" field="appreciationRate" min={2} max={20} step={0.5} format={v => `${v}%`}/>
            <SliderRow label="Investment Horizon" field="years" min={3} max={30} step={1} format={v => `${v} yrs`}/>
          </div>

          {/* Results */}
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 text-center">
              <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-black mb-1">Total ROI</p>
              <p className="text-4xl font-black text-white">{result.roi.toFixed(1)}%</p>
              <p className="text-[11px] text-gray-500 mt-1">over {input.years} years</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Future Value', value: fmt(result.futureValue), color: 'text-neo-neon' },
                { label: 'Capital Gain', value: fmt(result.capitalGain), color: 'text-emerald-400' },
                { label: 'Rental Income', value: fmt(result.totalRent), color: 'text-yellow-400' },
                { label: 'Annual Yield', value: `${result.annualYield.toFixed(2)}%`, color: 'text-pink-400' },
                { label: 'Monthly EMI', value: `₹${Math.round(result.emi/1000)}K`, color: 'text-orange-400' },
                { label: 'Total Investment', value: fmt(result.totalInvestment), color: 'text-gray-300' },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-3 rounded-xl bg-white/3 border border-white/5">
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold mb-1">{label}</p>
                  <p className={`text-sm font-black ${color}`}>{value}</p>
                </div>
              ))}
            </div>
            <div className={`p-3 rounded-xl text-[11px] font-semibold flex items-center gap-2 ${
              result.roi > 150 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              result.roi > 80 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
              'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {result.roi > 150 ? <CheckCircle2 size={14}/> : result.roi > 80 ? <AlertTriangle size={14}/> : <XCircle size={14}/>}
              {result.roi > 150 ? '🚀 Excellent investment opportunity' :
               result.roi > 80 ? '⚡ Good returns — consider buying' : '⚠️ Review pricing — returns look thin'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MARKET PULSE PANEL ───────────────────────────────────────────────────────
const MarketPulsePanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeInsight, setActiveInsight] = useState(0);
  const [aiThinking, setAiThinking] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  useEffect(() => {
    const interval = setInterval(() => setActiveInsight(i => (i + 1) % MARKET_INSIGHTS.length), 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-2xl flex items-center justify-start">
      <div className="w-full max-w-md h-full bg-[#0d0d1a] border-r border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-left duration-300">
        <div className="p-6 border-b border-white/5 bg-gradient-to-r from-[#1a1a2e] to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Activity size={22} className="text-neo-neon"/>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"/>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full"/>
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tighter">Market Pulse</h2>
              <p className="text-[10px] text-neo-neon uppercase tracking-widest font-semibold">Live Intelligence Feed</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10">
            <X size={18} className="text-gray-400"/>
          </button>
        </div>

        {/* Rotating insight */}
        <div className="mx-4 mt-4 p-4 rounded-2xl bg-gradient-to-br from-neo-neon/10 to-transparent border border-neo-neon/20 min-h-[80px] flex items-center">
          <p className="text-sm text-white/90 font-medium leading-relaxed transition-all">{MARKET_INSIGHTS[activeInsight]}</p>
        </div>

        {/* City signals */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">City Intelligence</p>
          {MARKET_SIGNALS.map((s, i) => (
            <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 transition-all group">
              <span className="text-xl">{s.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-black text-white uppercase tracking-wider">{s.city}</span>
                  <span className={`text-[11px] font-black ${
                    s.trend === 'hot' ? 'text-orange-400' :
                    s.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                  }`}>{s.change}</span>
                </div>
                <p className="text-[11px] text-gray-500 truncate">{s.signal}</p>
              </div>
            </div>
          ))}

          {/* Deal Tips */}
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-4 mb-2">Expert Deal Tips</p>
          {DEAL_TIPS.map((t, i) => (
            <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
              <span className="text-lg">{t.icon}</span>
              <p className="text-[12px] text-gray-300 leading-relaxed">{t.tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── ALERT TOAST ─────────────────────────────────────────────────────────────
const AlertToast: React.FC<{ message: string; type: 'success' | 'info' | 'warning'; onClose: () => void }> = ({
  message, type, onClose
}) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const config = {
    success: { bg: 'bg-emerald-900/80', border: 'border-emerald-500/40', icon: <CheckCircle2 size={16} className="text-emerald-400"/>, text: 'text-emerald-300' },
    info: { bg: 'bg-neo-neon/10', border: 'border-neo-neon/30', icon: <BrainCircuit size={16} className="text-neo-neon"/>, text: 'text-white' },
    warning: { bg: 'bg-orange-900/40', border: 'border-orange-500/30', icon: <AlertTriangle size={16} className="text-orange-400"/>, text: 'text-orange-300' },
  }[type];

  return (
    <div className={`fixed bottom-24 right-6 z-[500] max-w-sm w-full ${config.bg} backdrop-blur-xl border ${config.border} rounded-2xl p-4 flex items-start gap-3 shadow-2xl animate-in slide-in-from-bottom-4 duration-300`}>
      {config.icon}
      <p className={`text-sm ${config.text} font-medium flex-1 leading-snug`}>{message}</p>
      <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors flex-shrink-0">
        <X size={14}/>
      </button>
    </div>
  );
};

// ─── SMART SEARCH QUICK MODAL ─────────────────────────────────────────────────
const SmartSearchBar: React.FC<{ onSearch: (q: string) => void; onClose: () => void }> = ({ onSearch, onClose }) => {
  const [q, setQ] = useState('');
  const [suggestions] = useState([
    'Buy 2BHK in Wagholi under 70L', 'Rent 3BHK Bandra under ₹80K',
    'Land valuation Thane 500 sqft', 'Commercial shop Koregaon Park',
    'Best areas to invest in Pune 2025', 'Compare Pune vs Mumbai investment',
  ]);

  return (
    <div className="fixed inset-0 z-[350] bg-black/90 backdrop-blur-2xl flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-xl animate-in zoom-in-95 duration-200">
        <div className="relative mb-4">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neo-neon"/>
          <input
            autoFocus
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && q.trim()) onSearch(q); if (e.key === 'Escape') onClose(); }}
            placeholder="Ask anything... 'Buy 2BHK in Pune under ₹80L'"
            className="w-full bg-[#1a1a2e] border border-neo-neon/40 rounded-2xl pl-12 pr-12 py-4 text-white text-base outline-none focus:border-neo-neon transition-all placeholder:text-gray-600 font-medium"
          />
          <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
            <X size={18}/>
          </button>
        </div>
        <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
          <div className="p-3 px-4 flex items-center gap-2">
            <Lightbulb size={14} className="text-yellow-400"/>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Quick Search Suggestions</span>
          </div>
          {suggestions.filter(s => !q || s.toLowerCase().includes(q.toLowerCase())).map((s, i) => (
            <button key={i} onClick={() => onSearch(s)} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all flex items-center gap-3">
              <ChevronRight size={14} className="text-neo-neon flex-shrink-0"/>
              {s}
            </button>
          ))}
        </div>
        <p className="text-center text-[10px] text-gray-600 mt-3 uppercase tracking-widest">Press <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-gray-400">↵</kbd> to analyze · <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-gray-400">Esc</kbd> to close</p>
      </div>
    </div>
  );
};

// ─── FLOATING ACTION BUTTON CLUSTER ──────────────────────────────────────────
const FloatingActions: React.FC<{
  onROI: () => void;
  onWatchlist: () => void;
  onPulse: () => void;
  onSearch: () => void;
  watchlistCount: number;
  tourAttr?: string;
}> = ({ onROI, onWatchlist, onPulse, onSearch, watchlistCount, tourAttr }) => {
  const [open, setOpen] = useState(false);

  const actions = [
    { icon: <Search size={16}/>, label: 'Smart Search', onClick: onSearch, color: 'bg-neo-neon' },
    { icon: <Activity size={16}/>, label: 'Market Pulse', onClick: onPulse, color: 'bg-orange-500' },
    { icon: <PieChart size={16}/>, label: 'ROI Simulator', onClick: onROI, color: 'bg-emerald-500' },
    {
      icon: <div className="relative"><Bookmark size={16}/>{watchlistCount > 0 && <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-black">{watchlistCount}</span>}</div>,
      label: 'Watchlist', onClick: onWatchlist, color: 'bg-purple-500'
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col-reverse items-end gap-3" data-tour={tourAttr}>
      {open && actions.map((a, i) => (
        <div key={i} className="flex items-center gap-3 animate-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 50}ms` }}>
          <span className="text-[11px] font-black text-white bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10 whitespace-nowrap">{a.label}</span>
          <button
            onClick={() => { a.onClick(); setOpen(false); }}
            className={`w-11 h-11 ${a.color} rounded-2xl flex items-center justify-center text-white shadow-lg hover:scale-110 transition-all`}
          >
            {a.icon}
          </button>
        </div>
      ))}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-2xl bg-neo-neon flex items-center justify-center text-white shadow-neo-glow transition-all hover:scale-110 ${open ? 'rotate-45' : ''}`}
        style={{ boxShadow: '0 0 30px rgba(88,95,216,0.6)' }}
      >
        {open ? <X size={24}/> : <Zap size={24}/>}
      </button>
    </div>
  );
};

// ─── ONBOARDING FEATURE BANNER ────────────────────────────────────────────────
const BetaBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('qc_beta_banner') === 'true'; } catch { return false; }
  });

  if (dismissed) return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-[150] md:left-auto md:right-6 md:w-80 animate-in slide-in-from-top duration-500">
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0d0d1a] border border-neo-neon/30 rounded-2xl p-4 shadow-neo-glow">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black bg-neo-neon text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Beta v1.0</span>
            <Sparkles size={14} className="text-neo-pink"/>
          </div>
          <button onClick={() => { localStorage.setItem('qc_beta_banner', 'true'); setDismissed(true); }} className="text-gray-500 hover:text-white">
            <X size={14}/>
          </button>
        </div>
        <p className="font-black text-white text-sm mb-1">Welcome to Public Beta! 🚀</p>
        <p className="text-[11px] text-gray-400 leading-relaxed">AI valuations · Market Pulse · ROI Simulator · Deal Scoring · Watchlist. India's most intelligent property platform.</p>
        <div className="flex items-center gap-2 mt-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
          <span className="text-[10px] text-emerald-400 font-semibold">All systems live</span>
        </div>
      </div>
    </div>
  );
};

// ─── PROGRESS INDICATOR ───────────────────────────────────────────────────────
const AILoadingOverlay: React.FC<{ mode: AppMode }> = ({ mode }) => {
  const [step, setStep] = useState(0);
  const steps = [
    '🔍 Scanning micro-market data...',
    '🧠 Feeding AI intelligence layer...',
    '📊 Analyzing comparable transactions...',
    '🗺️ Running location scoring...',
    '⚡ Computing deal score...',
    '✅ Generating your valuation report...',
  ];

  useEffect(() => {
    const interval = setInterval(() => setStep(s => (s + 1) % steps.length), 1800);
    return () => clearInterval(interval);
  }, []);

  const modeColor = mode === 'buy' ? 'text-neo-neon' : mode === 'rent' ? 'text-emerald-400' : mode === 'land' ? 'text-orange-400' : 'text-purple-400';

  return (
    <div className="fixed inset-0 z-[250] bg-neo-bg/95 backdrop-blur-2xl flex flex-col items-center justify-center">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center">
          <Cpu size={40} className={`${modeColor} animate-pulse`}/>
        </div>
        <div className="absolute inset-0 rounded-[32px] border-2 border-neo-neon/30 animate-ping"/>
      </div>
      <div className="mb-2 text-center">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">AI Analyzing...</h2>
        <p className={`text-sm font-semibold ${modeColor} transition-all duration-500`}>{steps[step]}</p>
      </div>
      <div className="w-64 h-1 bg-white/5 rounded-full mt-6 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1800 ${mode === 'buy' ? 'bg-neo-neon' : mode === 'rent' ? 'bg-emerald-400' : 'bg-orange-400'}`}
          style={{ width: `${((step + 1) / steps.length) * 100}%`, boxShadow: `0 0 12px currentColor` }}
        />
      </div>
      <p className="text-[11px] text-gray-600 uppercase tracking-widest mt-6 font-semibold">
        Powered by Gemini AI · RERA data · Satellite analysis
      </p>
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const [stage, setStage] = useState<'gate' | 'onboarding' | 'chat' | 'results' | 'privacy'>('gate');
  const [mode, setMode] = useState<AppMode>('buy');
  const [lang, setLang] = useState<AppLang>('EN');
  const [isLoading, setIsLoading] = useState(false);
  const [showFinance, setShowFinance] = useState(false);
  const [financeTab, setFinanceTab] = useState<'calc' | 'approval'>('calc');
  const [showQuickCalc, setShowQuickCalc] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [searchNotification, setSearchNotification] = useState<string | null>(null);

  // ── NEW STATE ──
  const [showROI, setShowROI] = useState(false);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [showMarketPulse, setShowMarketPulse] = useState(false);
  const [showSmartSearch, setShowSmartSearch] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('qc_watchlist') || '[]'); } catch { return []; }
  });
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'info' | 'warning' }>>([]);
  const [dealScore, setDealScore] = useState<number | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [showAlertPanel, setShowAlertPanel] = useState(false);

  // Price alerts hook
  const { unreadCount, checkPrice, alerts } = usePriceAlerts();

  const [buyData, setBuyData] = useState<BuyResult | null>(null);
  const [rentData, setRentData] = useState<RentResult | null>(null);
  const [landData, setLandData] = useState<any | null>(null);
  const [commercialData, setCommercialData] = useState<CommercialResult | null>(null);
  const [userBudget, setUserBudget] = useState<number | undefined>(undefined);
  const [locationContext, setLocationContext] = useState({ city: '', area: '', pincode: '' });
  const [commercialMeta, setCommercialMeta] = useState({ type: 'Shop' as 'Shop' | 'Office' | 'Warehouse', sqft: 0 });

  // Persist watchlist
  useEffect(() => {
    try { localStorage.setItem('qc_watchlist', JSON.stringify(watchlist)); } catch {}
  }, [watchlist]);

  // Show consent modal
  useEffect(() => {
    const consent = localStorage.getItem('quantcasa_dpdp_consent');
    if (!consent) setShowConsentModal(true);
  }, []);

  // Show tour for first-time users when they reach results
  useEffect(() => {
    if (stage === 'results') {
      const tourDone = localStorage.getItem('qc_tour_done');
      if (!tourDone) {
        const t = setTimeout(() => setShowTour(true), 800);
        return () => clearTimeout(t);
      }
    }
  }, [stage]);

  // ── HELPERS ──
  const addToast = useCallback((message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const computeDealScore = (data: BuyResult | RentResult | null, mode: AppMode): number => {
    if (!data) return Math.floor(40 + Math.random() * 30);
    const conf = 'confidenceScore' in data ? data.confidenceScore || 70 : 70;
    const rec = 'recommendation' in data ? data.recommendation : '';
    let base = conf;
    if (rec === 'Good Buy') base = Math.min(100, base + 15);
    if (rec === 'Fair Price') base = Math.min(100, base + 5);
    if (rec === 'Overpriced') base = Math.max(20, base - 20);
    return Math.round(Math.min(98, Math.max(15, base)));
  };

  const addToWatchlist = useCallback(() => {
    const price = mode === 'buy' && buyData ? buyData.fairValue :
                  mode === 'rent' && rentData ? rentData.rentalValue : '—';
    const newItem: WatchlistItem = {
      id: Math.random().toString(36).slice(2),
      city: locationContext.city,
      area: locationContext.area || 'Unknown area',
      bhk: mode === 'buy' ? (buyData as any)?.bhk || '2 BHK' :
           mode === 'rent' ? (rentData as any)?.bhk || '2 BHK' : '—',
      price,
      mode,
      addedAt: Date.now(),
      dealScore: dealScore || 65,
      trend: Math.random() > 0.6 ? 'up' : Math.random() > 0.5 ? 'stable' : 'down',
    };
    setWatchlist(prev => [newItem, ...prev.slice(0, 19)]);
    addToast(`✅ Property saved to watchlist! Deal Score: ${newItem.dealScore}/100`, 'success');
  }, [mode, buyData, rentData, locationContext, dealScore, addToast]);

  const handleConsent = () => {
    localStorage.setItem('quantcasa_dpdp_consent', 'true');
    setShowConsentModal(false);
  };

  const startAnalysis = (selectedMode: AppMode, selectedLang: AppLang) => {
    setMode(selectedMode);
    setLang(selectedLang);
    setStage('chat');
    setSearchNotification(null);
    setDealScore(null);
  };

  const handleComplete = async (data: any) => {
    setIsLoading(true);
    if (data.city) setLocationContext({ city: data.city, area: data.area || '', pincode: data.pincode || '' });
    if (data.budget) setUserBudget(Number(data.budget));

    if (mode === 'essentials') {
      setIsLoading(false);
      setStage('results');
      return;
    }
    try {
      if (mode === 'buy') {
        const result = await getBuyAnalysis(data as BuyRequest);
        if (result.source === 'radius_expansion') {
          setSearchNotification("Local listings sparse. Search expanded to 5km micro-market.");
          addToast('📡 Search radius expanded to find best comparables', 'info');
        }
        setBuyData(result);
        const score = computeDealScore(result, 'buy');
        setDealScore(score);
        // Check price alerts
        const price = parseAlertPrice(result.fairValue);
        const hits = checkPrice(data.city, data.area || '', 'buy', price);
        if (hits.some(h => h.triggered)) addToast('🔔 A price alert was triggered! Check your alerts.', 'warning');
      } else if (mode === 'rent') {
        const result = await getRentAnalysis(data as RentRequest);
        setRentData(result);
        const score = computeDealScore(result, 'rent');
        setDealScore(score);
        const price = parseAlertPrice(result.rentalValue);
        const hits = checkPrice(data.city, data.area || '', 'rent', price);
        if (hits.some(h => h.triggered)) addToast('🔔 A price alert was triggered! Check your alerts.', 'warning');
      } else if (mode === 'land') {
        const result = await getLandValuationAnalysis(data as LandRequest);
        setLandData(result);
        setDealScore(Math.floor(50 + Math.random() * 35));
      } else if (mode === 'commercial') {
        setCommercialMeta({ type: data.type, sqft: data.sqft });
        const result = await getCommercialAnalysis(data as CommercialRequest);
        setCommercialData(result);
        setDealScore(Math.floor(55 + Math.random() * 30));
      }
      setStage('results');
      addToast('🎯 AI analysis complete! View your valuation report.', 'success');
    } catch (err: any) {
      console.error(err);
      addToast('⚠️ Analysis failed — attempting fallback intelligence.', 'warning');
      alert(err.message || "Intelligence node timeout. Attempting macro-market fallback...");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitialFinanceValue = (): number => {
    if (mode === 'buy' && buyData) return parsePrice(buyData.fairValue);
    if (mode === 'rent' && rentData) return parsePrice(rentData.rentalValue);
    if (mode === 'land' && landData) return parsePrice(landData.landValue);
    if (mode === 'commercial' && commercialData) return parsePrice(commercialData.fairValue);
    return 10000000;
  };

  const handleReset = () => {
    setStage('onboarding');
    setBuyData(null);
    setRentData(null);
    setLandData(null);
    setCommercialData(null);
    setShowFinance(false);
    setShowQuickCalc(false);
    setUserBudget(undefined);
    setLocationContext({ city: '', area: '', pincode: '' });
    setDealScore(null);
  };

  const handleSmartSearch = (query: string) => {
    setShowSmartSearch(false);
    addToast(`🔍 Smart search: "${query}" — Use the mode selector to begin`, 'info');
  };

  // ─── RENDER GATES ──────────────────────────────────────────────────────────
  if (stage === 'gate') return <HeroGate onEnter={() => setStage('onboarding')} />;
  if (stage === 'privacy') return <PrivacyPolicy onBack={() => setStage('onboarding')} />;
  if (stage === 'onboarding') {
    return (
      <>
        <Onboarding onComplete={startAnalysis} />
        {showConsentModal && <DPDPModal onAccept={handleConsent} onReadMore={() => setStage('privacy')} />}
      </>
    );
  }

  // ─── MAIN APP SHELL ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-neo-bg text-white flex flex-col font-sans selection:bg-neo-neon/40 overflow-x-hidden">

      {/* ── HEADER ── */}
      <header className="px-6 md:px-10 py-4 border-b border-white/5 bg-neo-glass/60 backdrop-blur-2xl sticky top-0 z-[100] flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={handleReset}>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white shadow-neo-glow transition-all group-hover:rotate-12 group-hover:scale-110 group-hover:border-neo-neon/50">
            <Logo size={28} />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-black text-xl md:text-2xl text-white tracking-tighter leading-none">QuantCasa</h1>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black text-neo-neon uppercase tracking-[0.35em] opacity-80">INTELLIGENCE_LAYER_V5.3</span>
              <span className="text-[8px] font-black bg-neo-neon/20 text-neo-neon px-1.5 py-0.5 rounded-full uppercase tracking-wider">BETA</span>
            </div>
          </div>
        </div>

        {/* Deal score badge in header when results shown */}
        {stage === 'results' && dealScore !== null && (
          <div data-tour="deal-score" className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
            <DealScoreRing score={dealScore} size="sm"/>
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Deal Score</p>
              <p className="text-xs font-black text-white">AI Confidence Rating</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 md:gap-3">
          {/* Smart Search */}
          <button
            onClick={() => setShowSmartSearch(true)}
            className="hidden md:flex w-10 h-10 rounded-2xl bg-white/5 items-center justify-center text-gray-400 hover:text-white transition-all border border-white/10 hover:border-neo-neon/40"
            title="Smart Search"
          >
            <Search size={18}/>
          </button>

          {/* Market Pulse */}
          <button
            onClick={() => setShowMarketPulse(true)}
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/5 text-gray-400 hover:text-white transition-all border border-white/10 hover:border-orange-400/40 text-[11px] font-black uppercase tracking-wider"
          >
            <div className="relative flex items-center">
              <Activity size={15} className="text-orange-400"/>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-ping"/>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full"/>
            </div>
            <span className="hidden lg:block">Live Pulse</span>
          </button>

          {/* Watchlist */}
          <button
            data-tour="watchlist-btn"
            onClick={() => setShowWatchlist(true)}
            className="relative w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all border border-white/10 hover:border-purple-400/40"
          >
            <Bookmark size={18}/>
            {watchlist.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-neo-neon text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {watchlist.length > 9 ? '9+' : watchlist.length}
              </span>
            )}
          </button>

          {/* Save to watchlist (only in results) */}
          {stage === 'results' && (locationContext.city) && (
            <button
              onClick={addToWatchlist}
              className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all border border-emerald-500/20 text-[11px] font-black uppercase tracking-wider"
              title="Save to Watchlist"
            >
              <BookmarkPlus size={15}/>
              <span className="hidden md:block">Save</span>
            </button>
          )}

          {/* Price Alerts bell */}
          <button
            data-tour="alerts-btn"
            onClick={() => setShowAlertPanel(true)}
            className="relative w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all border border-white/10 hover:border-orange-400/40"
            title="Price Alerts"
          >
            <Bell size={18}/>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowTour(true)}
            className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-2xl bg-neo-neon/10 text-neo-neon hover:bg-neo-neon/20 transition-all border border-neo-neon/20 text-[11px] font-black uppercase tracking-wider"
            title="Take the Feature Tour"
          >
            <Sparkles size={13}/>
            Tour
          </button>

          {/* About */}
          <button
            onClick={() => setShowAbout(true)}
            className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all border border-white/10"
          >
            <Info size={18}/>
          </button>

          {/* Back */}
          {stage === 'results' && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 text-gray-400 hover:text-white transition-all border border-white/10 text-[11px] font-black uppercase tracking-wider hover:border-white/20"
            >
              <RefreshCw size={15}/>
              <span className="hidden sm:block">New</span>
            </button>
          )}
        </div>
      </header>

      {/* ── MARKET TICKER ── */}
      <div data-tour="ticker">
        <MarketTicker/>
      </div>

      {/* ── SEARCH NOTIFICATION ── */}
      {searchNotification && (
        <div className="mx-4 mt-4 md:mx-10 p-3 rounded-2xl bg-yellow-500/5 border border-yellow-500/20 flex items-center gap-3 text-xs text-yellow-400 font-semibold">
          <Navigation size={14}/>
          {searchNotification}
          <button onClick={() => setSearchNotification(null)} className="ml-auto text-yellow-400/50 hover:text-yellow-400">
            <X size={14}/>
          </button>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex">
        {/* Left sidebar: deal score + quick actions in results view */}
        {stage === 'results' && dealScore !== null && (
          <aside className="hidden xl:flex w-72 border-r border-white/5 flex-col p-6 gap-5 bg-black/10 shrink-0">
            {/* Deal Score */}
            <div className="p-5 rounded-3xl bg-white/3 border border-white/5">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 text-center">AI Deal Score</p>
              <div className="flex justify-center mb-3">
                <DealScoreRing score={dealScore} size="lg"/>
              </div>
              <p className="text-[11px] text-gray-500 text-center leading-relaxed">
                {dealScore >= 80 ? '🔥 Strong buy signal. Act fast.' :
                 dealScore >= 65 ? '✅ Solid deal. Good entry point.' :
                 dealScore >= 50 ? '⚡ Fair pricing. Negotiate down.' :
                 '⚠️ Overpriced signals detected. Review.'}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Quick Actions</p>
              {[
                { icon: <PieChart size={16}/>, label: 'ROI Simulator', color: 'text-emerald-400', action: () => setShowROI(true) },
                { icon: <BarChart3 size={16}/>, label: 'Fiscal Simulator', color: 'text-neo-neon', action: () => { setFinanceTab('calc'); setShowFinance(true); } },
                { icon: <Shield size={16}/>, label: 'AI Loan Check', color: 'text-purple-400', action: () => { setFinanceTab('approval'); setShowFinance(true); } },
                { icon: <BookmarkPlus size={16}/>, label: 'Save Property', color: 'text-yellow-400', action: addToWatchlist },
              ].map(a => (
                <button
                  key={a.label}
                  onClick={a.action}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/3 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all group"
                >
                  <span className={a.color}>{a.icon}</span>
                  <span className="text-[12px] font-semibold text-gray-400 group-hover:text-white transition-colors">{a.label}</span>
                  <ChevronRight size={14} className="ml-auto text-gray-600 group-hover:text-gray-400 transition-colors"/>
                </button>
              ))}
            </div>

            {/* Market tip */}
            <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-yellow-500/5 to-transparent border border-yellow-500/10">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={14} className="text-yellow-400"/>
                <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Pro Tip</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                {DEAL_TIPS[Math.floor(Date.now() / 60000) % DEAL_TIPS.length].tip}
              </p>
            </div>
          </aside>
        )}

        {/* Chat / Results area */}
        <div className="flex-1 flex overflow-hidden">
          {stage === 'chat' && (
            <ChatInterface
              mode={mode}
              lang={lang}
              onComplete={handleComplete}
              onBack={() => setStage('onboarding')}
            />
          )}

          {stage === 'results' && (
            <div className="flex-1 overflow-y-auto">
              {mode === 'buy' && (
                buyData ? (
                  <BuyDashboard
                    result={buyData}
                    lang={lang}
                    userBudget={userBudget}
                    onAnalyzeFinance={() => { setFinanceTab('calc'); setShowFinance(true); }}
                    city={locationContext.city}
                    area={locationContext.area}
                  />
                ) : (
                  <EmptyState mode="buy" onStart={() => setStage('chat')} />
                )
              )}

              {mode === 'rent' && (
                rentData ? (
                  <RentDashboard
                    result={rentData}
                    lang={lang}
                    userBudget={userBudget}
                    onAnalyzeFinance={() => { setFinanceTab('calc'); setShowFinance(true); }}
                    city={locationContext.city}
                    area={locationContext.area}
                  />
                ) : (
                  <EmptyState mode="rent" onStart={() => setStage('chat')} />
                )
              )}

              {mode === 'land' && (
                landData ? (
                  <LandReport
                    result={landData}
                    lang={lang}
                    onAnalyzeFinance={() => { setFinanceTab('calc'); setShowFinance(true); }}
                    city={locationContext.city}
                    area={locationContext.area}
                  />
                ) : (
                  <EmptyState mode="land" onStart={() => setStage('chat')} />
                )
              )}

              {mode === 'commercial' && (
                commercialData ? (
                  <CommercialDashboard
                    result={commercialData}
                    lang={lang}
                    onAnalyzeFinance={() => { setFinanceTab('calc'); setShowFinance(true); }}
                    city={locationContext.city}
                    area={locationContext.area}
                    pincode={locationContext.pincode}
                    initialType={commercialMeta.type}
                    initialSqft={commercialMeta.sqft}
                  />
                ) : (
                  <EmptyState mode="commercial" onStart={() => setStage('chat')} />
                )
              )}

              {mode === 'harmony' && <HarmonyDashboard lang={lang} />}
              {mode === 'essentials' && <EssentialsDashboard city={locationContext.city} area={locationContext.area} />}
              {mode === 'expert' && <PropertyChat lang={lang} />}
            </div>
          )}
        </div>
      </main>

      {/* ── FINANCE MODAL ── */}
      {showFinance && (
        <div className="fixed inset-0 z-[200] bg-neo-bg/90 backdrop-blur-2xl flex items-center justify-center p-4 md:p-6 animate-in fade-in zoom-in duration-300">
          <div className="w-full max-w-5xl max-h-[90vh] bg-neo-bg border border-white/10 rounded-[40px] md:rounded-[64px] p-6 md:p-16 overflow-y-auto relative shadow-neo-glow">
            <button onClick={() => setShowFinance(false)} className="absolute top-6 right-6 md:top-10 md:right-10 p-3 bg-white/5 rounded-2xl hover:bg-neo-pink hover:text-white transition-all text-gray-500">
              <X size={22}/>
            </button>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 md:mb-12">
              <div className="flex items-center gap-4">
                <BarChart3 className="text-neo-neon" size={28}/>
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase">Fiscal Simulator</h2>
              </div>
              <div className="bg-white/5 p-1.5 rounded-2xl border border-white/10 flex gap-2">
                <button
                  onClick={() => setFinanceTab('calc')}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${financeTab === 'calc' ? 'bg-neo-neon text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}
                >
                  Calculator
                </button>
                <button
                  onClick={() => setFinanceTab('approval')}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${financeTab === 'approval' ? 'bg-neo-neon text-white shadow-neo-glow' : 'text-gray-400 hover:text-white'}`}
                >
                  <Shield size={12}/> AI Approval
                </button>
              </div>
            </div>
            {financeTab === 'calc' ? (
              <LoanCalculator initialValue={getInitialFinanceValue()} mode={mode} />
            ) : (
              <LoanApprovalAIScreen fairValuePrice={getInitialFinanceValue()} />
            )}
          </div>
        </div>
      )}

      {/* ── ROI CALCULATOR ── */}
      {showROI && (
        <ROICalculator initialPrice={getInitialFinanceValue()} onClose={() => setShowROI(false)} />
      )}

      {/* ── WATCHLIST ── */}
      {showWatchlist && (
        <WatchlistPanel
          items={watchlist}
          onRemove={id => setWatchlist(prev => prev.filter(w => w.id !== id))}
          onClose={() => setShowWatchlist(false)}
        />
      )}

      {/* ── MARKET PULSE ── */}
      {showMarketPulse && <MarketPulsePanel onClose={() => setShowMarketPulse(false)} />}

      {/* ── SMART SEARCH ── */}
      {showSmartSearch && (
        <SmartSearchBar onSearch={handleSmartSearch} onClose={() => setShowSmartSearch(false)} />
      )}

      {/* ── AI LOADING OVERLAY ── */}
      {isLoading && <AILoadingOverlay mode={mode} />}

      {/* ── BETA BANNER ── */}
      {stage === 'results' && <BetaBanner />}

      {/* ── PRICE ALERT PANEL ── */}
      {showAlertPanel && (
        <PriceAlertPanel
          onClose={() => setShowAlertPanel(false)}
          prefill={locationContext.city ? {
            city: locationContext.city,
            area: locationContext.area,
            mode: mode as any,
            currentPrice: getInitialFinanceValue(),
            label: `${mode === 'buy' ? 'Buy' : mode === 'rent' ? 'Rent' : 'Land'} · ${locationContext.area || locationContext.city}`,
          } : undefined}
        />
      )}

      {/* ── ONBOARDING TOUR ── */}
      {showTour && (
        <OnboardingTour
          onComplete={() => { setShowTour(false); addToast('🎉 Tour complete! You\'re ready to find your perfect property.', 'success'); }}
          onSkip={() => setShowTour(false)}
        />
      )}

      {/* ── FEEDBACK MODAL ── */}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {showConsentModal && stage === 'results' && (
        <DPDPModal onAccept={handleConsent} onReadMore={() => setStage('privacy')} />
      )}

      {/* ── FLOATING ACTIONS ── */}
      <FloatingActions
        onROI={() => setShowROI(true)}
        onWatchlist={() => setShowWatchlist(true)}
        onPulse={() => setShowMarketPulse(true)}
        onSearch={() => setShowSmartSearch(true)}
        watchlistCount={watchlist.length}
        tourAttr="fab"
      />

      {/* ── TOAST NOTIFICATIONS ── */}
      <div className="fixed bottom-24 right-6 z-[500] flex flex-col gap-2 items-end">
        {toasts.map(t => (
          <AlertToast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>

      {/* ── FOOTER ── */}
      <footer className="p-6 md:p-10 text-center border-t border-white/5 bg-neo-glass/20 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 opacity-40 mb-4">
          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"><ShieldCheck size={14} className="text-neo-neon"/> Secure</div>
          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"><Sparkles size={14} className="text-neo-pink"/> AI_Grounded</div>
          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"><Navigation size={14} className="text-neo-gold"/> Live_Maps</div>
          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"><BrainCircuit size={14} className="text-purple-400"/> Gemini_AI</div>
          <button onClick={() => setStage('privacy')} className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase hover:text-white transition-colors hover:opacity-100">
            <Shield size={14} className="text-neo-neon"/> Privacy
          </button>
          <button onClick={() => setShowFeedback(true)} className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase hover:text-white transition-colors hover:opacity-100">
            <Star size={14} className="text-yellow-400"/> Feedback
          </button>
        </div>
        <div className="text-[10px] font-black tracking-widest uppercase opacity-30">
          © 2025 QUANTCASA LABS · India's #1 AI Property Intelligence Platform
        </div>
      </footer>
    </div>
  );
};

// ─── EMPTY STATE COMPONENT ────────────────────────────────────────────────────
const EmptyState: React.FC<{ mode: AppMode; onStart: () => void }> = ({ mode, onStart }) => {
  const config = {
    buy: { emoji: '🏠', title: 'No Buy Data', desc: 'Complete the buy analysis to see results', color: 'bg-neo-neon', gradient: 'from-neo-neon/10' },
    rent: { emoji: '🔑', title: 'No Rental Data', desc: 'Complete the rental analysis to see results', color: 'bg-emerald-500', gradient: 'from-emerald-500/10' },
    land: { emoji: '🌍', title: 'No Land Data', desc: 'Complete the land valuation to see results', color: 'bg-orange-500', gradient: 'from-orange-500/10' },
    commercial: { emoji: '🏢', title: 'No Commercial Data', desc: 'Complete the commercial analysis to see results', color: 'bg-purple-500', gradient: 'from-purple-500/10' },
    expert: { emoji: '🤖', title: 'No Expert Data', desc: '', color: 'bg-neo-neon', gradient: 'from-neo-neon/10' },
    harmony: { emoji: '🧘', title: 'No Harmony Data', desc: '', color: 'bg-neo-neon', gradient: 'from-neo-neon/10' },
    essentials: { emoji: '📍', title: 'No Essentials Data', desc: '', color: 'bg-neo-neon', gradient: 'from-neo-neon/10' },
  }[mode];

  return (
    <div className={`flex flex-col items-center justify-center h-full gap-6 text-center p-12 bg-gradient-to-b ${config.gradient} to-transparent`}>
      <div className="text-6xl">{config.emoji}</div>
      <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{config.title}</h2>
      <p className="text-gray-400 text-sm max-w-xs">{config.desc}</p>
      <button
        onClick={onStart}
        className={`px-8 py-4 ${config.color} text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-neo-glow hover:scale-105 transition-all`}
      >
        Start Analysis
      </button>
    </div>
  );
};

export default App;
