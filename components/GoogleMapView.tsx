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
  const markersRef = useRef<any[]>([]);
  const gMapRef = useRef<any>(null);

  useEffect(() => {
    console.log(`[Map_Recon] Plotting ${nodes.length} spatial nodes.`);
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => console.warn("Spatial permission denied. Map centering may be inaccurate.")
    );
  }, [nodes]);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || !(window as any).google) return;
      
      const { Map, LatLngBounds } = await (window as any).google.maps.importLibrary("maps") as any;
      const { AdvancedMarkerElement, PinElement } = await (window as any).google.maps.importLibrary("marker") as any;

      if (!gMapRef.current) {
        const initialCenter = center || (nodes.find(n => n.lat && n.lng) || { lat: 19.0760, lng: 72.8777 });
        gMapRef.current = new Map(mapRef.current, {
          center: initialCenter,
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
      }

      const map = gMapRef.current;
      const bounds = new LatLngBounds();

      // Clear old markers
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];

      // Add user location marker
      if (userLoc) {
        const userPin = new PinElement({ background: "#FF6B9D", borderColor: "#fff", glyphColor: "#fff", scale: 0.8 });
        const userMarker = new AdvancedMarkerElement({ map, position: userLoc, title: "Your Location", content: userPin.element });
        markersRef.current.push(userMarker);
        bounds.extend(userLoc);
      }

      // Add property nodes
      nodes.forEach((node, index) => {
        // Fallback for missing coordinates: slightly jitter around center to show variety
        const lat = node.lat || (center?.lat || 19.0760) + (Math.random() - 0.5) * 0.01;
        const lng = node.lng || (center?.lng || 72.8777) + (Math.random() - 0.5) * 0.01;
        
        const pos = { lat, lng };
        const color = node.isSubject ? "#585FD8" : "#B4FF5C";
        const glyphColor = node.isSubject ? "#fff" : "#000";
        const pin = new PinElement({ 
          background: color, 
          borderColor: "#fff", 
          glyphColor: glyphColor, 
          scale: node.isSubject ? 1.2 : 1.0 
        });
        
        const marker = new AdvancedMarkerElement({ 
          map, 
          position: pos, 
          title: node.title, 
          content: pin.element 
        });

        markersRef.current.push(marker);
        bounds.extend(pos);

        const dist = userLoc ? getDistance(userLoc.lat, userLoc.lng, lat, lng) : null;
        const infoWindow = new (window as any).google.maps.InfoWindow({
          content: `
            <div style="padding: 12px; min-width: 140px; background: #0a0a0f; color: white; border-radius: 12px; font-family: sans-serif;">
              <div style="font-weight: 900; color: #fff; font-size: 10px; margin-bottom: 2px; text-transform: uppercase;">${node.title}</div>
              <div style="color: ${color}; font-weight: 900; font-size: 14px;">${node.price}</div>
              <div style="color: #64748b; font-size: 9px; font-weight: 700; margin-top: 2px;">${node.address}</div>
              ${dist !== null ? `<div style="color: #FF6B9D; font-size: 8px; font-weight: 800; margin-top: 4px;">${dist.toFixed(1)} KM FROM YOU</div>` : ''}
            </div>
          `
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });
      });

      if (nodes.length > 0) {
        map.fitBounds(bounds);
        const listener = (window as any).google.maps.event.addListener(map, "idle", () => {
          if (map.getZoom() > 16) map.setZoom(16);
          (window as any).google.maps.event.removeListener(listener);
        });
      }
    };

    initMap();
  }, [nodes, center, userLoc]);

  return (
    <div className="relative w-full h-[600px] rounded-[40px] overflow-hidden border border-white/10 group shadow-neo-glow animate-in fade-in duration-700">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-6 right-6 z-10 flex flex-col gap-3">
        <div className="bg-neo-bg/90 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-neo-glow">
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
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-neo-neon" /><span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Target</span></div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#B4FF5C]" /><span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Comps</span></div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-neo-pink" /><span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">You</span></div>
         </div>
      </div>
    </div>
  );
};

export default GoogleMapView;