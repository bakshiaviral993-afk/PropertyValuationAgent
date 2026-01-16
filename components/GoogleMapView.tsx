"use client";

import { useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { usePropertyMapStore } from "@/components/store/usePropertyMapStore";

const MAP_ID = "2185f915fc843bc0827abfdd"; // YOUR MAP ID

export default function GoogleMapView() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  const {
    properties,
    setSelectedId,
    setHoveredId,
    selectedId,
  } = usePropertyMapStore();

  useEffect(() => {
    if (!mapRef.current) return;

    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: "weekly",
      libraries: ["marker"],
    });

    loader.load().then(() => {
      mapInstance.current = new google.maps.Map(mapRef.current!, {
        center: { lat: 18.5204, lng: 73.8567 }, // Pune default
        zoom: 11,
        mapId: MAP_ID,
      });

      renderMarkers();
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderMarkers = () => {
    if (!mapInstance.current) return;

    // Clear old markers
    markersRef.current.forEach((m) => (m.map = null));
    markersRef.current = [];

    const markers = properties.map((property) => {
      const el = document.createElement("div");
      el.className =
        "bg-black text-white px-3 py-1 rounded-xl shadow-lg text-sm cursor-pointer";
      el.innerHTML = `
        ₹${property.price.toLocaleString("en-IN")}
        <div class="text-[10px] opacity-80">${property.address}</div>
      `;

      el.onclick = () => {
        setSelectedId(property.id);
        mapInstance.current?.panTo({
          lat: property.lat,
          lng: property.lng,
        });
      };

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstance.current!,
        position: { lat: property.lat, lng: property.lng },
        content: el,
      });

      marker.addListener("mouseover", () =>
        setHoveredId(property.id)
      );

      marker.addListener("mouseout", () =>
        setHoveredId(null)
      );

      return marker;
    });

    markersRef.current = markers;

    new MarkerClusterer({
      map: mapInstance.current!,
      markers,
    });
  };

  useEffect(() => {
    if (!mapInstance.current) return;
    renderMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties]);

  useEffect(() => {
    if (!selectedId) return;

    const marker = markersRef.current.find(
      (m) => (m.content as HTMLElement)?.innerText.includes(selectedId) === false
    );

    if (marker) {
      mapInstance.current?.panTo(marker.position as google.maps.LatLngLiteral);
    }
  }, [selectedId]);

  return <div ref={mapRef} className="w-full h-full rounded-xl" />;
}
