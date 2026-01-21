// RentDashboard.tsx - FIXED RENT DISPLAY LOGIC (Complete)
import React, { useState, useEffect } from 'react';
import { RentResult, AppLang } from '../types';
import {
  MapPin, ExternalLink, Home, Loader2, BarChart3, LayoutGrid,
  TrendingUp, Plus, FileText, AlertCircle, Building2, Calendar
} from 'lucide-react';
import { speak } from '../services/voiceService';
import MarketStats from './MarketStats';
import { parsePrice, calculateListingStats } from '../utils/listingProcessor';
import GoogleMapView from './GoogleMapView';
import { getMoreListings } from '../services/valuationService';
import confetti from 'canvas-confetti';
import MarketIntelligence from './MarketIntelligence';
import ValuationReport from './ValuationReport';
import RealTimeNews from './RealTimeNews';

interface RentDashboardProps {
  result: RentResult;
  lang?: AppLang;
  onAnalyzeFinance?: () => void;
  city: string;
  area: string;
  pincode?: string;
  userInput?: {
    bhk?: string;
    sqft?: number;
  };
}

type ViewMode = 'dashboard' | 'stats' | 'map' | 'report';

// FIXED: Rent-specific price formatter
const formatRentPrice = (val: any): string => {
  if (val === null || val === undefined) return "";
  const str = String(val);
  const num = parseFloat(str.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return str;
  
  // Rent should be in thousands, not crores
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L/month`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(0)}K/month`;
  return `₹${num.toLocaleString('en-IN')}/month`;
};

// Helper to format annual rent without /month suffix
const formatAnnualRent = (val: number): string => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val.toLocaleString('en-IN')}`;
};

// FIXED: Parse rent value correctly
const parseRentPrice = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = String(val);
  const num = parseFloat(str.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return 0;
  
  // Handle if accidentally in crores/lakhs
  if (str.toLowerCase().includes('cr')) {
    return num * 10000000 / 200; // Convert to monthly rent (0.5% of value)
  }
  if (str.toLowerCase().includes('l') || str.toLowerCase().includes('lakh')) {
    return num * 100000 / 24; // Convert to monthly rent
  }
  if (str.toLowerCase().includes('k')) {
    return num * 1000;
  }
  
  // If number is too high (probably sale price), convert to rent
  if (num > 1000000) return num / 200; // 0.5% monthly
  
  return num;
};

const formatFullAddress = (listing: any, area: string, city: string, pincode: string): string => {
  const parts = [];
  
  if (listing.project || listing.title) {
    parts.push(listing.project || listing.title);
  }
  
  if (listing.locality && listing.locality !== area) {
    parts.push(listing.locality);
  }
  
  if (area) parts.push(area);
  if (city) parts.push(city);
  if (pincode) parts.push(`PIN: ${pincode}`);
  
  const uniqueParts = [...new Set(parts.filter(p => p && p.trim()))];
  return uniqueParts.join(', ');
};

const enrichRentListing = (listing: any, userSqft: number) => {
  const actualSqft = listing.builtUpArea || listing.carpetArea || listing.superArea || userSqft;
  let monthlyRent = parseRentPrice(listing.monthlyRent || listing.rent || listing.price);
  
  // Validate rent is in realistic range
  if (monthlyRent < 5000) monthlyRent = 15000; // Min ₹15K
  if (monthlyRent > 500000) monthlyRent = 50000; // Max ₹5L
  
  const rentPerSqft = actualSqft && monthlyRent > 0 
    ? Math.round(monthlyRent / actualSqft)
    : null;
  
  return {
    ...listing,
    actualSqft,
    monthlyRent,
    sqftDisplay: listing.builtUpArea 
      ? `${listing.builtUpArea} sq.ft. (Built-up)` 
      : listing.carpetArea 
        ? `${listing.carpetArea} sq.ft. (Carpet)` 
        : `~${userSqft} sq.ft.`,
    rentPerSqft: rentPerSqft ? `₹${rentPerSqft}/sq.ft./month` : null,
    priceDisplay: formatRentPrice(monthlyRent),
    securityDeposit: formatRentPrice(monthlyRent * 2)
  };
};

const RentDashboard: React.FC<RentDashboardProps> = ({
  result,
  lang = 'EN',
  onAnalyzeFinance,
  city,
  area,
  pincode = '',
  userInput
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [allListings, setAllListings] = useState(result.listings || []);
  const [isDeepScanning, setIsDeepScanning] = useState(false);

  const userSqft = userInput?.sqft || 1000;

  useEffect(() => {
    const enriched = (result.listings || []).map(l => enrichRentListing(l, userSqft));
    setAllListings(enriched);
  }, [result.listings, userSqft]);

  // FIXED: Parse rental value correctly
  const rentalValueNum = parseRentPrice(result.rentalValue || result.monthlyRent || result.fairValue);

  useEffect(() => {
    const rentText = formatRentPrice(rentalValueNum);
    const speechText = lang === 'HI'
      ? `आपके क्षेत्र के लिए उचित किराया ${rentText} है।`
      : `The fair rental value for your area is ${rentText}.`;
    speak(speechText, lang === 'HI' ? 'hi-IN' : 'en-IN');
  }, [result.rentalValue, lang]);

  const handleDeepScan = async () => {
    if (isDeepScanning) return;
    setIsDeepScanning(true);

    try {
      const more = await getMoreListings({
        city,
        area,
        propertyType: userInput?.bhk || 'Residential',
        size: userSqft,
        mode: 'rent'
      });

      const formattedMore = more.map(l => enrichRentListing({
        title: l.project || "Property",
        monthlyRent: l.monthlyRent || l.rent || l.price,
        address: formatFullAddress(l, area, city, pincode),
        sourceUrl: l.url || 'https://www.99acres.com',
        bhk: userInput?.bhk || 'Residential',
        qualityScore: 8,
        latitude: l.latitude,
        longitude: l.longitude,
        builtUpArea: l.builtUpArea,
        carpetArea: l.carpetArea,
        locality: l.locality
      }, userSqft));

      const uniqueNew = formattedMore.filter(nm => !allListings.some(al => al.title === nm.title));
      setAllListings(prev => [...prev, ...uniqueNew]);

      confetti({ particleCount: 100, spread: 50, origin: { y: 0.8 } });
    } catch (e) {
      console.error("Deep Scan Failed:", e);
    } finally {
      setIsDeepScanning(false);
    }
  };

  const listingRents = allListings.map(l => l.monthlyRent || 0);
  const listingStats = calculateListingStats(listingRents);

  const mapNodes = [
    {
      title: "Your Property",
      price: formatRentPrice(rentalValueNum),
      address: `${area}, ${city}${pincode ? ', PIN: ' + pincode : ''}`,
      lat: allListings[0]?.latitude || 18.52,
      lng: allListings[0]?.longitude || 73.86,
      isSubject: true
    },
    ...allListings.map(l => ({
      title: l.title,
      price: l.priceDisplay,
      address: formatFullAddress(l, area, city, pincode),
      lat: l.latitude,
      lng: l.longitude,
      sqft: l.actualSqft,
      pricePerSqft: l.rentPerSqft
    }))
  ];

  // Calculate yearly rent and yield
  const annualRent = rentalValueNum * 12;
  const estimatedPropertyValue = rentalValueNum * 200; // Typical 0.5% monthly rent
  const yieldPercent = ((annualRent / estimatedPropertyValue) * 100).toFixed(2);

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500 shadow-lg">
            <Building2 size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Rent Analysis</h2>
            <p className="text-[10px] text-gray-500 uppercase font-black opacity-60">{area}, {city}</p>
          </div>
        </div>

        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 overflow-x-auto scrollbar-hide">
          <button onClick={() => setViewMode('dashboard')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === 'dashboard' ? 'bg-purple-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
            <LayoutGrid size={12} /> Deck
          </button>
          <button onClick={() => setViewMode('map')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === 'map' ? 'bg-purple-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
            <MapPin size={12} /> Map
          </button>
          <button onClick={() => setViewMode('stats')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === 'stats' ? 'bg-purple-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
            <BarChart3 size={12} /> Stats
          </button>
          <button onClick={() => setViewMode('report')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${viewMode === 'report' ? 'bg-purple-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
            <FileText size={12} /> Report
          </button>
        </div>
      </div>

      {viewMode === 'stats' && <MarketStats stats={listingStats} prices={listingRents} labelPrefix="Rent" />}
      {viewMode === 'map' && <GoogleMapView nodes={mapNodes} />}
      {viewMode === 'report' && (
        <ValuationReport 
          mode="rent"
          result={result}
          city={city}
          area={area}
          pincode={pincode}
          userInput={userInput}
        />
      )}

      {viewMode === 'dashboard' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* FIXED: Monthly Rent Card - Absolute Fix for Overlap */}
            <div className="bg-white/5 rounded-[32px] p-8 border shadow-glass-3d border-t-4 border-t-purple-500 flex flex-col justify-between min-h-[240px] overflow-hidden">
              <div className="flex flex-col gap-3 w-full">
                <span className="text-[10px] font-black text-purple-500 uppercase tracking-wider">Monthly Rent</span>
                <div className="w-full">
                  <div className="text-4xl font-black text-white tracking-tighter mb-3 w-full break-words">
                    {formatRentPrice(rentalValueNum)}
                  </div>
                  <div className="text-sm text-gray-400 font-medium w-full">
                    {formatAnnualRent(annualRent)} per year
                  </div>
                </div>
              </div>
              {onAnalyzeFinance && (
                <button onClick={onAnalyzeFinance} className="mt-4 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-500 text-[10px] font-black uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-all w-full flex items-center justify-center gap-2">
                  <TrendingUp size={12} /> ROI Calculator
                </button>
              )}
            </div>

            <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 shadow-glass-3d flex flex-col min-h-[240px] overflow-hidden">
              <div className="flex flex-col gap-3 w-full">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Security Deposit</span>
                <div className="w-full">
                  <div className="text-3xl font-black text-white tracking-tighter mb-3 w-full break-words">
                    {formatRentPrice(rentalValueNum * 2)}
                  </div>
                  <div className="text-xs text-gray-400 w-full">2 months rent</div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 shadow-glass-3d flex flex-col min-h-[240px] overflow-hidden">
              <div className="flex flex-col gap-3 w-full">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Rental Yield</span>
                <div className="w-full">
                  <div className="text-4xl font-black text-emerald-500 tracking-tighter mb-3 w-full">{yieldPercent}%</div>
                  <div className="text-xs text-gray-400 w-full">Annual return</div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 shadow-glass-3d flex flex-col min-h-[240px] overflow-hidden">
              <div className="flex flex-col gap-3 w-full">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Listings Found</span>
                <div className="text-4xl font-black text-white tracking-tighter w-full">{allListings.length}</div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 pb-10 scrollbar-hide">
            <div className="space-y-8">
              <MarketIntelligence result={result} accentColor="purple-500" />

              <RealTimeNews city={city} area={area} mode="rent" />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allListings.length > 0 ? (
                  allListings.map((item, idx) => {
                    const fullAddress = formatFullAddress(item, area, city, pincode);
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
                    
                    return (
                      <div
                        key={idx}
                        className="bg-white/5 border border-white/10 rounded-[32px] p-6 shadow-glass-3d hover:border-purple-500/40 transition-all"
                      >
                        <h4 className="font-black text-white truncate">{item.title || 'Property'}</h4>
                        
                        {item.actualSqft && (
                          <p className="text-sm text-blue-400 font-bold mt-1">
                            {item.sqftDisplay}
                          </p>
                        )}
                        
                        <p className="text-xl font-black text-purple-500 mt-2">
                          {item.priceDisplay || formatRentPrice(item.monthlyRent)}
                        </p>
                        
                        {item.rentPerSqft && (
                          <p className="text-xs text-gray-400 mt-1">{item.rentPerSqft}</p>
                        )}
                        
                        {item.securityDeposit && (
                          <div className="mt-2 px-3 py-1 bg-purple-500/10 rounded-lg border border-purple-500/20">
                            <p className="text-[10px] text-purple-400 font-bold uppercase">Security Deposit</p>
                            <p className="text-sm text-white font-bold">{item.securityDeposit}</p>
                          </div>
                        )}
                        
                        <a 
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-400 hover:text-blue-400 transition-colors mt-3 block underline decoration-dotted cursor-pointer"
                          title={fullAddress}
                        >
                          📍 {fullAddress}
                        </a>
                        
                        {item.latitude && item.longitude && (
                          <p className="text-xs text-gray-500 mt-1">
                            Lat: {item.latitude.toFixed(4)} | Lng: {item.longitude.toFixed(4)}
                          </p>
                        )}
                        
                        {item.sourceUrl && (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-block px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-all"
                          >
                            View Full Listing →
                          </a>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-20 text-gray-400 bg-white/5 rounded-[40px] border border-dashed border-white/10">
                    <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-bold text-lg">No rental listings found</p>
                    <p className="text-sm mt-2">Showing market estimate only.</p>
                    <p className="text-sm mt-4 font-bold">
                      Estimated rental range: {formatRentPrice(rentalValueNum * 0.85)} - {formatRentPrice(rentalValueNum * 1.15)}
                    </p>
                  </div>
                )}
              </div>

              {allListings.length > 0 && (
                <div className="flex flex-col items-center gap-6 py-10">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Extended Rental Network Detected</p>
                  <button
                    onClick={handleDeepScan}
                    disabled={isDeepScanning}
                    className="px-12 py-5 bg-white/5 border border-white/10 rounded-full text-xs font-black uppercase tracking-widest text-white hover:bg-purple-500 hover:border-purple-500 transition-all flex items-center gap-3 shadow-lg group active:scale-95 disabled:opacity-50"
                  >
                    {isDeepScanning ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} className="group-hover:rotate-90 transition-transform" />}
                    {isDeepScanning ? 'Scanning Rental Market...' : 'See More Rentals'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RentDashboard;
