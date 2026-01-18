import React, { useState, useEffect } from 'react';
import { AppMode, AppLang } from '../types';
import {
  Loader2,
  MapPin,
  DollarSign,
  Home,
  Building2,
  Sparkles,
  Search,
} from 'lucide-react';

interface ChatInterfaceProps {
  mode: AppMode;
  lang: AppLang;
  onComplete: (data: any) => void;
  isLoading: boolean;
}

/* Cities stay as UX anchors (NOT data limits) */
const TOP_CITIES = [
  { id: 'mumbai', name: 'Mumbai' },
  { id: 'delhi', name: 'Delhi' },
  { id: 'bangalore', name: 'Bangalore' },
  { id: 'pune', name: 'Pune' },
  { id: 'hyderabad', name: 'Hyderabad' },
  { id: 'chennai', name: 'Chennai' },
  { id: 'kolkata', name: 'Kolkata' },
];

const BUDGET_RANGES = {
  buy: [
    { label: '₹20L - ₹50L', min: 2000000, max: 5000000 },
    { label: '₹50L - ₹1Cr', min: 5000000, max: 10000000 },
    { label: '₹1Cr - ₹2Cr', min: 10000000, max: 20000000 },
    { label: '₹2Cr - ₹5Cr', min: 20000000, max: 50000000 },
    { label: '₹5Cr+', min: 50000000, max: 100000000 },
  ],
  rent: [
    { label: '₹10K - ₹25K', min: 10000, max: 25000 },
    { label: '₹25K - ₹50K', min: 25000, max: 50000 },
    { label: '₹50K - ₹1L', min: 50000, max: 100000 },
    { label: '₹1L - ₹2L', min: 100000, max: 200000 },
    { label: '₹2L+', min: 200000, max: 500000 },
  ],
  land: [
    { label: '₹50L - ₹1Cr', min: 5000000, max: 10000000 },
    { label: '₹1Cr - ₹3Cr', min: 10000000, max: 30000000 },
    { label: '₹3Cr - ₹5Cr', min: 30000000, max: 50000000 },
    { label: '₹5Cr+', min: 50000000, max: 100000000 },
  ],
  commercial: [
    { label: '₹50L - ₹1Cr', min: 5000000, max: 10000000 },
    { label: '₹1Cr - ₹5Cr', min: 10000000, max: 50000000 },
    { label: '₹5Cr - ₹10Cr', min: 50000000, max: 100000000 },
    { label: '₹10Cr+', min: 100000000, max: 500000000 },
  ],
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  mode,
  lang,
  onComplete,
  isLoading,
}) => {
  const [step, setStep] = useState(0);
  const [selectedCity, setSelectedCity] = useState('');
  const [areaQuery, setAreaQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [areaSuggestions, setAreaSuggestions] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState<any>(null);

  const [bhk, setBhk] = useState('2 BHK');
  const [sqft, setSqft] = useState('1000');
  const [plotSize, setPlotSize] = useState('100');
  const [commercialType, setCommercialType] =
    useState<'Shop' | 'Office' | 'Warehouse'>('Office');

  const currentCity = TOP_CITIES.find((c) => c.id === selectedCity);
  const budgetOptions =
    BUDGET_RANGES[mode as keyof typeof BUDGET_RANGES];

  /* 🔥 Web-only dynamic area autocomplete */
  useEffect(() => {
    if (areaQuery.length < 3 || !currentCity) {
      setAreaSuggestions([]);
      return;
    }

    const controller = new AbortController();

    const fetchAreas = async () => {
      try {
        const res = await fetch(
          `/api/location-autocomplete?q=${encodeURIComponent(
            `${areaQuery}, ${currentCity.name}`
          )}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setAreaSuggestions(data.suggestions || []);
      } catch {
        setAreaSuggestions([]);
      }
    };

    fetchAreas();
    return () => controller.abort();
  }, [areaQuery, selectedCity]);

  const handleSubmit = () => {
    const payload: any = {
      city: currentCity?.name,
      area: selectedArea,
      localitySource: 'web-only',
      budget: budgetRange?.max,
    };

    if (mode === 'buy' || mode === 'rent') {
      payload.bhk = bhk;
      payload.sqft = parseInt(sqft);
    }

    if (mode === 'land') {
      payload.plotSize = parseInt(plotSize);
    }

    if (mode === 'commercial') {
      payload.type = commercialType;
      payload.sqft = parseInt(sqft);
      payload.intent = 'Buy';
    }

    onComplete(payload);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white/5 backdrop-blur-xl rounded-[32px] border border-white/10 p-8 shadow-neo-glow">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-neo-neon/10 rounded-2xl text-neo-neon">
          {mode === 'buy' && <Home size={24} />}
          {mode === 'rent' && <Building2 size={24} />}
          {mode === 'land' && <MapPin size={24} />}
          {mode === 'commercial' && <Building2 size={24} />}
        </div>
        <div>
          <h2 className="text-2xl font-black text-white uppercase">
            {mode} property
          </h2>
          <p className="text-[10px] text-gray-500 uppercase font-black">
            Step {step + 1} of 4
          </p>
        </div>
      </div>

      {/* STEP 0 – CITY */}
      {step === 0 && (
        <div className="grid grid-cols-2 gap-3">
          {TOP_CITIES.map((city) => (
            <button
              key={city.id}
              onClick={() => {
                setSelectedCity(city.id);
                setStep(1);
              }}
              className="p-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-neo-neon/10"
            >
              <MapPin size={16} className="text-neo-neon mb-2" />
              <div className="text-sm font-black text-white">
                {city.name}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* STEP 1 – AREA (DYNAMIC) */}
      {step === 1 && currentCity && (
        <div className="space-y-4">
          <input
            value={areaQuery}
            onChange={(e) => setAreaQuery(e.target.value)}
            placeholder={`Search any locality in ${currentCity.name}`}
            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none"
          />

          {areaSuggestions.length > 0 && (
            <div className="bg-black/90 border border-white/10 rounded-2xl">
              {areaSuggestions.map((area) => (
                <button
                  key={area}
                  onClick={() => {
                    setSelectedArea(area);
                    setStep(2);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-200 hover:bg-white/10"
                >
                  {area}
                </button>
              ))}
            </div>
          )}

          {areaQuery.length > 2 && (
            <button
              onClick={() => {
                setSelectedArea(areaQuery);
                setStep(2);
              }}
              className="w-full py-3 bg-neo-neon/20 rounded-xl font-black text-xs uppercase"
            >
              Use “{areaQuery}”
            </button>
          )}
        </div>
      )}

      {/* STEP 2 – BUDGET */}
      {step === 2 && (
        <div className="space-y-2">
          {budgetOptions.map((range: any, idx: number) => (
            <button
              key={idx}
              onClick={() => {
                setBudgetRange(range);
                setStep(3);
              }}
              className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl flex justify-between"
            >
              <span className="text-sm font-black text-white">
                {range.label}
              </span>
              <DollarSign size={16} className="text-neo-gold" />
            </button>
          ))}
        </div>
      )}

      {/* STEP 3 – DETAILS */}
      {step === 3 && (
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full py-4 bg-neo-neon rounded-2xl font-black uppercase text-xs flex justify-center gap-3"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" /> Analyzing
            </>
          ) : (
            <>
              <Sparkles /> Start Analysis
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default ChatInterface;
