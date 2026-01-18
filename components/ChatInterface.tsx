import React, { useState, useEffect } from 'react';
import { AppMode, AppLang } from '../types';
import { Loader2, MapPin, DollarSign, Home, Building2, Sparkles } from 'lucide-react';

interface ChatInterfaceProps {
  mode: AppMode;
  lang: AppLang;
  onComplete: (data: any) => void;
  isLoading: boolean;
}

const TOP_CITIES = [
  { id: 'mumbai', name: 'Mumbai', areas: ['Andheri', 'Bandra', 'Juhu', 'Powai', 'Worli', 'Lower Parel'] },
  { id: 'delhi', name: 'Delhi', areas: ['Dwarka', 'Rohini', 'Saket', 'Vasant Kunj', 'Pitampura', 'Janakpuri'] },
  { id: 'bangalore', name: 'Bangalore', areas: ['Whitefield', 'Koramangala', 'Indiranagar', 'HSR Layout', 'Electronic City', 'Marathahalli'] },
  { id: 'pune', name: 'Pune', areas: ['Kharadi', 'Hinjewadi', 'Wakad', 'Baner', 'Aundh', 'Koregaon Park'] },
  { id: 'hyderabad', name: 'Hyderabad', areas: ['Gachibowli', 'Madhapur', 'Hitech City', 'Kondapur', 'Banjara Hills', 'Jubilee Hills'] },
  { id: 'chennai', name: 'Chennai', areas: ['Anna Nagar', 'T Nagar', 'Velachery', 'Adyar', 'Porur', 'OMR'] },
  { id: 'kolkata', name: 'Kolkata', areas: ['Salt Lake', 'New Town', 'Ballygunge', 'Alipore', 'Park Street', 'Rajarhat'] },
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

const ChatInterface: React.FC<ChatInterfaceProps> = ({ mode, lang, onComplete, isLoading }) => {
  const [step, setStep] = useState(0);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');
  const [budgetRange, setBudgetRange] = useState<any>(null);
  const [bhk, setBhk] = useState<string>('2 BHK');
  const [sqft, setSqft] = useState<string>('1000');
  const [plotSize, setPlotSize] = useState<string>('100');
  const [commercialType, setCommercialType] = useState<'Shop' | 'Office' | 'Warehouse'>('Office');

  const currentCity = TOP_CITIES.find(c => c.id === selectedCity);
  const budgetOptions = BUDGET_RANGES[mode as keyof typeof BUDGET_RANGES] || BUDGET_RANGES.buy;

  useEffect(() => {
    setStep(0);
    setSelectedCity('');
    setSelectedArea('');
    setPincode('');
    setBudgetRange(null);
  }, [mode]);

  const handleCitySelect = (cityId: string) => {
    setSelectedCity(cityId);
    setSelectedArea('');
    setPincode('');
    setStep(1);
  };

  const handleAreaSelect = (area: string) => {
    setSelectedArea(area);
    // Generate sample pincode (in real app, fetch from API)
    const basePincode = {
      mumbai: '400',
      delhi: '110',
      bangalore: '560',
      pune: '411',
      hyderabad: '500',
      chennai: '600',
      kolkata: '700'
    }[selectedCity] || '000';
    setPincode(`${basePincode}0${Math.floor(Math.random() * 99)}`);
    setStep(2);
  };

  const handleBudgetSelect = (range: any) => {
    setBudgetRange(range);
    setStep(3);
  };

  const handleSubmit = () => {
    const cityData = TOP_CITIES.find(c => c.id === selectedCity);
    
    const data: any = {
      city: cityData?.name || 'Mumbai',
      area: selectedArea,
      pincode: pincode,
      budget: budgetRange?.max || 10000000,
    };

    if (mode === 'buy') {
      data.bhk = bhk;
      data.sqft = parseInt(sqft);
    } else if (mode === 'rent') {
      data.bhk = bhk;
      data.sqft = parseInt(sqft);
    } else if (mode === 'land') {
      data.plotSize = parseInt(plotSize);
    } else if (mode === 'commercial') {
      data.type = commercialType;
      data.sqft = parseInt(sqft);
      data.intent = 'Buy';
    }

    onComplete(data);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white/5 backdrop-blur-xl rounded-[32px] border border-white/10 p-8 shadow-neo-glow">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-neo-neon/10 rounded-2xl text-neo-neon">
          {mode === 'buy' && <Home size={24} />}
          {mode === 'rent' && <Building2 size={24} />}
          {mode === 'land' && <MapPin size={24} />}
          {mode === 'commercial' && <Building2 size={24} />}
        </div>
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
            {mode === 'buy' && 'Buy Property'}
            {mode === 'rent' && 'Rent Property'}
            {mode === 'land' && 'Land Valuation'}
            {mode === 'commercial' && 'Commercial Space'}
          </h2>
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
            Step {step + 1} of 4
          </p>
        </div>
      </div>

      {/* Step 0: City Selection */}
      {step === 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <label className="text-xs font-black text-white uppercase tracking-widest block mb-3">
            Select City
          </label>
          <div className="grid grid-cols-2 gap-3">
            {TOP_CITIES.map((city) => (
              <button
                key={city.id}
                onClick={() => handleCitySelect(city.id)}
                className="p-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-neo-neon/10 hover:border-neo-neon/30 transition-all group"
              >
                <MapPin size={16} className="text-neo-neon mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-sm font-black text-white">{city.name}</div>
                <div className="text-[9px] text-gray-500 uppercase tracking-widest">
                  {city.areas.length} Areas
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Area Selection */}
      {step === 1 && currentCity && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <label className="text-xs font-black text-white uppercase tracking-widest block mb-3">
            Select Area in {currentCity.name}
          </label>
          <div className="space-y-2">
            {currentCity.areas.map((area) => (
              <button
                key={area}
                onClick={() => handleAreaSelect(area)}
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-neo-neon/10 hover:border-neo-neon/30 transition-all"
              >
                <div className="text-sm font-black text-white">{area}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Budget Range */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <label className="text-xs font-black text-white uppercase tracking-widest block mb-3">
            Select Budget Range
          </label>
          <div className="space-y-2">
            {budgetOptions.map((range, idx) => (
              <button
                key={idx}
                onClick={() => handleBudgetSelect(range)}
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-neo-neon/10 hover:border-neo-neon/30 transition-all flex items-center justify-between"
              >
                <div className="text-sm font-black text-white">{range.label}</div>
                <DollarSign size={16} className="text-neo-gold" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Property Details */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-4 bg-neo-neon/5 border border-neo-neon/20 rounded-2xl">
            <div className="text-[10px] text-neo-neon font-black uppercase tracking-widest mb-2">
              Selected Location
            </div>
            <div className="text-sm font-black text-white">
              {selectedArea}, {currentCity?.name}
            </div>
            <div className="text-xs text-gray-400">PIN: {pincode}</div>
            <div className="text-xs text-neo-gold mt-2">{budgetRange?.label}</div>
          </div>

          {(mode === 'buy' || mode === 'rent') && (
            <>
              <div>
                <label className="text-xs font-black text-white uppercase tracking-widest block mb-2">
                  Property Type
                </label>
                <select
                  value={bhk}
                  onChange={(e) => setBhk(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold outline-none focus:border-neo-neon"
                >
                  <option value="1 BHK">1 BHK</option>
                  <option value="2 BHK">2 BHK</option>
                  <option value="3 BHK">3 BHK</option>
                  <option value="4 BHK">4 BHK</option>
                  <option value="5 BHK">5 BHK</option>
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
                  placeholder="e.g. 1200"
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold outline-none focus:border-neo-neon"
                />
              </div>
            </>
          )}

          {mode === 'land' && (
            <div>
              <label className="text-xs font-black text-white uppercase tracking-widest block mb-2">
                Plot Size (sq yards)
              </label>
              <input
                type="number"
                value={plotSize}
                onChange={(e) => setPlotSize(e.target.value)}
                placeholder="e.g. 100"
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold outline-none focus:border-neo-neon"
              />
            </div>
          )}

          {mode === 'commercial' && (
            <>
              <div>
                <label className="text-xs font-black text-white uppercase tracking-widest block mb-2">
                  Commercial Type
                </label>
                <select
                  value={commercialType}
                  onChange={(e) => setCommercialType(e.target.value as any)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold outline-none focus:border-neo-neon"
                >
                  <option value="Shop">Shop</option>
                  <option value="Office">Office</option>
                  <option value="Warehouse">Warehouse</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-white uppercase tracking-widest block mb-2">
                  Area (sqft)
                </label>
                <input
                  type="number"
                  value={sqft}
                  onChange={(e) => setSqft(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold outline-none focus:border-neo-neon"
                />
              </div>
            </>
          )}

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full py-4 bg-neo-neon text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-neo-glow hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Start Analysis
              </>
            )}
          </button>

          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="w-full py-3 bg-white/5 text-gray-400 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all"
            >
              Back
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
