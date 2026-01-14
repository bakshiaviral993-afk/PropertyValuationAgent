import React, { useRef, useState, useEffect } from 'react';
import { MapPin, Navigation, Building, Info } from 'lucide-react';

interface MapNode {
  title: string;
  price: string;
  address: string;
  lat?: number;
  lng?: number;
  latitude?: number;
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
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => console.warn("Spatial permission denied.")
    );
  }, []);

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current) return;
      
      // Check if Google Maps is loaded
      const google = (window as any).google;
      if (!google?.maps) {
        console.warn("Google Maps not loaded yet, retrying...");
        setTimeout(initMap, 500);
        return;
      }

      try {
        console.log("[Map_Diagnostic] Received Nodes:", nodes.length, nodes);

        // Validate and prepare nodes
        const validNodes = nodes.map((node, i) => {
          const lat = node.lat ?? node.latitude;
          const lng = node.lng ?? node.longitude;
          return { ...node, lat, lng, id: i };
        }).filter(n => n.lat !== undefined && n.lng !== undefined && !isNaN(n.lat) && !isNaN(n.lng));

        console.log("[Map_Diagnostic] Plotting", validNodes.length, "validated nodes.");

        // Initialize map only once
        if (!gMapRef.current) {
          const initialCenter = center || (validNodes.length > 0 ? { lat: validNodes[0].lat!, lng: validNodes[0].lng! } : { lat: 18.5204, lng: 73.8567 });
          
          gMapRef.current = new google.maps.Map(mapRef.current, {
            center: initialCenter,
            zoom: 14,
            gestureHandling: 'greedy', // Ensures scrolling works on touch devices
            disableDefaultUI: false,
            styles: [
              { "elementType": "geometry", "stylers": [{ "color": "#0a0a0f" }] },
              { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
              { "elementType": "labels.text.stroke", "stylers": [{ "color": "#0a0a0f" }] },
              { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
              { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
            ]
          });
          
          setMapReady(true);
          console.log("[Map_Diagnostic] Map initialized successfully");
        }

        const map = gMapRef.current;
        const bounds = new google.maps.LatLngBounds();

        // Clear existing markers
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        // Add user location marker
        if (userLoc) {
          const userMarker = new google.maps.Marker({
            map,
            position: userLoc,
            title: "Your Location",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: "#FF6B9D",
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "#ffffff"
            }
          });
          markersRef.current.push(userMarker);
          bounds.extend(userLoc);
          console.log("[Map_Diagnostic] User location marker added");
        }

        // Add property markers
        validNodes.forEach((node, idx) => {
          const pos = { lat: node.lat!, lng: node.lng! };
          
          const marker = new google.maps.Marker({
            map,
            position: pos,
            title: node.title,
            label: {
              text: node.price.length > 8 ? node.price.substring(0, 7) + ".." : node.price,
              color: "#ffffff",
              fontSize: "10px",
              fontWeight: "900"
            }
          });

          markersRef.current.push(marker);
          bounds.extend(pos);

          const dist = userLoc ? getDistance(userLoc.lat, userLoc.lng, pos.lat, pos.lng) : null;
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 12px; min-width: 180px; background: #0a0a0f; color: white; border-radius: 8px;">
                <div style="font-weight: 900; color: #585FD8; font-size: 10px; text-transform: uppercase;">${node.title}</div>
                <div style="font-weight: 900; font-size: 16px; color: #00F6FF; margin: 4px 0;">${node.price}</div>
                <div style="color: #64748b; font-size: 10px; margin-bottom: 8px;">${node.address}</div>
                ${dist !== null ? `<div style="color: #FF6B9D; font-size: 9px; font-weight: 900;">${dist.toFixed(1)} KM AWAY</div>` : ''}
              </div>
            `
          });

          marker.addListener("click", () => {
            infoWindow.open(map, marker);
          });

          console.log(`[Map_Diagnostic] Marker ${idx + 1} added: ${node.title}`);
        });

        // Fit bounds if we have nodes
        if (validNodes.length > 0 || userLoc) {
          map.fitBounds(bounds);
          
          // Adjust zoom after fitting bounds
          const listener = google.maps.event.addListenerOnce(map, "idle", () => {
            if (map.getZoom() > 16) map.setZoom(16);
          });
          
          console.log("[Map_Diagnostic] Bounds fitted and zoom adjusted");
        }

      } catch (error) {
        console.error("[Map_Error] Failed to initialize map:", error);
        setMapReady(false);
      }
    };

    // Start initialization
    initMap();
  }, [nodes, center, userLoc]);

  return (
    <div className="relative w-full h-[550px] rounded-[48px] border border-white/10 group shadow-neo-glow transition-all hover:border-white/20">
      <div ref={mapRef} className="w-full h-full rounded-[48px]" />
      <div className="absolute top-8 left-8 bg-neo-bg/90 backdrop-blur-xl p-5 rounded-[32px] border border-white/10 shadow-neo-glow pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-neo-neon animate-pulse" />
          <span className="text-[10px] font-black text-neo-neon uppercase tracking-widest">
            {mapReady ? 'Active Mapping' : 'Initializing Maps...'}
          </span>
        </div>
        <p className="text-sm text-white font-black mt-1">{nodes.length} Grounded Nodes</p>
      </div>
    </div>
  );
};

export default GoogleMapView;
