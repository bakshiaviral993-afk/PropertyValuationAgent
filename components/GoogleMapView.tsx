import React, { useRef, useState, useEffect } from 'react';
import { MapPin, Navigation, Info } from 'lucide-react';

interface MapNode {
  title: string;
  price: string;
  address: string;
  lat?: number;
  lng?: number;
  isSubject?: boolean;
}

interface GoogleMapViewProps {
  nodes: MapNode[];
  center?: { lat: number; lng: number };
}

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const GoogleMapView: React.FC<GoogleMapViewProps> = ({ nodes, center }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => console.warn("Spatial permission denied.")
    );
  }, []);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || !(window as any).google) return;
      
      const { Map } = await (window as any).google.maps.importLibrary("maps") as any;
      const { AdvancedMarkerElement, PinElement } = await (window as any).google.maps.importLibrary("marker") as any;

      // Fallback center logic
      const mapCenter = center || (nodes.find(n => n.lat && n.lng) || { lat: 19.0760, lng: 72.8777 });

      const map = new Map(mapRef.current, {
        center: mapCenter,
        zoom: 13,
        mapId: "DEMO_MAP_ID",
        disableDefaultUI: true,
        styles: [
          { "elementType": "geometry", "stylers": [{ "color": "#1a1a2e" }] },
          { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
          { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#2c2c44" }] },
          { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0a0a0f" }] }
        ]
      });

      // User Marker
      if (userLoc) {
        const userPin = new PinElement({ background: "#FF6B9D", borderColor: "#fff", glyphColor: "#fff", scale: 0.8 });
        new AdvancedMarkerElement({ map, position: userLoc, title: "Your Location", content: userPin.element });
      }

      // Property Markers
      nodes.forEach((node) => {
        if (node.lat && node.lng) {
          const color = node.isSubject ? "#585FD8" : "#B4FF5C";
          const glyphColor = node.isSubject ? "#fff" : "#000";
          const pin = new PinElement({ background: color, borderColor: "#fff", glyphColor: glyphColor, scale: node.isSubject ? 1.2 : 1.0 });
          
          const marker = new AdvancedMarkerElement({ 
            map, 
            position: { lat: node.lat, lng: node.lng }, 
            title: node.title, 
            content: pin.element 
          });

          // Distance logic
          let distanceText = "";
          if (userLoc) {
            const dist = getDistance(userLoc.lat, userLoc.lng, node.lat, node.lng);
            distanceText = `<div style="color: #94a3b8; font-size: 8px; font-weight: 800; margin-top: 4px;">${dist.toFixed(1)} KM FROM YOU</div>`;
          }

          const infoWindow = new (window as any).google.maps.InfoWindow({
            content: `
              <div style="padding: 12px; min-width: 140px; font-family: 'Plus Jakarta Sans', sans-serif;">
                <div style="font-weight: 900; color: #fff; font-size: 10px; margin-bottom: 2px; text-transform: uppercase;">${node.title}</div>
                <div style="color: #585FD8; font-weight: 900; font-size: 14px;">${node.price}</div>
                ${distanceText}
              </div>
            `
          });

          marker.addListener("click", () => {
            infoWindow.open(map, marker);
          });
        }
      });
    };

    initMap();
  }, [nodes, center, userLoc]);

  return (
    <div className="relative w-full h-[600px] rounded-[40px] overflow-hidden border border-white/10 group shadow-neo-glow">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-6 right-6 z-10 flex flex-col gap-3">
        <div className="bg-neo-bg/90 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-neo-glow animate-in slide-in-from-right duration-500">
           <span className="text-[8px] font-black text-neo-neon uppercase block mb-1 tracking-widest">Grounding Layer</span>
           <p className="text-xs text-white font-black">{nodes.length} Spatial Nodes Detected</p>
        </div>
        {userLoc && (
           <div className="bg-neo-bg/90 backdrop-blur-xl px-4 py-2 rounded-2xl border border-neo-pink/20 flex items-center gap-2 shadow-pink-glow">
              <Navigation size={12} className="text-neo-pink animate-pulse" />
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">User Sync Active</span>
           </div>
        )}
      </div>
      <div className="absolute bottom-6 left-6 right-6 flex justify-center z-10 pointer-events-none">
         <div className="bg-neo-bg/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/5 flex items-center gap-4">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-neo-neon" /><span className="text-[8px] font-black text-gray-500 uppercase">Fair Value</span></div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#B4FF5C]" /><span className="text-[8px] font-black text-gray-500 uppercase">Market Comps</span></div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-neo-pink" /><span className="text-[8px] font-black text-gray-500 uppercase">You</span></div>
         </div>
      </div>
    </div>
  );
};

export default GoogleMapView;