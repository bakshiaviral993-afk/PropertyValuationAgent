
import React, { useRef, useState, useEffect } from 'react';
import { MapPin, Navigation, Building, Info } from 'lucide-react';

interface MapNode {
  title: string;
  price: string;
  address: string;
  lat?: number;
  lng?: number;
  latitude?: number;  // Handle both naming conventions
  longitude?: number;
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

const GoogleMapView: React.FC<GoogleMapViewProps> = ({ nodes = [], center }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const markersRef = useRef<any[]>([]);
  const gMapRef = useRef<any>(null);

  useEffect(() => {
    console.log("[Map_Diagnostic] Received Nodes:", nodes);
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => console.warn("Spatial permission denied.")
    );
  }, [nodes]);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || !(window as any).google) return;
      
      const { Map, LatLngBounds } = await (window as any).google.maps.importLibrary("maps") as any;
      const { AdvancedMarkerElement, PinElement } = await (window as any).google.maps.importLibrary("marker") as any;

      // Filter and sanitize nodes
      const validNodes = nodes.map((node, i) => {
        const lat = node.lat ?? node.latitude;
        const lng = node.lng ?? node.longitude;
        return { ...node, lat, lng, id: i };
      }).filter(n => n.lat !== undefined && n.lng !== undefined && !isNaN(n.lat) && !isNaN(n.lng));

      if (!gMapRef.current) {
        const initialCenter = center || (validNodes.length > 0 ? { lat: validNodes[0].lat!, lng: validNodes[0].lng! } : { lat: 18.5204, lng: 73.8567 });
        
        // CRITICAL FIX: Removed mapId which conflicts with custom styles and causes ApiProjectMapError
        gMapRef.current = new Map(mapRef.current, {
          center: initialCenter,
          zoom: 14,
          disableDefaultUI: true,
          styles: [
            { "elementType": "geometry", "stylers": [{ "color": "#0a0a0f" }] },
            { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
            { "elementType": "labels.text.stroke", "stylers": [{ "color": "#0a0a0f" }] },
            { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
            { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
          ]
        });
      }

      const map = gMapRef.current;
      const bounds = new LatLngBounds();

      // Clear existing markers
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];

      if (userLoc) {
        const userPin = new PinElement({ background: "#FF6B9D", borderColor: "#fff", glyphColor: "#fff", scale: 0.8 });
        const userMarker = new AdvancedMarkerElement({ map, position: userLoc, title: "Your Location", content: userPin.element });
        markersRef.current.push(userMarker);
        bounds.extend(userLoc);
      }

      validNodes.forEach((node) => {
        const jitter = (Math.random() - 0.5) * 0.0005;
        const pos = { lat: node.lat! + jitter, lng: node.lng! + jitter };
        
        const tag = document.createElement("div");
        tag.className = "asset-tag animate-in zoom-in duration-300";
        tag.style.cssText = `
          background: ${node.isSubject ? '#585FD8' : '#1a1a2e'};
          color: white;
          padding: 6px 12px;
          border-radius: 12px;
          border: 1px solid ${node.isSubject ? '#fff' : 'rgba(88,95,216,0.4)'};
          font-family: sans-serif;
          font-size: 10px;
          font-weight: 900;
          box-shadow: 0 4px 15px rgba(0,0,0,0.5);
          white-space: nowrap;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        `;
        
        tag.innerHTML = `
          <div style="font-size: 8px; opacity: 0.7; text-transform: uppercase;">${node.title.substring(0, 15)}</div>
          <div style="color: ${node.isSubject ? '#fff' : '#00F6FF'}; font-size: 11px;">${node.price}</div>
        `;

        const marker = new AdvancedMarkerElement({
          map,
          position: pos,
          title: node.title,
          content: tag
        });

        markersRef.current.push(marker);
        bounds.extend(pos);

        const dist = userLoc ? getDistance(userLoc.lat, userLoc.lng, pos.lat, pos.lng) : null;
        const infoWindow = new (window as any).google.maps.InfoWindow({
          content: `
            <div style="padding: 12px; min-width: 180px; background: #0a0a0f; color: white;">
              <div style="font-weight: 900; color: #585FD8; font-size: 10px; text-transform: uppercase;">${node.title}</div>
              <div style="font-weight: 900; font-size: 16px;">${node.price}</div>
              <div style="color: #64748b; font-size: 10px; margin-bottom: 8px;">${node.address}</div>
              ${dist !== null ? `<div style="color: #FF6B9D; font-size: 9px; font-weight: 900;">${dist.toFixed(1)} KM AWAY</div>` : ''}
            </div>
          `
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });
      });

      if (validNodes.length > 0) {
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
    <div className="relative w-full h-[550px] rounded-[48px] overflow-hidden border border-white/10 group shadow-neo-glow transition-all hover:border-white/20">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-8 left-8 bg-neo-bg/90 backdrop-blur-xl p-5 rounded-[32px] border border-white/10 shadow-neo-glow">
           <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-neo-neon animate-pulse" />
             <span className="text-[10px] font-black text-neo-neon uppercase tracking-widest">Grounded Node Map</span>
           </div>
           <p className="text-sm text-white font-black mt-1">{nodes.length} Spatial Points</p>
      </div>
    </div>
  );
};

export default GoogleMapView;
