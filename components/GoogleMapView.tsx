import React, { useRef, useState, useEffect } from 'react';

interface MapNode {
  title: string;
  price: string;
  address: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  isSubject?: boolean;
  isEssential?: boolean;
  essentialType?: string;
  markerColor?: string;
  contact?: string;
  rating?: string;
}

interface GoogleMapViewProps {
  nodes: MapNode[];
  center?: { lat: number; lng: number };
  showEssentials?: boolean;
}

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.maps) {
      resolve();
      return;
    }

    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      const checkInterval = setInterval(() => {
        if ((window as any).google?.maps) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });
};

const GoogleMapView: React.FC<GoogleMapViewProps> = ({ nodes = [], center, showEssentials = false }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const markersRef = useRef<any[]>([]);
  const gMapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => console.warn("Spatial permission denied.")
    );
  }, []);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
        
        if (!apiKey) {
          setLoadError('Google Maps API key not configured');
          console.error('[Map_Error] No API key found');
          return;
        }

        console.log('[Map_Diagnostic] Loading Google Maps...');
        await loadGoogleMapsScript(apiKey);
        
        const google = (window as any).google;
        if (!google?.maps) throw new Error('Google Maps failed to load');

        console.log("[Map_Diagnostic] Received Nodes:", nodes.length, nodes);

        const validNodes = nodes.map((node, i) => {
          const lat = node.lat ?? node.latitude;
          const lng = node.lng ?? node.longitude;
          return { ...node, lat, lng, id: i };
        }).filter(n => n.lat !== undefined && n.lng !== undefined && !isNaN(n.lat) && !isNaN(n.lng));

        console.log("[Map_Diagnostic] Plotting", validNodes.length, "validated nodes.");

        if (!gMapRef.current) {
          const initialCenter = center || (validNodes.length > 0 ? { lat: validNodes[0].lat!, lng: validNodes[0].lng! } : { lat: 18.5204, lng: 73.8567 });
          
          gMapRef.current = new google.maps.Map(mapRef.current, {
            center: initialCenter,
            zoom: 14,
            gestureHandling: 'greedy',
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
          setLoadError(null);
          console.log("[Map_Diagnostic] Map initialized successfully");
        }

        const map = gMapRef.current;
        const bounds = new google.maps.LatLngBounds();

        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        // User location marker
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
            },
            zIndex: 1000
          });
          markersRef.current.push(userMarker);
          bounds.extend(userLoc);
        }

        // Property and Essential markers
        validNodes.forEach((node, idx) => {
          const pos = { lat: node.lat!, lng: node.lng! };
          
          let markerIcon;
          let labelText;
          let labelColor;
          
          if (node.isEssential) {
            // Essential service marker - use custom colored pin
            markerIcon = {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: node.markerColor || '#FCD34D',
              fillOpacity: 1,
              strokeWeight: 3,
              strokeColor: "#ffffff"
            };
            labelText = node.essentialType?.charAt(0).toUpperCase() || 'E';
            labelColor = "#ffffff";
          } else {
            // Property marker - standard with price
            markerIcon = undefined; // Use default red pin
            labelText = node.price.length > 8 ? node.price.substring(0, 7) + ".." : node.price;
            labelColor = "#ffffff";
          }

          const marker = new google.maps.Marker({
            map,
            position: pos,
            title: node.title,
            icon: markerIcon,
            label: markerIcon ? {
              text: labelText,
              color: labelColor,
              fontSize: "12px",
              fontWeight: "900"
            } : {
              text: labelText,
              color: labelColor,
              fontSize: "10px",
              fontWeight: "900"
            },
            zIndex: node.isEssential ? 500 : 100
          });

          markersRef.current.push(marker);
          bounds.extend(pos);

          const dist = userLoc ? getDistance(userLoc.lat, userLoc.lng, pos.lat, pos.lng) : null;
          
          let infoContent;
          if (node.isEssential) {
            infoContent = `
              <div style="padding: 12px; min-width: 200px; background: #0a0a0f; color: white; border-radius: 8px;">
                <div style="font-weight: 900; color: ${node.markerColor || '#FCD34D'}; font-size: 10px; text-transform: uppercase; margin-bottom: 4px;">${node.essentialType || 'Essential Service'}</div>
                <div style="font-weight: 900; font-size: 14px; color: #ffffff; margin: 4px 0;">${node.title}</div>
                <div style="color: #64748b; font-size: 10px; margin-bottom: 8px;">${node.address}</div>
                ${node.rating ? `<div style="color: #FCD34D; font-size: 10px; font-weight: 900; margin-bottom: 4px;">⭐ ${node.rating}</div>` : ''}
                ${node.contact ? `<div style="color: #00F6FF; font-size: 10px; font-weight: 900; margin-bottom: 4px;">📞 ${node.contact}</div>` : ''}
                ${dist !== null ? `<div style="color: #FF6B9D; font-size: 9px; font-weight: 900;">${dist.toFixed(1)} KM AWAY</div>` : ''}
              </div>
            `;
          } else {
            infoContent = `
              <div style="padding: 12px; min-width: 180px; background: #0a0a0f; color: white; border-radius: 8px;">
                <div style="font-weight: 900; color: #585FD8; font-size: 10px; text-transform: uppercase;">${node.title}</div>
                <div style="font-weight: 900; font-size: 16px; color: #00F6FF; margin: 4px 0;">${node.price}</div>
                <div style="color: #64748b; font-size: 10px; margin-bottom: 8px;">${node.address}</div>
                ${dist !== null ? `<div style="color: #FF6B9D; font-size: 9px; font-weight: 900;">${dist.toFixed(1)} KM AWAY</div>` : ''}
              </div>
            `;
          }

          const infoWindow = new google.maps.InfoWindow({
            content: infoContent
          });

          marker.addListener("click", () => {
            infoWindow.open(map, marker);
          });

          console.log(`[Map_Diagnostic] Marker ${idx + 1} added: ${node.title} ${node.isEssential ? '(Essential)' : '(Property)'}`);
        });

        if (validNodes.length > 0 || userLoc) {
          map.fitBounds(bounds);
          google.maps.event.addListenerOnce(map, "idle", () => {
            if (map.getZoom() > 16) map.setZoom(16);
          });
          console.log("[Map_Diagnostic] Bounds fitted");
        }

      } catch (error: any) {
        console.error("[Map_Error]", error);
        setLoadError(error.message || 'Failed to load map');
        setMapReady(false);
      }
    };

    initMap();
  }, [nodes, center, userLoc]);

  const propertyCount = nodes.filter(n => !n.isEssential).length;
  const essentialCount = nodes.filter(n => n.isEssential).length;

  return (
    <div className="relative w-full h-[550px] rounded-[48px] border border-white/10 group shadow-neo-glow transition-all hover:border-white/20">
      <div ref={mapRef} className="w-full h-full rounded-[48px]" />
      
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-neo-bg/90 backdrop-blur-xl rounded-[48px]">
          <div className="text-center p-8">
            <div className="text-neo-pink text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-black text-white mb-2">Map Loading Failed</h3>
            <p className="text-sm text-gray-400 mb-4">{loadError}</p>
            <p className="text-xs text-gray-500">Check console for details</p>
          </div>
        </div>
      )}
      
      <div className="absolute top-8 left-8 bg-neo-bg/90 backdrop-blur-xl p-5 rounded-[32px] border border-white/10 shadow-neo-glow pointer-events-none">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-neo-neon animate-pulse" />
          <span className="text-[10px] font-black text-neo-neon uppercase tracking-widest">
            {loadError ? 'Map Error' : mapReady ? 'Active Mapping' : 'Loading...'}
          </span>
        </div>
        {showEssentials && essentialCount > 0 ? (
          <div className="space-y-1">
            <p className="text-xs text-white font-black">{propertyCount} Properties</p>
            <p className="text-xs text-neo-gold font-black">{essentialCount} Essentials</p>
          </div>
        ) : (
          <p className="text-sm text-white font-black">{nodes.length} Grounded Nodes</p>
        )}
      </div>

      {showEssentials && essentialCount > 0 && (
        <div className="absolute bottom-8 left-8 right-8 bg-neo-bg/90 backdrop-blur-xl p-4 rounded-[24px] border border-white/10 shadow-neo-glow pointer-events-none">
          <div className="flex flex-wrap gap-3 text-[9px] font-black uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#585FD8]" />
              <span className="text-gray-400">Properties</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF6B9D]" />
              <span className="text-gray-400">Emergency</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#585FD8]" />
              <span className="text-gray-400">Daily</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FCD34D]" />
              <span className="text-gray-400">Routine</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapView;
