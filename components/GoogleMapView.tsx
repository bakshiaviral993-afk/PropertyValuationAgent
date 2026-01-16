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

const MAP_ID = "2185f915fc843bc0827abfdd"; // Use your actual Map ID from Google Cloud Console

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

  // Get API key from either window.process.env or import.meta.env
  const getApiKey = (): string | null => {
    const windowKey = (window as any).process?.env?.GOOGLE_MAPS_API_KEY;
    const viteKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    return windowKey || viteKey || null;
  };

  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        const apiKey = getApiKey();

        if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
          throw new Error('Google Maps API key not configured');
        }

        // Check if already loaded
        if (window.google?.maps) {
          initMap();
          return;
        }

        // Load Google Maps
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker,geometry,visualization&loading=async`;
          script.async = true;
          script.defer = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Google Maps'));
          document.head.appendChild(script);
        });

        // Load MarkerClusterer
        if (!window.MarkerClusterer) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js";
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load MarkerClusterer'));
            document.head.appendChild(script);
          });
        }

        initMap();
      } catch (err: any) {
        console.error('Google Maps loading error:', err);
        setError(err.message || 'Failed to load Google Maps');
        setIsLoading(false);
      }
    };

    loadGoogleMaps();
  }, []);

  const initMap = () => {
    if (!mapRef.current || !window.google?.maps) {
      setError('Map container or Google Maps not available');
      setIsLoading(false);
      return;
    }

    try {
      const google = window.google;

      // Create map
      map.current = new google.maps.Map(mapRef.current, {
        center: { lat: 18.5204, lng: 73.8567 },
        zoom: 14,
        mapId: MAP_ID,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      setIsLoading(false);
      renderMarkers();
    } catch (err: any) {
      console.error('Map initialization error:', err);
      setError('Failed to initialize map');
      setIsLoading(false);
    }
  };

  const renderMarkers = () => {
    if (!map.current || !window.google?.maps || nodes.length === 0) return;

    const google = window.google;
    const AdvancedMarkerElement = google.maps.marker?.AdvancedMarkerElement;

    if (!AdvancedMarkerElement) {
      console.error('AdvancedMarkerElement not available');
      return;
    }

    // Clear existing markers
    markers.current.forEach((m) => (m.map = null));
    markers.current = [];
    clusterer.current?.clearMarkers?.();

    // Normalize coordinates
    const normalize = (n: MapNode) => ({
      ...n,
      lat: n.lat ?? n.latitude,
      lng: n.lng ?? n.longitude,
    });

    const subject = nodes.find((n) => n.isSubject);
    if (!subject) {
      console.warn('No subject property found');
      return;
    }

    const subjectPos = normalize(subject);
    if (!subjectPos.lat || !subjectPos.lng) {
      console.warn('Subject property has invalid coordinates');
      return;
    }

    const comparables = nodes
      .filter((n) => !n.isSubject)
      .map(normalize)
      .filter((n) => n.lat && n.lng);

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
    subjectEl.className = "px-4 py-2 bg-yellow-400 text-black font-bold rounded-xl shadow-lg cursor-pointer hover:scale-110 transition-transform";
    subjectEl.innerHTML = "SUBJECT PROPERTY";

    new AdvancedMarkerElement({
      map: map.current,
      position: { lat: subjectPos.lat, lng: subjectPos.lng },
      content: subjectEl,
      zIndex: 1000,
    });

    // Center map on subject
    map.current.setCenter({ lat: subjectPos.lat, lng: subjectPos.lng });

    // Create comparable markers
    const newMarkers = comparables.map((node) => {
      const el = document.createElement("div");
      el.className = "px-3 py-1.5 bg-black text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer hover:bg-neo-neon hover:scale-110 transition-all";
      el.innerHTML = `
        <div class="font-bold">₹ ${node.price.toLocaleString('en-IN')}</div>
        <div class="text-[10px] opacity-70 mt-0.5">${node.title || node.address}</div>
      `;

      const marker = new AdvancedMarkerElement({
        map: map.current,
        position: { lat: node.lat!, lng: node.lng! },
        content: el,
      });

      return marker;
    });

    markers.current = newMarkers;

    // Create marker cluster
    if (window.MarkerClusterer && newMarkers.length > 0) {
      clusterer.current = new window.MarkerClusterer({
        map: map.current,
        markers: newMarkers,
      });
    }
  };

  useEffect(() => {
    if (map.current && nodes.length > 0) {
      renderMarkers();
    }
  }, [nodes]);

  // Error state
  if (error) {
    return (
      <div className="relative w-full h-[600px] rounded-[32px] overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h3 className="text-white font-bold text-xl mb-2">Map Unavailable</h3>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <div className="bg-black/30 rounded-lg p-4 text-left">
            <p className="text-gray-500 text-xs font-mono">
              Configure GOOGLE_MAPS_API_KEY in:
            </p>
            <p className="text-neo-neon text-xs font-mono mt-1">
              • index.html (window.process.env)
            </p>
            <p className="text-neo-neon text-xs font-mono">
              • OR .env (VITE_GOOGLE_MAPS_API_KEY)
            </p>
          </div>
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
          <p className="text-white font-bold">Loading Map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] rounded-[32px] overflow-hidden shadow-2xl">
      <div ref={mapRef} className="w-full h-full" />

      {stats && (
        <div className="absolute top-6 left-6 bg-black/80 backdrop-blur-lg text-white p-5 rounded-2xl shadow-neo-glow border border-neo-neon/30 min-w-[200px]">
          <div className="text-[10px] font-black uppercase tracking-wider opacity-70 mb-2">
            Comparable Statistics
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs opacity-70">Average:</span>
              <span className="font-bold text-lg text-neo-gold">
                ₹ {stats.avg.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs opacity-70">Median:</span>
              <span className="font-bold text-lg text-neo-neon">
                ₹ {stats.median.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Property count badge */}
      <div className="absolute top-6 right-6 bg-neo-neon/90 backdrop-blur-lg text-white px-4 py-2 rounded-xl shadow-neo-glow">
        <span className="text-xs font-black uppercase tracking-wider">
          {nodes.filter(n => !n.isSubject).length} Comparables
        </span>
      </div>
    </div>
  );
};

export default GoogleMapView;
