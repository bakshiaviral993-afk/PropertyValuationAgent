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
  nodes?: MapNode[];
  center?: { lat: number; lng: number };
  showEssentials?: boolean;
}

const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  nodes = [],
  center,
  showEssentials = false,
}) => {
  const safeNodes = Array.isArray(nodes) ? nodes : [];

  const mapRef = useRef<HTMLDivElement>(null);
  const gMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          setLoadError('Google Maps API key missing');
          return;
        }

        if (!(window as any).google?.maps) {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
          script.async = true;
          document.head.appendChild(script);
          await new Promise(res => (script.onload = res));
        }

        const google = (window as any).google;
        const validNodes = safeNodes
          .map(n => ({
            ...n,
            lat: n.lat ?? n.latitude,
            lng: n.lng ?? n.longitude,
          }))
          .filter(n => typeof n.lat === 'number' && typeof n.lng === 'number');

        if (!gMapRef.current) {
          gMapRef.current = new google.maps.Map(mapRef.current, {
            center: center ?? { lat: 18.5204, lng: 73.8567 },
            zoom: 14,
          });
          setMapReady(true);
        }

        const map = gMapRef.current;
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        validNodes.forEach(node => {
          const marker = new google.maps.Marker({
            map,
            position: { lat: node.lat!, lng: node.lng! },
            title: node.title,
          });
          markersRef.current.push(marker);
        });
      } catch (err: any) {
        console.error('[Map_Error]', err);
        setLoadError('Failed to load map');
      }
    };

    initMap();
  }, [safeNodes, center]);

  const propertyCount = safeNodes.filter(n => !n?.isEssential).length;
  const essentialCount = safeNodes.filter(n => n?.isEssential).length;

  return (
    <div className="relative w-full h-[550px] rounded-[48px] border border-white/10">
      <div ref={mapRef} className="w-full h-full rounded-[48px]" />

      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white rounded-[48px]">
          {loadError}
        </div>
      )}

      <div className="absolute top-6 left-6 text-xs text-white font-bold">
        {showEssentials && essentialCount > 0
          ? `${propertyCount} Properties • ${essentialCount} Essentials`
          : `${safeNodes.length} Nodes`}
      </div>
    </div>
  );
};

export default GoogleMapView;
