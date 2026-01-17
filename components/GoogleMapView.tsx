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
  const [isReady, setIsReady] = useState(false);

  // Wait for Google Maps to load
  useEffect(() => {
    const checkGoogle = setInterval(() => {
      if (window.google?.maps) {
        console.log('✅ Google Maps detected!');
        clearInterval(checkGoogle);
        setIsReady(true);
      } else {
        console.log('⏳ Waiting for Google Maps...');
      }
    }, 100);

    return () => clearInterval(checkGoogle);
  }, []);

  // Create map when ready
  useEffect(() => {
    if (!isReady || !mapRef.current || map) return;

    console.log('🗺️ Creating map...');

    const newMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: 18.5204, lng: 73.8567 },
      zoom: 14,
      mapId: '2185f915fc843bc0827abfdd',
    });

    setMap(newMap);
    console.log('✅ Map created!');
  }, [isReady, map]);

  // Render markers
  useEffect(() => {
    if (!map || !nodes.length) return;

    console.log(`🎯 Rendering ${nodes.length} markers`);

    const AdvancedMarkerElement = window.google.maps.marker?.AdvancedMarkerElement;
    if (!AdvancedMarkerElement) return;

    const normalize = (n: MapNode) => ({
      ...n,
      lat: n.lat ?? n.latitude,
      lng: n.lng ?? n.longitude,
    });

    const subject = nodes.find(n => n.isSubject);
    const comparables = nodes.filter(n => !n.isSubject).map(normalize).filter(n => n.lat && n.lng);

    // Subject marker
    if (subject) {
      const pos = normalize(subject);
      if (pos.lat && pos.lng) {
        const el = document.createElement("div");
        el.className = "px-4 py-2 bg-yellow-400 text-black font-bold rounded-xl shadow-lg";
        el.textContent = "SUBJECT";

        new AdvancedMarkerElement({
          map,
          position: { lat: pos.lat, lng: pos.lng },
          content: el,
        });

        map.setCenter({ lat: pos.lat, lng: pos.lng });
      }
    }

    // Comparable markers
    comparables.forEach(node => {
      const el = document.createElement("div");
      el.className = "px-3 py-2 bg-black text-white rounded-xl text-xs font-bold shadow-lg";
      el.textContent = `₹${node.price.toLocaleString('en-IN')}`;

      new AdvancedMarkerElement({
        map,
        position: { lat: node.lat!, lng: node.lng! },
        content: el,
      });
    });

    console.log('✅ Markers rendered!');
  }, [map, nodes]);

  if (!isReady) {
    return (
      <div className="w-full h-[600px] rounded-[32px] bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-neo-neon border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-bold">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] rounded-[32px] overflow-hidden shadow-2xl">
      <div ref={mapRef} className="w-full h-full bg-gray-900" />
    </div>
  );
};

export default GoogleMapView;
