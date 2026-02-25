"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  title?: string | null;
  href?: string | null;
  placeId?: string | null;
};

interface InteractiveGoogleMapProps {
  apiKey?: string | null;
  center: { lat: number; lng: number };
  markers?: MapMarker[];
  zoom?: number;
  mapTypeId?: "roadmap" | "satellite" | "hybrid";
  className?: string;
  onMarkerClick?: (marker: MapMarker) => void;
  onPlaceClick?: (placeId: string) => void;
  onCenterChanged?: (center: { lat: number; lng: number }, zoom: number) => void;
  allowPlaceInfoWindow?: boolean;
}

type GoogleMapOptions = {
  center: { lat: number; lng: number };
  zoom: number;
  mapTypeId: "roadmap" | "satellite" | "hybrid";
  mapTypeControl: boolean;
  fullscreenControl: boolean;
  streetViewControl: boolean;
  clickableIcons: boolean;
};

type GoogleMarkerOptions = {
  position: { lat: number; lng: number };
  map: GoogleMapInstance;
  title?: string;
  clickable: boolean;
  optimized: boolean;
};

type MapsEventListener = {
  remove: () => void;
};

type GoogleLatLng = {
  lat: () => number;
  lng: () => number;
};

type GoogleLatLngBounds = {
  extend: (point: { lat: number; lng: number }) => void;
  getCenter: () => GoogleLatLng;
};

type GoogleMapInstance = {
  setMapTypeId: (id: "roadmap" | "satellite" | "hybrid") => void;
  panTo: (center: { lat: number; lng: number }) => void;
  addListener: (event: string, handler: (event?: unknown) => void) => MapsEventListener;
  getCenter?: () => GoogleLatLng | null;
  getZoom?: () => number;
  setCenter: (center: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  fitBounds: (bounds: GoogleLatLngBounds, padding?: number) => void;
};

type GoogleMarkerInstance = {
  setMap: (map: null) => void;
  addListener: (event: string, handler: () => void) => void;
};

type GoogleMapsApi = {
  maps: {
    Map: new (element: HTMLElement, options: GoogleMapOptions) => GoogleMapInstance;
    Marker: new (options: GoogleMarkerOptions) => GoogleMarkerInstance;
    LatLngBounds: new () => GoogleLatLngBounds;
  };
};

type MapClickEvent = {
  placeId?: string;
  stop?: () => void;
};

const MAP_SCRIPT_ID = "google-maps-js";
let mapsLoaderPromise: Promise<GoogleMapsApi> | null = null;

const loadGoogleMaps = (apiKey: string) => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps requires a browser."));
  }

  const win = window as Window & { google?: GoogleMapsApi };

  if (win.google?.maps) {
    return Promise.resolve(win.google);
  }

  if (mapsLoaderPromise) {
    return mapsLoaderPromise;
  }

  mapsLoaderPromise = new Promise<GoogleMapsApi>((resolve, reject) => {
    const existing = document.getElementById(MAP_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(win.google!));
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps.")));
      return;
    }

    const script = document.createElement("script");
    script.id = MAP_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(win.google!);
    script.onerror = () => reject(new Error("Failed to load Google Maps."));
    document.head.appendChild(script);
  });

  return mapsLoaderPromise;
};

