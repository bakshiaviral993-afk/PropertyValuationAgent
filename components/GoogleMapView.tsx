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

const GoogleMapView: React.FC<GoogleMapViewProps> = ({ nodes }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [stats, setStats] = useState<{ avg: number; median: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize map immediately when component mounts
  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current) {
        console.log('⏳ Map container not ready, retrying...');
        setTimeout(initMap, 100);
        return;
      }

      if (!window.google?.maps) {
        console.log('⏳ Google Maps not loaded, retrying...');
        setTimeout(initMap, 100);
        return;
      }

      console.log('🗺️ Creating map NOW...');

      try {
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: { lat: 18.5204, lng: 73.8567 },
          zoom: 14,
          mapId: 'DEMO_MAP_ID',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        console.log('✅ Map created!');
        setMap(mapInstance);
        setError(null);
      } catch (err: any) {
        console.error('❌ Map error:', err);
        setError(err.message);
      }
    };

    // Start initialization after short delay
    setTimeout(initMap, 100);
  }, []);

  // Render markers when map is ready
  useEffect(() => {
    if (!map || !window.google?.maps || nodes.length === 0) return;

    console.log(`🎯 Rendering ${nodes.length} markers...`);

    const AdvancedMarkerElement = window.google.maps.marker?.AdvancedMarkerElement;
    if (!AdvancedMarkerElement) {
      console.error('❌ AdvancedMarkerElement not available');
      return;
    }

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

    // Calculate stats
    if (comparables.length > 0) {
      const prices = comparables.map((c) => c.price).sort((a, b) => a - b);
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const median = prices.length % 2
        ? prices[Math.floor(prices.length / 2)]
        : (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2;
      setStats({ avg: Math.round(avg), median: Math.round(median) });
    }

    // Subject marker
    if (subject) {
      const subjectPos = normalize(subject);
      if (subjectPos.lat && subjectPos.lng) {
        const el = document.createElement("div");
        el.className = "px-4 py-2 bg-yellow-400 text-black font-bold rounded-xl shadow-lg";
        el.textContent = "SUBJECT";

        new AdvancedMarkerElement({
          map,
          position: { lat: subjectPos.lat, lng: subjectPos.lng },
          content: el,
          zIndex: 1000,
        });

        map.setCenter({ lat: subjectPos.lat, lng: subjectPos.lng });
      }
    }

    // Comparable markers
    const markers = comparables.map((node) => {
      const el = document.createElement("div");
      el.className = "px-3 py-1.5 bg-black text-white rounded-xl text-xs font-bold shadow-lg";
      el.textContent = `₹ ${node.price.toLocaleString('en-IN')}`;

      return new AdvancedMarkerElement({
        map,
        position: { lat: node.lat!, lng: node.lng! },
        content: el,
      });
    });

    // Cluster
    if (window.MarkerClusterer && markers.length > 0) {
      new window.MarkerClusterer({ map, markers });
    }

    console.log('✅ Markers rendered!');
  }, [map, nodes]);

  if (error) {
    return (
      <div className="w-full h-[600px] rounded-[32px] bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h3 className="text-white font-bold mb-2">Map Error</h3>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] rounded-[32px] overflow-hidden shadow-2xl">
      <div ref={mapRef} className="w-full h-full bg-gray-900" />

      {!map && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-neo-neon border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white font-bold">Loading Map...</p>
          </div>
        </div>
      )}

      {stats && map && (
        <div className="absolute top-6 left-6 bg-black/80 backdrop-blur-lg text-white p-4 rounded-xl border border-neo-neon/30 z-10">
          <div className="text-[10px] uppercase opacity-70 mb-1">Stats</div>
          <div className="text-xs">Avg: <span className="font-bold text-neo-gold">₹{stats.avg.toLocaleString('en-IN')}</span></div>
          <div className="text-xs">Med: <span className="font-bold text-neo-neon">₹{stats.median.toLocaleString('en-IN')}</span></div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapView;
