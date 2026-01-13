import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Phone, Star, Clock, ExternalLink, Zap, ShoppingCart, Home, Droplet, HeartPulse, Baby, Truck, Landmark, Loader2, X, Sparkles, Info } from 'lucide-react';
import { EssentialResult, EssentialService } from '../types';
import { getEssentialsAnalysis } from '../services/geminiService';
import { essentialsData } from '../data/essentials';

interface EssentialsDashboardProps {
  city: string;
  area: string;
  onBack?: () => void;
}

const EssentialsDashboard: React.FC<EssentialsDashboardProps> = ({ city, area, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [result, setResult] = useState<EssentialResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    setIsNightMode(hour >= 21 || hour < 6);
  }, []);

  const sortedCategories = useMemo(() => {
    return [...essentialsData].sort((a, b) => {
      if (isNightMode) {
        const isEmergencyA = a.priority === 3 || a.id === 'chemist';
        const isEmergencyB = b.priority === 3 || b.id === 'chemist';
        if (isEmergencyA && !isEmergencyB) return -1;
        if (!isEmergencyA && isEmergencyB) return 1;
      }
      return a.priority - b.priority;
    });
  }, [isNightMode]);

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return sortedCategories;
    const lower = searchTerm.toLowerCase();
    return sortedCategories.filter(cat => 
      cat.name.toLowerCase().includes(lower) || 
      cat.keywords.some(k => k.toLowerCase().includes(lower))
    );
  }, [searchTerm, sortedCategories]);

  const handleFetchService = async (category: string) => {
    setActiveCategory(category);
    setIsLoading(true);
    setResult(null);
    try {
      // Use the LLM grounded search to fetch REAL business contacts
      const data = await getEssentialsAnalysis(category, city, area);
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (id: string) => {
    if (id.includes('milk') || id.includes('grocery')) return <ShoppingCart size={20} />;
    if (id.includes('water')) return <Droplet size={20} />;
    if (id.includes('plumber') || id.includes('electrician')) return <Home size={20} />;
    if (id.includes('doctor') || id.includes('chemist') || id.includes('ambulance')) return <HeartPulse size={20} />;
    if (id.includes('baby')) return <Baby size={20} />;
    if (id.includes('courier') || id.includes('laundry')) return <Truck size={20} />;
    if (id.includes('bank') || id.includes('police')) return <Landmark size={20} />;
    return <Zap size={20} />;
  };

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-10 duration-700 pb-20">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Local Essentials</h2>
            <div className="flex items-center gap-2 mt-2">
              <MapPin size={12} className="text-neo-neon" />
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{area}, {city}</span>
            </div>
          </div>
          {isNightMode && (
            <div className="px-4 py-2 bg-neo-pink/10 border border-neo-pink/30 rounded-2xl flex items-center gap-2 animate-pulse shadow-pink-glow">
              <Clock size={14} className="text-neo-pink" />
              <span className="text-[10px] font-black text-neo-pink uppercase tracking-widest">Night Protocol Active</span>
            </div>
          )}
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-6 flex items-center text-gray-500 group-focus-within:text-neo-neon transition-colors">
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Search for plumber, chemist, milk..."
            className="w-full h-16 bg-white/5 border border-white/10 rounded-[24px] pl-16 pr-6 text-sm font-bold text-white focus:border-neo-neon outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {!result && !isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-y-auto pr-2 scrollbar-hide max-h-[60vh]">
          {filteredCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleFetchService(cat.name)}
              className={`p-6 rounded-[32px] border text-left transition-all hover:-translate-y-1 active:scale-95 group flex flex-col justify-between h-40 ${
                cat.priority === 3 ? 'bg-neo-pink/5 border-neo-pink/20 hover:border-neo-pink/50' : 
                cat.priority === 1 ? 'bg-neo-neon/5 border-neo-neon/20 hover:border-neo-neon/50' :
                'bg-white/5 border-white/10 hover:border-white/30'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
                cat.priority === 3 ? 'bg-neo-pink/10 text-neo-pink' : 
                cat.priority === 1 ? 'bg-neo-neon/10 text-neo-neon' :
                'bg-white/5 text-gray-500'
              } group-hover:scale-110`}>
                {getIcon(cat.id)}
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-tight leading-tight mb-1">{cat.name}</h4>
                <div className="flex items-center gap-1.5 opacity-50">
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                    {cat.priority === 1 ? 'Daily' : cat.priority === 2 ? 'Routine' : 'Emergency'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 py-20">
          <div className="relative">
            <Loader2 size={64} className="text-neo-neon animate-spin" />
            <div className="absolute inset-0 bg-neo-neon blur-[50px] opacity-20" />
          </div>
          <p className="text-sm font-black text-gray-500 uppercase tracking-[0.4em] animate-pulse">Scanning Neural Nodes for {activeCategory}...</p>
        </div>
      )}

      {result && (
        <div className="space-y-8 animate-in slide-in-from-right-10 duration-500 pb-20">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <Sparkles className="text-neo-neon" size={20} /> Verified Nodes: {result.category}
            </h3>
            <button onClick={() => setResult(null)} className="p-2 bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all"><X size={20} /></button>
          </div>

          <div className="p-6 bg-neo-neon/5 border border-neo-neon/20 rounded-[32px] flex items-start gap-4 shadow-neo-glow">
            <Info size={20} className="text-neo-neon mt-1 shrink-0" />
            <p className="text-xs text-gray-300 leading-relaxed italic font-medium">"{result.neighborhoodContext}"</p>
          </div>

          <div className="space-y-4">
            {result.services.map((svc, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-[32px] p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:border-neo-neon/30 transition-all shadow-glass-3d">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-black text-white uppercase tracking-tighter">{svc.name}</h4>
                    {svc.isOpen && <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase rounded border border-emerald-500/20">Open Now</span>}
                  </div>
                  <div className="flex flex-wrap gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5"><MapPin size={12} className="text-neo-neon" /> {svc.address}</div>
                    <div className="flex items-center gap-1.5"><Star size={12} className="text-neo-gold" /> {svc.rating}</div>
                    {svc.distance && <div className="flex items-center gap-1.5 text-neo-neon"><Zap size={12} /> {svc.distance}</div>}
                  </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <a href={`tel:${svc.contact}`} className="flex-1 md:flex-none h-14 px-8 bg-neo-neon text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest shadow-neo-glow hover:scale-105 active:scale-95 transition-all">
                    <Phone size={16} /> {svc.contact}
                  </a>
                  {svc.sourceUrl && (
                    <a href={svc.sourceUrl} target="_blank" rel="noopener" className="h-14 w-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-gray-500 hover:text-white hover:border-white/30 transition-all">
                      <ExternalLink size={20} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EssentialsDashboard;