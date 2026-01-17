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

const MAP_ID = "DEMO_MAP_ID";

declare global {
  interface Window {
    google: any;
    MarkerClusterer: any;
  }
}

const GoogleMapView: React.FC<GoogleMapViewProps> = ({ nodes }) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const clustererRef = useRef<any>(null);

  const [stats, setStats] = useState<{ avg: number; median: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Get API key
  const getApiKey = (): string | null => {
    const windowKey = (window as any).process?.env?.GOOGLE_MAPS_API_KEY;
    const viteKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    return windowKey || viteKey || null;
  };

  // Load scripts
  useEffect(() => {
    const loadScripts = async () => {
      try {
        const apiKey = getApiKey();

        if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
          throw new Error('Google Maps API key not configured');
        }

        console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...');

        // Check if already loaded
        if (window.google?.maps && window.MarkerClusterer) {
          console.log('✅ Scripts already loaded');
          setIsMounted(true);
          return;
        }

        // Load Google Maps
        if (!window.google?.maps) {
          console.log('📦 Loading Google Maps...');
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker,geometry,visualization&loading=async`;
            script.async = true;
            script.defer = true;
            script.onload = () => {
              console.log('✅ Google Maps loaded');
              resolve();
            };
            script.onerror = () => reject(new Error('Failed to load Google Maps'));
            document.head.appendChild(script);
          });
        }

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
            script.onerror = () => reject(new Error('Failed to load MarkerClusterer'));
            document.head.appendChild(script);
          });
        }

        console.log('✅ All scripts loaded successfully');
        setIsMounted(true);
      } catch (err: any) {
        console.error('❌ Script loading error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    loadScripts();
  }, []);

  // Initialize map after scripts are loaded and DOM is ready
  useEffect(() => {
    if (!isMounted) {
      console.log('⏳ Waiting for scripts to load...');
      return;
    }

    if (!mapRef.current) {
      console.log('⏳ Waiting for map container...');
      return;
    }

    if (!window.google?.maps) {
      console.error('❌ Google Maps not available');
      setError('Google Maps failed to load');
      setIsLoading(false);
      return;
    }

    console.log('🗺️ Initializing map...');
    console.log('📍 Map container:', mapRef.current);

    try {
      const google = window.google;

      // Create map
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: { lat: 18.5204, lng: 73.8567 },
        zoom: 14,
        mapId: MAP_ID,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      console.log('✅ Map created successfully');
      setIsLoading(false);
      setError(null);

      // Render markers if nodes are available
      if (nodes.length > 0) {
        setTimeout(() => renderMarkers(), 500);
      }
    } catch (err: any) {
      console.error('❌ Map initialization error:', err);
      setError(`Map initialization failed: ${err.message}`);
      setIsLoading(false);
    }
  }, [isMounted, mapRef.current]);

  // Render markers when nodes change
  useEffect(() => {
    if (mapInstance.current && nodes.length > 0 && !isLoading) {
      console.log('🎯 Nodes changed, rendering markers...');
      renderMarkers();
    }
  }, [nodes, isLoading]);

  const renderMarkers = () => {
    if (!mapInstance.current || !window.google?.maps) {
      console.warn('⚠️ Map or Google not ready');
      return;
    }

    if (nodes.length === 0) {
      console.warn('⚠️ No nodes to render');
      return;
    }

    console.log(`🎯 Rendering ${nodes.length} markers...`);

    const google = window.google;
    const AdvancedMarkerElement = google.maps.marker?.AdvancedMarkerElement;

    if (!AdvancedMarkerElement) {
      console.error('❌ AdvancedMarkerElement not available');
      setError('Advanced markers not supported. Using fallback.');
      return;
    }

    // Clear existing markers
    markersRef.current.forEach((m) => (m.map = null));
    markersRef.current = [];
    clustererRef.current?.clearMarkers?.();

    const normalize = (n: MapNode) => ({
      ...n,
      lat: n.lat ?? n.latitude,
      lng: n.lng ?? n.longitude,
    });

    const subject = nodes.find((n) => n.isSubject);
    const comparables = nodes
      .filter((n) => !n.isSubject)
      .map(normalize)
      .filter((n) => n.lat && n.lng);

    console.log('📍 Subject:', subject ? 'Found' : 'Not found');
    console.log('📍 Comparables:', comparables.length);

    // Calculate stats
    if (comparables.length > 0) {
      const prices = comparables.map((c) => c.price).sort((a, b) => a - b);
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const median = prices.length % 2
        ? prices[Math.floor(prices.length / 2)]
        : (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2;

      setStats({ avg: Math.round(avg), median: Math.round(median) });
    }

    // Create subject marker if exists
    if (subject) {
      const subjectPos = normalize(subject);
      if (subjectPos.lat && subjectPos.lng) {
        const subjectEl = document.createElement("div");
        subjectEl.className = "px-4 py-2 bg-yellow-400 text-black font-bold rounded-xl shadow-lg";
        subjectEl.innerHTML = "SUBJECT";

        new AdvancedMarkerElement({
          map: mapInstance.current,
          position: { lat: subjectPos.lat, lng: subjectPos.lng },
          content: subjectEl,
          zIndex: 1000,
        });

        mapInstance.current.setCenter({ lat: subjectPos.lat, lng: subjectPos.lng });
        console.log('✅ Subject marker created');
      }
    }

    // Create comparable markers
    const newMarkers = comparables.map((node, idx) => {
      const el = document.createElement("div");
      el.className = "px-3 py-1.5 bg-black text-white rounded-xl text-xs font-bold shadow-lg hover:bg-neo-neon transition-all cursor-pointer";
      el.innerHTML = `₹ ${node.price.toLocaleString('en-IN')}`;

      const marker = new AdvancedMarkerElement({
        map: mapInstance.current,
        position: { lat: node.lat!, lng: node.lng! },
        content: el,
      });

      return marker;
    });

    markersRef.current = newMarkers;
    console.log(`✅ Created ${newMarkers.length} comparable markers`);

    // Create clusterer
    if (window.MarkerClusterer && newMarkers.length > 0) {
      clustererRef.current = new window.MarkerClusterer({
        map: mapInstance.current,
        markers: newMarkers,
      });
      console.log('✅ Clusterer created');
    }
  };

  // Error state
  if (error && !isLoading) {
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
            className="mt-4 px-6 py-2 bg-neo-neon text-white rounded-xl text-sm font-bold hover:bg-neo-neon/80 transition-all"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="relative w-full h-[600px] rounded-[32px] overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neo-neon border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-bold text-lg">Loading Map...</p>
          <p className="text-gray-400 text-sm mt-2">Initializing Google Maps</p>
        </div>
      </div>
    );
  }

  // Map display
  return (
    <div className="relative w-full h-[600px] rounded-[32px] overflow-hidden shadow-2xl bg-gray-900">
      <div 
        ref={mapRef} 
        className="w-full h-full"
        style={{ minHeight: '600px' }}
      />

      {stats && (
        <div className="absolute top-6 left-6 bg-black/80 backdrop-blur-lg text-white p-5 rounded-2xl shadow-neo-glow border border-neo-neon/30 z-10">
          <div className="text-[10px] font-black uppercase tracking-wider opacity-70 mb-2">
            Comparable Stats
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-xs opacity-70">Avg:</span>
              <span className="font-bold text-lg text-neo-gold">
                ₹ {stats.avg.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs opacity-70">Median:</span>
              <span className="font-bold text-lg text-neo-neon">
                ₹ {stats.median.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}

      {nodes.length > 0 && (
        <div className="absolute top-6 right-6 bg-neo-neon/90 backdrop-blur-lg text-white px-4 py-2 rounded-xl shadow-neo-glow z-10">
          <span className="text-xs font-black uppercase tracking-wider">
            {nodes.filter(n => !n.isSubject).length} Properties
          </span>
        </div>
      )}
    </div>
  );
};

export default GoogleMapView;
