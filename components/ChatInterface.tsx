// ChatInterface.tsx
// Update your existing src/components/ChatInterface.tsx
import React, { useState, useEffect } from 'react';
import { Loader2, MapPin, Home, Building2, Sparkles, Search } from 'lucide-react';
import { getPincode, CITY_LIST, DATABASE_STATS } from './store/pincodeMapStore';

type AppMode = 'buy' | 'rent' | 'land' | 'commercial';
type AppLang = 'EN' | 'HI';

interface ChatInterfaceProps {
  mode: AppMode;
  lang: AppLang;
  onComplete: (data: any) => void;
  isLoading: boolean;
}

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
  const [loadingPincode, setLoadingPincode] = useState(false);
  const [areaSearchQuery, setAreaSearchQuery] = useState('');

  const budgetOptions = BUDGET_RANGES[mode] || BUDGET_RANGES.buy;
  
  // Get current city data
  const currentCityData = CITY_LIST.find(c => c.name.toLowerCase() === selectedCity.toLowerCase());
  const currentCityAreas = currentCityData?.areas || [];
  
  // Filter areas based on search
  const filteredAreas = currentCityAreas.filter(area => 
    area.name.toLowerCase().includes(areaSearchQuery.toLowerCase())
  );

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
    setAreaSearchQuery('');
  }, [mode]);

  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName.toLowerCase());
    setSelectedArea('');
    setPincode('');
    setAreaSearchQuery('');
    setStep(1);
  };

  const handleAreaSelect = async (areaName: string, areaPincode: string) => {
    setSelectedArea(areaName);
    setLoadingPincode(true);

    // Simulate loading for better UX
    await new Promise(resolve => setTimeout(resolve, 300));

    // Set pincode from database
    setPincode(areaPincode);

    setLoadingPincode(false);
    setStep(2);
  };

  const handleSubmit = () => {
    const data: any = {
      city: selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1),
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
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
            {getModeDisplayName()} Valuation
          </h2>
          <p className="text-[10px] text-gray-500 mt-1">
            {DATABASE_STATS.totalCities} Cities • {DATABASE_STATS.totalAreas} Areas
          </p>
        </div>
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white mb-4">Select City</h3>
          <div className="grid grid-cols-2 gap-3">
            {CITY_LIST.map((city) => (
              <button
                key={city.name}
                onClick={() => handleCitySelect(city.name)}
                className="p-4 bg-white/5 border border-white/10 rounded-xl text-white font-bold hover:bg-blue-500/10 hover:border-blue-500/30 transition-all text-sm"
              >
                <div className="font-bold">{city.name}</div>
                <div className="text-[10px] text-gray-400 mt-1">
                  {city.areas.length} areas
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && currentCityData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">
              Select Area in {currentCityData.name}
            </h3>
            <span className="text-xs text-gray-400">
              {filteredAreas.length} areas
            </span>
          </div>
          
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search areas..."
              value={areaSearchQuery}
              onChange={(e) => setAreaSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:outline-none transition-colors"
            />
          </div>

          {/* Areas List */}
          <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
            {filteredAreas.map((area) => (
              <button
                key={area.name}
                onClick={() => handleAreaSelect(area.name, area.pincode)}
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-left text-white hover:bg-blue-500/10 hover:border-blue-500/30 transition-all group"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{area.name}</span>
                  <span className="text-xs text-gray-400 group-hover:text-blue-400 transition-colors font-mono">
                    {area.pincode}
                  </span>
                </div>
              </button>
            ))}
            
            {filteredAreas.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <p className="text-sm">No areas found matching "{areaSearchQuery}"</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setStep(0)}
            className="w-full py-3 bg-white/5 text-gray-400 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all"
          >
            Back to Cities
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          {loadingPincode && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-center gap-3 text-blue-400 text-sm">
              <Loader2 size={16} className="animate-spin" />
              <span>Fetching pincode data...</span>
            </div>
          )}

          <div>
            <label className="text-xs font-black text-white uppercase tracking-widest block mb-2">
              Budget Range
            </label>
            <select
              value={budgetRange?.label || ''}
              onChange={(e) => setBudgetRange(budgetOptions.find(opt => opt.label === e.target.value))}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold focus:border-blue-500/50 focus:outline-none"
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
                <select 
                  value={bhk} 
                  onChange={(e) => setBhk(e.target.value)} 
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500/50 focus:outline-none"
                >
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
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500/50 focus:outline-none"
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
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black text-white uppercase tracking-widest block mb-2">
                  Preferred Facing
                </label>
                <select
                  value={facing}
                  onChange={(e) => setFacing(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold focus:border-blue-500/50 focus:outline-none"
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
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold focus:border-blue-500/50 focus:outline-none"
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
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500/50 focus:outline-none"
                />
              </div>
            </>
          )}

          <button
            onClick={handleSubmit}
            disabled={isLoading || !selectedArea || !pincode || !budgetRange}
            className="w-full py-4 bg-blue-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
            {isLoading ? 'Analyzing...' : 'Get Valuation'}
          </button>

          <button
            onClick={() => setStep(step - 1)}
            className="w-full py-3 bg-white/5 text-gray-400 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all"
          >
            Back
          </button>
        </div>
      )}

      {step > 0 && (
        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10 text-sm text-gray-300 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">City:</span>
            <span className="text-white font-bold">
              {selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Area:</span>
            <span className="text-white font-bold">{selectedArea || '—'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Pincode:</span>
            <span className="text-white font-bold font-mono">{pincode || '—'}</span>
          </div>
          {step === 2 && budgetRange && (
            <div className="flex justify-between pt-2 border-t border-white/5">
              <span className="text-gray-400">Budget:</span>
              <span className="text-blue-400 font-bold">{budgetRange.label}</span>
            </div>
          )}
          {step === 2 && mode === 'land' && (
            <div className="flex justify-between">
              <span className="text-gray-400">Facing:</span>
              <span className="text-white font-bold">{facing}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
