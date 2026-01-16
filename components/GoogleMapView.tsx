import React, { useEffect, useRef, useState } from "react";

interface MapNode {
  title: string;
  price: number;
  address: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  isSubject?: boolean;
}

interface GoogleMapViewProps {
  nodes: MapNode[];
}

const MAP_ID = "2185f915fc843bc0827abfdd";

declare global {
  interface Window {
    google: any;
    MarkerClusterer: any;
    process?: {
      env?: {
        [key: string]: string;
      };
    };
  }
}

const GoogleMapView: React.FC<GoogleMapViewProps> = ({ nodes }) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const clusterer = useRef<any>(null);

  const [stats, setStats] = useState<{ avg: number; median: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get API key with detailed logging
  const getApiKey = (): string | null => {
    // Method 1: window.process.env (from index.html)
    const windowKey = (window as any).process?.env?.GOOGLE_MAPS_API_KEY;
    console.log('🔍 Checking window.process.env.GOOGLE_MAPS_API_KEY:', windowKey ? '✅ Found' : '❌ Not found');
    
    // Method 2: import.meta.env (from .env)
    const viteKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    console.log('🔍 Checking VITE_GOOGLE_MAPS_API_KEY:', viteKey ? '✅ Found' : '❌ Not found');
    
    const finalKey = windowKey || viteKey;
    console.log('🔑 Final API Key:', finalKey ? `${finalKey.substring(0, 10)}...` : '❌ MISSING');
    
    return finalKey || null;
  };

  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        const apiKey = getApiKey();

        if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
          throw new Error('Google Maps API key not configured. Add it to index.html or .env file');
        }

        // Check if already loaded
        if (window.google?.maps) {
          console.log('✅ Google Maps already loaded');
          initMap();
          return;
        }

        console.log('📦 Loading Google Maps...');

        // Load Google Maps
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker,geometry,visualization&loading=async`;
          script.async = true;
          script.defer = true;
          script.onload = () => {
            console.log('✅ Google Maps script loaded');
            resolve();
          };
          script.onerror = () => {
            console.error('❌ Failed to load Google Maps script');
            reject(new Error('Failed to load Google Maps'));
          };
          document.head.appendChild(script);
        });

        // Load MarkerClusterer
        if (!window.MarkerClusterer) {
          console.log('📦 Loading MarkerClusterer...');
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js";
            script.async = true;
            script.onload = () => {
              console.log('✅ MarkerClusterer loaded');
              resolve();
            };
            script.onerror = () => {
              console.error('❌ Failed to load MarkerClusterer');
              reject(new Error('Failed to load MarkerClusterer'));
            };
            document.head.appendChild(script);
          });
        }

        initMap();
      } catch (err: any) {
        console.error('❌ Google Maps loading error:', err);
        setError(err.message || 'Failed to load Google Maps');
        setIsLoading(false);
      }
    };

    loadGoogleMaps();
  }, []);

  const initMap = () => {
    if (!mapRef.current) {
      setError('Map container not found');
      setIsLoading(false);
      return;
    }

    if (!window.google?.maps) {
      setError('Google Maps API not loaded');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🗺️ Initializing map...');
      const google = window.google;

      map.current = new google.maps.Map(mapRef.current, {
        center: { lat: 18.5204, lng: 73.8567 },
        zoom: 14,
        mapId: MAP_ID,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      console.log('✅ Map initialized successfully');
      setIsLoading(false);
      
      if (nodes.length > 0) {
        renderMarkers();
      }
    } catch (err: any) {
      console.error('❌ Map initialization error:', err);
      setError(`Failed to initialize map: ${err.message}`);
      setIsLoading(false);
    }
  };

  const renderMarkers = () => {
    if (!map.current || !window.google?.maps || nodes.length === 0) {
      console.log('⚠️ Cannot render markers:', {
        hasMap: !!map.current,
        hasGoogle: !!window.google?.maps,
        nodeCount: nodes.length
      });
      return;
    }

    console.log(`🎯 Rendering ${nodes.length} markers...`);

    const google = window.google;
    const AdvancedMarkerElement = google.maps.marker?.AdvancedMarkerElement;

    if (!AdvancedMarkerElement) {
      console.error('❌ AdvancedMarkerElement not available');
      return;
    }

    // Clear existing markers
    markers.current.forEach((m) => (m.map = null));
    markers.current = [];
    clusterer.current?.clearMarkers?.();

    const normalize = (n: MapNode) => ({
      ...n,
      lat: n.lat ?? n.latitude,
      lng: n.lng ?? n.longitude,
    });

    const subject = nodes.find((n) => n.isSubject);
    if (!subject) {
      console.warn('⚠️ No subject property found');
      return;
    }

    const subjectPos = normalize(subject);
    if (!subjectPos.lat || !subjectPos.lng) {
      console.warn('⚠️ Subject property has invalid coordinates');
      return;
    }

    const comparables = nodes
      .filter((n) => !n.isSubject)
      .map(normalize)
      .filter((n) => n.lat && n.lng);

    console.log(`📍 Subject: [${subjectPos.lat}, ${subjectPos.lng}]`);
    console.log(`📍 Comparables: ${comparables.length}`);

    // Calculate statistics
    if (comparables.length > 0) {
      const prices = comparables.map((c) => c.price).sort((a, b) => a - b);
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const median = prices.length % 2
        ? prices[Math.floor(prices.length / 2)]
        : (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2;

      setStats({
        avg: Math.round(avg),
        median: Math.round(median),
      });
    }

    // Create subject marker
    const subjectEl = document.createElement("div");
    subjectEl.className = "px-4 py-2 bg-yellow-400 text-black font-bold rounded-xl shadow-lg";
    subjectEl.innerHTML = "SUBJECT";

    new AdvancedMarkerElement({
      map: map.current,
      position: { lat: subjectPos.lat, lng: subjectPos.lng },
      content: subjectEl,
      zIndex: 1000,
    });

    map.current.setCenter({ lat: subjectPos.lat, lng: subjectPos.lng });

    // Create comparable markers
    const newMarkers = comparables.map((node) => {
      const el = document.createElement("div");
      el.className = "px-3 py-1.5 bg-black text-white rounded-xl text-xs font-bold shadow-lg";
      el.innerHTML = `₹ ${node.price.toLocaleString('en-IN')}`;

      const marker = new AdvancedMarkerElement({
        map: map.current,
        position: { lat: node.lat!, lng: node.lng! },
        content: el,
      });

      return marker;
    });

    markers.current = newMarkers;

    if (window.MarkerClusterer && newMarkers.length > 0) {
      clusterer.current = new window.MarkerClusterer({
        map: map.current,
        markers: newMarkers,
      });
    }

    console.log('✅ Markers rendered successfully');
  };

  useEffect(() => {
    if (map.current && nodes.length > 0) {
      renderMarkers();
    }
  }, [nodes]);

  if (error) {
    return (
      <div className="relative w-full h-[600px] rounded-[32px] overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="text-yellow-400 text-4xl mb-4">⚠️</div>
          <h3 className="text-white font-bold text-xl mb-2">Map Unavailable</h3>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <div className="bg-black/30 rounded-lg p-4 text-left">
            <p className="text-gray-500 text-xs font-bold mb-2">Configure GOOGLE_MAPS_API_KEY in:</p>
            <p className="text-neo-neon text-xs font-mono">• index.html (window.process.env)</p>
            <p className="text-neo-neon text-xs font-mono">• OR .env (VITE_GOOGLE_MAPS_API_KEY)</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-neo-neon text-white rounded-lg text-sm font-bold hover:bg-neo-neon/80"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative w-full h-[600px] rounded-[32px] overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neo-neon border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-bold">Loading Map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] rounded-[32px] overflow-hidden shadow-2xl">
      <div ref={mapRef} className="w-full h-full" />

      {stats && (
        <div className="absolute top-6 left-6 bg-black/80 backdrop-blur-lg text-white p-5 rounded-2xl shadow-neo-glow border border-neo-neon/30">
          <div className="text-[10px] font-black uppercase tracking-wider opacity-70 mb-2">Stats</div>
          <div>
            <div className="text-xs opacity-70">Avg: <span className="font-bold text-lg text-neo-gold">₹ {stats.avg.toLocaleString('en-IN')}</span></div>
            <div className="text-xs opacity-70">Median: <span className="font-bold text-lg text-neo-neon">₹ {stats.median.toLocaleString('en-IN')}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapView;
```

---

## **Quick Fix Checklist:**

1. ✅ **Update `index.html` line 9** - Add your Google Maps API key
2. ✅ **Replace `GoogleMapView.tsx`** - Use the code above
3. ✅ **Check browser console** - Look for the 🔍 debug messages
4. ✅ **Reload page** - Clear cache (Ctrl+Shift+R)

---

## **Expected Console Output (if working):**
```
🔍 Checking window.process.env.GOOGLE_MAPS_API_KEY: ✅ Found
🔍 Checking VITE_GOOGLE_MAPS_API_KEY: ❌ Not found
🔑 Final API Key: AIzaSyC9Uu...
📦 Loading Google Maps...
✅ Google Maps script loaded
✅ MarkerClusterer loaded
🗺️ Initializing map...
✅ Map initialized successfully
