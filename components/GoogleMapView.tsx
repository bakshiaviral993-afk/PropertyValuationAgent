"use client";

import { useEffect, useRef } from "react";
import { usePropertyMapStore } from "@/components/store/usePropertyMapStore";

const MAP_ID = "2185f915fc843bc0827abfdd";

declare global {
  interface Window {
    google: any;
    MarkerClusterer: any;
    initMap: () => void;
  }
}

export default function GoogleMapView() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const clusterer = useRef<any>(null);

  const { properties, setSelectedId, setHoveredId } =
    usePropertyMapStore();

  useEffect(() => {
    if (window.google && window.MarkerClusterer) {
      initMap();
      return;
    }

    window.initMap = initMap;

    // Google Maps
    const mapScript = document.createElement("script");
    mapScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&v=weekly&libraries=marker&callback=initMap`;
    mapScript.async = true;
    mapScript.defer = true;

    // MarkerClusterer CDN
    const clusterScript = document.createElement("script");
    clusterScript.src =
      "https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js";
    clusterScript.async = true;

    document.head.appendChild(mapScript);
    document.head.appendChild(clusterScript);
  }, []);

  const initMap = () => {
    if (!mapRef.current || !window.google) return;

    map.current = new google.maps.Map(mapRef.current, {
      center: { lat: 18.5204, lng: 73.8567 },
      zoom: 11,
      mapId: MAP_ID,
    });

    renderMarkers();
  };

  const renderMarkers = () => {
    if (!map.current || !window.google) return;

    // Clear old markers
    markers.current.forEach((m) => (m.map = null));
    markers.current = [];

    const newMarkers = properties.map((p) => {
      const el = document.createElement("div");
      el.className =
        "bg-black text-white px-3 py-1 rounded-xl shadow text-sm cursor-pointer";
      el.innerHTML = `
        ₹${p.price.toLocaleString("en-IN")}
        <div class="text-[10px] opacity-70">${p.address}</div>
      `;

      el.onclick = () => setSelectedId(p.id);

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: map.current,
        position: { lat: p.lat, lng: p.lng },
        content: el,
      });

      marker.addListener("mouseover", () => setHoveredId(p.id));
      marker.addListener("mouseout", () => setHoveredId(null));

      return marker;
    });

    markers.current = newMarkers;

    // Cluster
    if (clusterer.current) clusterer.current.clearMarkers();

    if (window.MarkerClusterer) {
      clusterer.current = new window.MarkerClusterer({
        map: map.current,
        markers: newMarkers,
      });
    }
  };

  useEffect(() => {
    renderMarkers();
  }, [properties]);

  return <div ref={mapRef} className="w-full h-full rounded-xl" />;
}