export default function InteractiveGoogleMap({
  apiKey,
  center,
  markers = [],
  zoom = 13,
  mapTypeId = "roadmap",
  className,
  onMarkerClick,
  onPlaceClick,
  onCenterChanged,
  allowPlaceInfoWindow = false,
}: InteractiveGoogleMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const googleRef = useRef<GoogleMapsApi | null>(null);
  const markersRef = useRef<GoogleMarkerInstance[]>([]);
  const markerSignatureRef = useRef<string>("");
  const lastCenterRef = useRef(center);
  const latestCenterRef = useRef(center);
  const latestZoomRef = useRef(zoom);
  const latestMapTypeIdRef = useRef(mapTypeId);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error" | "missing">("idle");

  useEffect(() => {
    latestCenterRef.current = center;
  }, [center]);

  useEffect(() => {
    latestZoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    latestMapTypeIdRef.current = mapTypeId;
  }, [mapTypeId]);

  const markerSignature = useMemo(
    () => markers.map((marker) => `${marker.id}:${marker.lat}:${marker.lng}`).join("|"),
    [markers]
  );

  useEffect(() => {
    if (!apiKey) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("missing");
      return;
    }

    let cancelled = false;
     
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("loading");

    loadGoogleMaps(apiKey)
      .then((google) => {
        if (cancelled) return;
        googleRef.current = google;
        if (!mapRef.current && mapContainerRef.current) {
          mapRef.current = new google.maps.Map(mapContainerRef.current, {
            center: latestCenterRef.current,
            zoom: latestZoomRef.current,
            mapTypeId: latestMapTypeIdRef.current,
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            clickableIcons: true,
          });
        }
         
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
         
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  useEffect(() => {
    if (!mapRef.current || status !== "ready") {
      return;
    }
    mapRef.current.setMapTypeId(mapTypeId);
  }, [mapTypeId, status]);

  useEffect(() => {
    if (!mapRef.current || status !== "ready") {
      return;
    }
    const delta =
      Math.abs(lastCenterRef.current.lat - center.lat) +
      Math.abs(lastCenterRef.current.lng - center.lng);
    if (delta > 0.00001) {
      lastCenterRef.current = center;
      mapRef.current.panTo(center);
    }
  }, [center, status]);

  useEffect(() => {
    if (!mapRef.current || status !== "ready" || !onCenterChanged) {
      return;
    }
    const map = mapRef.current;
    const listener = map.addListener("idle", () => {
      const current = map.getCenter?.();
      if (!current) return;
      onCenterChanged({ lat: current.lat(), lng: current.lng() }, map.getZoom?.() ?? zoom);
    });

    return () => {
      listener.remove();
    };
  }, [onCenterChanged, status, zoom]);

  useEffect(() => {
    if (!mapRef.current || status !== "ready" || (!onPlaceClick && !allowPlaceInfoWindow)) {
      return;
    }
    const map = mapRef.current;
    const listener = map.addListener("click", (event?: unknown) => {
      const clickEvent = event as MapClickEvent | undefined;
      const placeId = clickEvent?.placeId;
      if (!placeId) return;
      if (allowPlaceInfoWindow) {
        return;
      }
      if (typeof clickEvent?.stop === "function") {
        clickEvent.stop();
      }
      onPlaceClick?.(placeId);
    });

    return () => {
      listener.remove();
    };
  }, [allowPlaceInfoWindow, onPlaceClick, status]);

  useEffect(() => {
    if (!mapRef.current || !googleRef.current || status !== "ready") {
      return;
    }

    const google = googleRef.current;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = markers.map((marker) => {
      const instance = new google.maps.Marker({
        position: { lat: marker.lat, lng: marker.lng },
        map: mapRef.current!,
        title: marker.title ?? undefined,
        clickable: true,
        optimized: false,
      });

      instance.addListener("click", () => {
        if (onMarkerClick) {
          onMarkerClick(marker);
          return;
        }
        if (marker.href) {
          window.location.href = marker.href;
        }
      });

      return instance;
    });

    if (markers.length === 0) {
      mapRef.current.setCenter(center);
      mapRef.current.setZoom(zoom);
      return;
    }

    if (markerSignatureRef.current !== markerSignature) {
      markerSignatureRef.current = markerSignature;
      const bounds = new google.maps.LatLngBounds();
      markers.forEach((marker) => {
        bounds.extend({ lat: marker.lat, lng: marker.lng });
      });

      if (markers.length > 1) {
        mapRef.current.fitBounds(bounds, 80);
      } else {
        const boundCenter = bounds.getCenter();
        mapRef.current.setCenter({ lat: boundCenter.lat(), lng: boundCenter.lng() });
        mapRef.current.setZoom(15);
      }
    }
  }, [center, markerSignature, markers, onMarkerClick, status, zoom]);

  if (status === "missing") {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-[var(--noir-border)] bg-[var(--noir-surface)] text-xs font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]",
          className
        )}
      >
        Map key required
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-2xl border border-[var(--noir-border)] bg-[var(--noir-surface)]",
        className
      )}
    >
      <div ref={mapContainerRef} className="absolute inset-0" />
      {status === "loading" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs font-ui uppercase tracking-[0.35em] text-[var(--noir-muted)]">
          Loading map
        </div>
      ) : null}
      {status === "error" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-xs font-ui uppercase tracking-[0.35em] text-[var(--noir-muted)]">
          Map unavailable
        </div>
      ) : null}
    </div>
  );
}
