import React, { useEffect, useRef, useState } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

interface MapNode {
  title: string;
  price: number;
  address: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  isSubject?: boolean;
  isEssential?: boolean;
}

const loadGoogleMaps = (apiKey: string) =>
  new Promise<void>((resolve) => {
    if ((window as any).google?.maps) return resolve();

    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js` +
      `?key=${apiKey}&libraries=marker,geometry,visualization`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });

const GoogleMapView: React.FC<{ nodes: MapNode[] }> = ({ nodes }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const markers = useRef<any[]>([]);
  const clusterer = useRef<MarkerClusterer | null>(null);
  const heatmap = useRef<google.maps.visualization.HeatmapLayer | null>(null);

  const [stats, setStats] = useState<{ avg: number; median: number } | null>(
    null
  );

  useEffect(() => {
    const init = async () => {
      if (!mapRef.current) return;

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error("❌ Google Maps API key missing");
        return;
      }

      await loadGoogleMaps(apiKey);
      const google = (window as any).google;

      // ✅ Runtime access (THIS FIXES YOUR BUILD)
      const AdvancedMarkerElement =
        google.maps.marker.AdvancedMarkerElement;

      if (!map.current) {
        map.current = new google.maps.Map(mapRef.current, {
          center: { lat: 18.5204, lng: 73.8567 },
          zoom: 14,
          mapId: "QUANTCASA_MAP",
        });
      }

      const normalize = (n: MapNode) => ({
        ...n,
        lat: n.lat ?? n.latitude,
        lng: n.lng ?? n.longitude,
      });

      const subject = nodes.find((n) => n.isSubject);
      if (!subject) return;

      const subjectPos = normalize(subject);

      // Cleanup
      markers.current.forEach((m) => (m.map = null));
      markers.current = [];
      clusterer.current?.clearMarkers();
      heatmap.current?.setMap(null);

      // Auto-select comparables (≤ 3km)
      const comparables = nodes
        .filter((n) => !n.isSubject)
        .map(normalize)
        .filter((n) => {
          if (!n.lat || !n.lng) return false;
          const distance =
            google.maps.geometry.spherical.computeDistanceBetween(
              new google.maps.LatLng(subjectPos.lat!, subjectPos.lng!),
              new google.maps.LatLng(n.lat!, n.lng!)
            );
          return distance <= 3000;
        });

      // Stats
      const prices = comparables.map((c) => c.price).sort((a, b) => a - b);
      const avg =
        prices.reduce((a, b) => a + b, 0) / Math.max(prices.length, 1);
      const median =
        prices.length % 2
          ? prices[Math.floor(prices.length / 2)]
          : (prices[prices.length / 2 - 1] +
              prices[prices.length / 2]) /
            2;

      setStats({
        avg: Math.round(avg),
        median: Math.round(median),
      });

      // SUBJECT MARKER (DRAGGABLE)
      const subjectEl = document.createElement("div");
      subjectEl.className =
        "px-4 py-2 bg-yellow-400 text-black font-bold rounded-xl shadow-xl";
      subjectEl.innerHTML = "SUBJECT";

      const subjectMarker = new AdvancedMarkerElement({
        map: map.current,
        position: { lat: subjectPos.lat!, lng: subjectPos.lng! },
        content: subjectEl,
        gmpDraggable: true,
        zIndex: 1000,
      });

      subjectMarker.addListener("dragend", () => init());

      // Comparable markers
      comparables.forEach((node) => {
        const el = document.createElement("div");
        el.className =
          "px-3 py-1 bg-black text-white rounded-xl text-xs font-bold shadow";
        el.innerHTML = `₹ ${node.price}`;

        const marker = new AdvancedMarkerElement({
          map: map.current,
          position: { lat: node.lat!, lng: node.lng! },
          content: el,
        });

        markers.current.push(marker);
      });

      // Cluster comparables only
      clusterer.current = new MarkerClusterer({
        map: map.current,
        markers: markers.current,
      });

      // Heatmap
      heatmap.current = new google.maps.visualization.HeatmapLayer({
        data: comparables.map(
          (c) => new google.maps.LatLng(c.lat!, c.lng!)
        ),
        radius: 40,
      });

      heatmap.current.setMap(map.current);
    };

    init();
  }, [nodes]);

  return (
    <div className="relative w-full h-[600px] rounded-[32px] overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />

      {stats && (
        <div className="absolute top-6 left-6 bg-black text-white p-4 rounded-xl shadow-xl">
          <div className="text-xs opacity-70">Comparable Stats</div>
          <div className="mt-1 font-bold">Avg: ₹ {stats.avg}</div>
          <div className="text-sm">Median: ₹ {stats.median}</div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapView;
