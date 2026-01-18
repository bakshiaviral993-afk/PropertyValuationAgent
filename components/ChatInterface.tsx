import React, { useState, useEffect } from 'react';
import { Loader2, MapPin, Home, Building2, Sparkles } from 'lucide-react';

type AppMode = 'buy' | 'rent' | 'land' | 'commercial';
type AppLang = 'EN' | 'HI';

interface ChatInterfaceProps {
  mode: AppMode;
  lang: AppLang;
  onComplete: (data: any) => void;
  isLoading: boolean;
}

const TOP_CITIES = [
  { id: 'mumbai', name: 'Mumbai', areas: ['Andheri', 'Bandra', 'Juhu', 'Powai', 'Worli', 'Lower Parel', 'Malabar Hill', 'Colaba', 'Marine Drive'] },
  { id: 'pune', name: 'Pune', areas: ['Kharadi', 'Hinjewadi', 'Wakad', 'Baner', 'Aundh', 'Koregaon Park', 'Wagholi', 'Pimpri', 'Chinchwad'] },
  { id: 'bangalore', name: 'Bangalore', areas: ['Whitefield', 'Koramangala', 'HSR Layout', 'Electronic City', 'Indiranagar', 'Marathahalli', 'JP Nagar'] },
  { id: 'delhi', name: 'Delhi', areas: ['Dwarka', 'Rohini', 'Connaught Place', 'Saket', 'Vasant Kunj', 'Greater Kailash', 'Nehru Place'] },
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
    { label: '₹1Cr - ₹3Cr', min: 10000000, max: 30000000 },
    { label: '₹3Cr - ₹5Cr', min: 30000000, max: 50000000 },
    { label: '₹5Cr+', min: 50000000, max: 100000000 },
  ],
};

