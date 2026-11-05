"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { missions, rewards, route, routeSlice, startPoint, type Mission } from "@/game/content";
import type { LngLat } from "@/game/geo";
import type { GeoReading } from "@/game/geofencing";

/**
 * Base cartografica: OpenFreeMap (dati OpenStreetMap, nessuna API key).
 * Se non raggiungibile, la mappa mostra comunque percorso e tappe su sfondo neutro.
 * TODO offline: sostituire con un estratto PMTiles del solo parco (vedi docs/mappe.md).
 */
maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const BASE_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "bg", type: "background", paint: { "background-color": "#e7ecd9" } }],
};

type Props = {
  current: Mission | null;
  completedIds: string[];
  reading: GeoReading | null;
  rejoinPoint: LngLat | null;
  recenterKey: number;
};

const empty = { type: "FeatureCollection" as const, features: [] };
const lineFeature = (coords: LngLat[]) => ({
  type: "Feature" as const,
  properties: {},
  geometry: { type: "LineString" as const, coordinates: coords },
});

function circle(center: LngLat, radius: number, steps = 48) {
  const coords: LngLat[] = [];
  const k = 111320 * Math.cos((center[1] * Math.PI) / 180);
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    coords.push([center[0] + (radius * Math.cos(a)) / k, center[1] + (radius * Math.sin(a)) / 110540]);
  }
  return { type: "Feature" as const, properties: {}, geometry: { type: "Polygon" as const, coordinates: [coords] } };
}

function markerEl(className: string, html: string, label: string) {
  const el = document.createElement("div");
  el.className = className;
  el.innerHTML = html;
  el.setAttribute("aria-label", label);
  return el;
}

export function MapView({ current, completedIds, reading, rejoinPoint, recenterKey }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const ready = useRef(false);
  const followed = useRef(false);
  const drawRef = useRef<() => void>(() => {});

  // Creazione mappa
  useEffect(() => {
    if (!box.current) return;
    let cancelled = false;
    const init = async () => {
      let style: string | StyleSpecification = FALLBACK_STYLE;
      try {
        const r = await fetch(BASE_STYLE_URL, { cache: "force-cache" });
        if (r.ok) style = BASE_STYLE_URL;
      } catch {}
      if (cancelled || !box.current) return;
      const bounds = route.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(route[0], route[0]));
      const map = new maplibregl.Map({
        container: box.current,
        style,
        bounds,
        fitBoundsOptions: { padding: 40 },
        attributionControl: { compact: true },
        maxZoom: 19,
      });
      mapRef.current = map;
      map.on("load", () => {
        map.addSource("route", { type: "geojson", data: lineFeature(route) });
        map.addSource("leg", { type: "geojson", data: empty });
        map.addSource("accuracy", { type: "geojson", data: empty });
        map.addLayer({ id: "route-casing", type: "line", source: "route", paint: { "line-color": "#ffffff", "line-width": 9, "line-opacity": 0.8 }, layout: { "line-cap": "round", "line-join": "round" } });
        map.addLayer({ id: "route", type: "line", source: "route", paint: { "line-color": "#b9a46a", "line-width": 4, "line-dasharray": [1.5, 1.5] }, layout: { "line-cap": "round", "line-join": "round" } });
        map.addLayer({ id: "leg", type: "line", source: "leg", paint: { "line-color": "#f2b705", "line-width": 7 }, layout: { "line-cap": "round", "line-join": "round" } });
        map.addLayer({ id: "accuracy", type: "fill", source: "accuracy", paint: { "fill-color": "#2f7de1", "fill-opacity": 0.15 } });
        ready.current = true;
        drawRef.current();
      });
    };
    init();
    return () => {
      cancelled = true;
      ready.current = false;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Tappe, tratto in corso e posizione
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const draw = () => {
      if (!ready.current) return;
      markers.current.forEach((m) => m.remove());
      markers.current = [];

      markers.current.push(new maplibregl.Marker({ element: markerEl("mk mk-start", "🏠", "Cascina Bastia, partenza") }).setLngLat(startPoint).addTo(map));
      for (const m of missions) {
        const done = completedIds.includes(m.id);
        if (done) {
          markers.current.push(new maplibregl.Marker({ element: markerEl("mk mk-done", rewards[m.rewardId].emoji, `${m.title}, completata`) }).setLngLat(m.location).addTo(map));
        } else if (current?.id === m.id) {
          markers.current.push(new maplibregl.Marker({ element: markerEl("mk mk-target", "✕", `Prossima tappa: ${m.title}`) }).setLngLat(m.location).addTo(map));
          if (m.location[0] !== m.safeStop[0] || m.location[1] !== m.safeStop[1]) {
            markers.current.push(new maplibregl.Marker({ element: markerEl("mk mk-stop", "", "Punto di sosta") }).setLngLat(m.safeStop).addTo(map));
          }
        }
      }

      (map.getSource("leg") as GeoJSONSource | undefined)?.setData(
        current ? lineFeature(routeSlice(current.leg.startAlong, current.leg.endAlong)) : empty,
      );

      if (reading) {
        markers.current.push(new maplibregl.Marker({ element: markerEl("mk mk-me", "", "La vostra posizione") }).setLngLat(reading.position).addTo(map));
        (map.getSource("accuracy") as GeoJSONSource | undefined)?.setData(circle(reading.position, reading.accuracy));
        if (!followed.current) {
          followed.current = true;
          const b = new maplibregl.LngLatBounds(reading.position, reading.position);
          if (current) b.extend(current.location);
          map.fitBounds(b, { padding: 70, maxZoom: 18 });
        }
      }

      // Nessuna linea in linea d'aria: si indica solo il punto del sentiero da cui rientrare.
      if (rejoinPoint) {
        markers.current.push(new maplibregl.Marker({ element: markerEl("mk mk-rejoin", "↩", "Punto di rientro sul sentiero") }).setLngLat(rejoinPoint).addTo(map));
      }
    };
    drawRef.current = draw;
    draw();
  }, [current, completedIds, reading, rejoinPoint]);

  // Ricentra
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !recenterKey) return;
    const b = new maplibregl.LngLatBounds(current?.location ?? startPoint, current?.location ?? startPoint);
    if (reading) b.extend(reading.position);
    map.fitBounds(b, { padding: 70, maxZoom: 18 });
  }, [recenterKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={box} className="map" role="application" aria-label="Mappa del percorso" />;
}
