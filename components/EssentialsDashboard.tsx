import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Phone, Star, Clock, ExternalLink, Zap, ShoppingCart, Home, Droplet, HeartPulse, Baby, Truck, Landmark, Loader2, X, Sparkles, Info, Map as MapIcon, LayoutGrid } from 'lucide-react';
import { EssentialResult, EssentialService } from '../types';
import { getEssentialsAnalysis } from '../services/geminiService';
import { essentialsData } from '../data/essentials';
import GoogleMapView from './GoogleMapView';

interface EssentialsDashboardProps {
  city: string;
  area: string;
  onBack?: () => void;
  autoFetchCategories?: string[]; // Auto-fetch these categories on mount
  propertyNodes?: any[]; // Pass property markers to show alongside essentials
}

const EssentialsDashboard: React.FC<EssentialsDashboardProps> = ({ 
  city, 
  area, 
  onBack, 
  autoFetchCategories = [],
  propertyNodes = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [results, setResults] = useState<{ [key: string]: EssentialResult }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());

  useEffect(() => {
    const hour = new Date().getHours();
    setIsNightMode(hour >= 21 || hour < 6);
  }, []);

  // Auto-fetch essential categories on mount
  useEffect(() => {
    if (autoFetchCategories.length > 0) {
      autoFetchCategories.forEach(category => {
        handleFetchService(category, true);
      });
    }
  }, [autoFetchCategories]);

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

  const handleFetchService = async (category: string, silent = false) => {
    setActiveCategory(category);
    if (!silent) setIsLoading(true);
    
    try {
      const data = await getEssentialsAnalysis(category, city, area);
      setResults(prev => ({ ...prev, [category]: data }));
      setSelectedServices(prev => new Set([...prev, category]));
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleRemoveService = (category: string) => {
    setResults(prev => {
      const newResults = { ...prev };
      delete newResults[category];
      return newResults;
    });
    setSelectedServices(prev => {
      const newSet = new Set(prev);
      newSet.delete(category);
      return newSet;
    });
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

  const getMarkerColor = (category: string): string => {
    const cat = essentialsData.find(c => c.name === category);
    if (!cat) return '#FCD34D'; // default gold
    
    if (cat.priority === 3) return '#FF6B9D'; // Emergency - Pink
    if (cat.priority === 1) return '#585FD8'; // Daily - Neon
    return '#FCD34D'; // Routine - Gold
  };

  // Prepare map nodes combining properties and essentials
  const mapNodes = useMemo(() => {
    const nodes = [...propertyNodes];
    
    Object.entries(results).forEach(([category, result]) => {
      result.services.forEach(service => {
        if (service.latitude && service.longitude) {
          nodes.push({
            title: service.name,
            price: category,
            address: service.address,
            lat: service.latitude,
            lng: service.longitude,
            isEssential: true,
            essentialType: category,
            markerColor: getMarkerColor(category),
            contact: service.contact,
            rating: service.rating
          });
        }
      });
    });
    
    return nodes;
  }, [results, propertyNodes]);

  const allResults = Object.values(results).flatMap(r => r.services);

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
          
          <div className="flex items-center gap-3">
            {isNightMode && (
              <div className="px-4 py-2 bg-neo-pink/10 border border-neo-pink/30 rounded-2xl flex items-center gap-2 animate-pulse shadow-pink-glow">
                <Clock size={14} className="text-neo-pink" />
                <span className="text-[10px] font-black text-neo-pink uppercase tracking-widest">Night Protocol</span>
              </div>
            )}
            
            {Object.keys(results).length > 0 && (
              <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    viewMode === 'grid' ? 'bg-neo-neon text-white shadow-neo-glow' : 'text-gray-400'
                  }`}
                >
                  <LayoutGrid size={12} className="inline mr-2" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    viewMode === 'map' ? 'bg-neo-neon text-white shadow-neo-glow' : 'text-gray-400'
                  }`}
                >
                  <MapIcon size={12} className="inline mr-2" />
                  Map
                </button>
              </div>
            )}
          </div>
        </div>

        {viewMode === 'grid' && (
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
        )}

        {selectedServices.size > 0 && viewMode === 'grid' && (
          <div className="flex flex-wrap gap-2">
            {Array.from(selectedServices).map(category => (
              <button
                key={category}
                onClick={() => handleRemoveService(category)}
                className="px-4 py-2 bg-neo-neon/10 border border-neo-neon/30 rounded-full text-[10px] font-black uppercase text-neo-neon flex items-center gap-2 hover:bg-neo-pink hover:text-white transition-all"
              >
                {category} <X size={12} />
              </button>
            ))}
          </div>
        )}
      </div>

      {viewMode === 'map' ? (
        <GoogleMapView 
          nodes={mapNodes} 
          showEssentials={true}
        />
      ) : (
        <>
          {Object.keys(results).length === 0 && !isLoading && (
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
              <p className="text-sm font-black text-gray-500 uppercase tracking-[0.4em] animate-pulse">
                Scanning Neural Nodes for {activeCategory}...
              </p>
            </div>
          )}

          {Object.keys(results).length > 0 && (
            <div className="space-y-8 animate-in slide-in-from-right-10 duration-500 pb-20">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                  <Sparkles className="text-neo-neon" size={20} /> 
                  {allResults.length} Verified Nodes
                </h3>
              </div>

              {Object.entries(results).map(([category, result]) => (
                <div key={category} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-black text-neo-neon uppercase tracking-widest">
                      {category} ({result.services.length})
                    </h4>
                    <button
                      onClick={() => handleRemoveService(category)}
                      className="p-2 bg-white/5 rounded-xl text-gray-500 hover:text-neo-pink transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="p-6 bg-neo-neon/5 border border-neo-neon/20 rounded-[32px] flex items-start gap-4 shadow-neo-glow">
                    <Info size={20} className="text-neo-neon mt-1 shrink-0" />
                    <p className="text-xs text-gray-300 leading-relaxed italic font-medium">
                      "{result.neighborhoodContext}"
                    </p>
                  </div>

                  <div className="space-y-4">
                    {result.services.map((svc, i) => (
                      <div 
                        key={i} 
                        className="bg-white/5 border border-white/10 rounded-[32px] p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:border-neo-neon/30 transition-all shadow-glass-3d"
                      >
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <h4 className="text-lg font-black text-white uppercase tracking-tighter">
                              {svc.name}
                            </h4>
                            {svc.isOpen && (
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase rounded border border-emerald-500/20">
                                Open Now
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            <div className="flex items-center gap-1.5">
                              <MapPin size={12} className="text-neo-neon" /> {svc.address}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Star size={12} className="text-neo-gold" /> {svc.rating}
                            </div>
                            {svc.distance && (
                              <div className="flex items-center gap-1.5 text-neo-neon">
                                <Zap size={12} /> {svc.distance}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                          <a 
                            href={`tel:${svc.contact}`} 
                            className="flex-1 md:flex-none h-14 px-8 bg-neo-neon text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest shadow-neo-glow hover:scale-105 active:scale-95 transition-all"
                          >
                            <Phone size={16} /> {svc.contact}
                          </a>
                          {svc.sourceUrl && (
                            <a 
                              href={svc.sourceUrl} 
                              target="_blank" 
                              rel="noopener" 
                              className="h-14 w-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-gray-500 hover:text-white hover:border-white/30 transition-all"
                            >
                              <ExternalLink size={20} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EssentialsDashboard;