const PINCODE_MAP: Record<string, Record<string, string>> = {
  mumbai: {
    'Andheri': '400053',
    'Bandra': '400050',
    'Juhu': '400049',
    'Powai': '400076',
    'Worli': '400018',
    'Lower Parel': '400013',
    'Malabar Hill': '400006',
    'Colaba': '400005',
    'Marine Drive': '400020'
  },
  pune: {
    'Kharadi': '411014',
    'Hinjewadi': '411057',
    'Wakad': '411057',
    'Baner': '411045',
    'Aundh': '411007',
    'Koregaon Park': '411001',
    'Wagholi': '412207',
    'Pimpri': '411018',
    'Chinchwad': '411019'
  },
  bangalore: {
    'Whitefield': '560066',
    'Koramangala': '560034',
    'HSR Layout': '560102',
    'Electronic City': '560100',
    'Indiranagar': '560038',
    'Marathahalli': '560037',
    'JP Nagar': '560078'
  },
  delhi: {
    'Dwarka': '110075',
    'Rohini': '110085',
    'Connaught Place': '110001',
    'Saket': '110017',
    'Vasant Kunj': '110070',
    'Greater Kailash': '110048',
    'Nehru Place': '110019'
  }
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ mode = 'buy', lang = 'EN', onComplete, isLoading }) => {
  const [step, setStep] = useState(0);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');
  const [budgetRange, setBudgetRange] = useState<any>(null);
  const [bhk, setBhk] = useState<string>('2 BHK');
  const [sqft, setSqft] = useState<string>('1000');
  const [plotSize, setPlotSize] = useState<string>('1000');
  const [facing, setFacing] = useState<string>('East');
  const [commercialType, setCommercialType] = useState<'Shop' | 'Office' | 'Warehouse'>('Office');

  const currentCity = TOP_CITIES.find(c => c.id === selectedCity);
  const budgetOptions = BUDGET_RANGES[mode] || BUDGET_RANGES.buy;

  // Get mode display name safely
  const getModeDisplayName = () => {
    if (!mode || typeof mode !== 'string') return 'Buy';
    return mode.charAt(0).toUpperCase() + mode.slice(1);
  };

  useEffect(() => {
    setStep(0);
    setSelectedCity('');
    setSelectedArea('');
    setPincode('');
    setBudgetRange(null);
    setBhk('2 BHK');
    setSqft('1000');
    setPlotSize('1000');
    setFacing('East');
  }, [mode]);

  const handleCitySelect = (cityId: string) => {
    setSelectedCity(cityId);
    setSelectedArea('');
    setPincode('');
    setStep(1);
  };

  const handleAreaSelect = (area: string) => {
    setSelectedArea(area);

    // Auto-populate pincode based on city and area
    const pinMap = PINCODE_MAP[selectedCity];
    if (pinMap && pinMap[area]) {
      setPincode(pinMap[area]);
    } else {
      // Fallback: generate realistic pincode
      const basePincodeMap: Record<string, string> = {
        mumbai: '400',
        pune: '411',
        bangalore: '560',
        delhi: '110',
      };
      const base = basePincodeMap[selectedCity] || '400';
      const randomSuffix = Math.floor(Math.random() * 100).toString().padStart(3, '0');
      setPincode(`${base}${randomSuffix}`);
    }

    setStep(2);
  };

  const handleSubmit = () => {
    const cityData = TOP_CITIES.find(c => c.id === selectedCity);

    const data: any = {
      city: cityData?.name || 'Mumbai',
      area: selectedArea,
      pincode: pincode,
      budget: budgetRange?.max || 10000000,
    };

    if (mode === 'buy' || mode === 'rent') {
      data.bhk = bhk;
      data.sqft = parseInt(sqft);
    } else if (mode === 'land') {
      data.plotSize = parseInt(plotSize);
      data.facing = facing;
    } else if (mode === 'commercial') {
      data.type = commercialType;
      data.sqft = parseInt(sqft);
      data.intent = 'Buy';
    }

    onComplete(data);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white/5 backdrop-blur-xl rounded-[32px] border border-white/10 p-8 shadow-lg">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
          {mode === 'buy' && <Home size={24} />}
          {mode === 'rent' && <Building2 size={24} />}
          {mode === 'land' && <MapPin size={24} />}
          {mode === 'commercial' && <Building2 size={24} />}
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
          {getModeDisplayName()} Valuation
        </h2>
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Select City</h3>
          {TOP_CITIES.map((city) => (
            <button
              key={city.id}
              onClick={() => handleCitySelect(city.id)}
              className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white font-bold hover:bg-blue-500/10 transition-all"
            >
              {city.name}
            </button>
          ))}
        </div>
      )}

      {step === 1 && currentCity && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Select Area in {currentCity.name}</h3>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {currentCity.areas.map((area) => (
              <button
                key={area}
                onClick={() => handleAreaSelect(area)}
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-left text-white hover:bg-blue-500/10 transition-all"
              >
                {area}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Or type custom area..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                handleAreaSelect(e.currentTarget.value.trim());
              }
            }}
            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500"
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <label className="text-xs font-black text-white uppercase tracking-widest block mb-2">
              Budget Range
            </label>
            <select
              value={budgetRange?.label || ''}
              onChange={(e) => setBudgetRange(budgetOptions.find(opt => opt.label === e.target.value))}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold"
            >
              <option value="">Select budget</option>
              {budgetOptions.map((opt) => (
                <option key={opt.label} value={opt.label}>{opt.label}</option>
              ))}
            </select>
          </div>

          {(mode === 'buy' || mode === 'rent') && (
            <>
              <div>
                <label className="text-xs font-black text-white uppercase tracking-widest block mb-2">
                  BHK Type
                </label>
                <select value={bhk} onChange={(e) => setBhk(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white">
                  <option>1 BHK</option>
                  <option>2 BHK</option>
                  <option>3 BHK</option>
                  <option>4 BHK</option>
                  <option>5+ BHK</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-white uppercase tracking-widest block mb-2">
                  Approx Area (sqft)
                </label>
                <input
                  type="number"
                  value={sqft}
                  onChange={(e) => setSqft(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>
            </>
          )}

          {mode === 'land' && (
            <>
              <div>
                <label className="text-xs font-black text-white uppercase tracking-widest block mb-2">
                  Plot Size (sq yards)
                </label>
                <input
                  type="number"
                  value={plotSize}
                  onChange={(e) => setPlotSize(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="text-xs font-black text-white uppercase tracking-widest block mb-2">
                  Preferred Facing
                </label>
                <select
                  value={facing}
                  onChange={(e) => setFacing(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold"
                >
                  <option value="East">East</option>
                  <option value="West">West</option>
                  <option value="North">North</option>
                  <option value="South">South</option>
                </select>
              </div>
            </>
          )}

          {mode === 'commercial' && (
            <>
              <div>
                <label className="text-xs font-black text-white uppercase tracking-widest block mb-2">
                  Commercial Type
                </label>
                <select
                  value={commercialType}
                  onChange={(e) => setCommercialType(e.target.value as 'Shop' | 'Office' | 'Warehouse')}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold"
                >
                  <option value="Office">Office</option>
                  <option value="Shop">Shop</option>
                  <option value="Warehouse">Warehouse</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-white uppercase tracking-widest block mb-2">
                  Approx Area (sqft)
                </label>
                <input
                  type="number"
                  value={sqft}
                  onChange={(e) => setSqft(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>
            </>
          )}

          <button
            onClick={handleSubmit}
            disabled={isLoading || !selectedArea || !pincode || !budgetRange}
            className="w-full py-4 bg-blue-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
            {isLoading ? 'Analyzing...' : 'Get Valuation'}
          </button>

          <button
            onClick={() => setStep(step - 1)}
            className="w-full py-3 bg-white/5 text-gray-400 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-white/10"
          >
            Back
          </button>
        </div>
      )}

      {/* Show selected values for confirmation */}
      {step > 0 && (
        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10 text-sm text-gray-300">
          <div>City: <span className="text-white font-bold">{currentCity?.name || selectedCity}</span></div>
          <div>Area: <span className="text-white font-bold">{selectedArea || '—'}</span></div>
          <div>Pincode: <span className="text-white font-bold">{pincode || '—'}</span></div>
          {step === 2 && budgetRange && (
            <div>Budget: <span className="text-white font-bold">{budgetRange.label}</span></div>
          )}
          {step === 2 && mode === 'land' && (
            <div>Facing: <span className="text-white font-bold">{facing}</span></div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
