"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { missions, rewards, route, routeSlice, startPoint, type Mission } from "@/game/content";
import type { LngLat } from "@/game/geo";
import type { GeoReading } from "@/game/geofencing";
import type { Guidance } from "@/game/guide";

maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

/**
 * Base cartografica: OpenFreeMap (dati OpenStreetMap, nessuna API key).
 * Se non raggiungibile, la mappa mostra comunque percorso e tappe su sfondo neutro.
 */
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
  guidance: Guidance | null;
  /** punta la mappa nella direzione del telefono */
  heading: number | null;
  /** cambia valore per chiedere di inquadrare posizione e tappa */
  focusKey: number;
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

/**
 * MapLibre posiziona il marcatore con `transform` sull'elemento esterno:
 * stile e animazioni vanno SOLO sull'elemento interno, altrimenti il
 * marcatore salta nell'angolo della mappa.
 */
function markerEl(className: string, html: string, label: string, caption?: string) {
  const outer = document.createElement("div");
  outer.setAttribute("aria-label", label);
  const inner = document.createElement("div");
  inner.className = `mk ${className}`;
  inner.innerHTML = html;
  outer.appendChild(inner);
  if (caption) {
    const cap = document.createElement("div");
    cap.className = "mk-caption";
    cap.textContent = caption;
    outer.appendChild(cap);
  }
  return outer;
}

/** Freccia disegnata su canvas, usata lungo il tratto da percorrere. */
function arrowImage(color: string) {
  const s = 48;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  g.lineWidth = 7;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = "#ffffff";
  g.beginPath();
  g.moveTo(16, 12);
  g.lineTo(32, 24);
  g.lineTo(16, 36);
  g.stroke();
  g.lineWidth = 4;
  g.strokeStyle = color;
  g.stroke();
  return g.getImageData(0, 0, s, s);
}

function bboxOf(points: LngLat[]) {
  return points.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(points[0], points[0]));
}

export function MapView({ current, completedIds, reading, guidance, heading, focusKey }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const stopMarkers = useRef<maplibregl.Marker[]>([]);
  const me = useRef<maplibregl.Marker | null>(null);
  const meArrow = useRef<maplibregl.Marker | null>(null);
  const trailMk = useRef<maplibregl.Marker | null>(null);
  const ready = useRef(false);
  const fittedFor = useRef<string | null>(null);
  const redraw = useRef<() => void>(() => {});

  /* ---------- creazione ---------- */
  useEffect(() => {
    if (!box.current) return;
    let cancelled = false;
    (async () => {
      let style: string | StyleSpecification = FALLBACK_STYLE;
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 4000);
        const r = await fetch(BASE_STYLE_URL, { signal: ctrl.signal });
        clearTimeout(t);
        if (r.ok) style = BASE_STYLE_URL;
      } catch {}
      if (cancelled || !box.current) return;
      const map = new maplibregl.Map({
        container: box.current,
        style,
        bounds: bboxOf(route),
        fitBoundsOptions: { padding: 40 },
        attributionControl: { compact: true },
        maxZoom: 19,
        pitchWithRotate: false,
      });
      mapRef.current = map;
      map.on("load", () => {
        map.addImage("arrow", arrowImage("#8a6400"));
        map.addSource("route", { type: "geojson", data: lineFeature(route) });
        map.addSource("leg", { type: "geojson", data: empty });
        map.addSource("todo", { type: "geojson", data: empty });
        map.addSource("totrail", { type: "geojson", data: empty });
        map.addSource("accuracy", { type: "geojson", data: empty });
        const round = { "line-cap": "round" as const, "line-join": "round" as const };
        map.addLayer({ id: "route-casing", type: "line", source: "route", layout: round, paint: { "line-color": "#ffffff", "line-width": 8, "line-opacity": 0.7 } });
        map.addLayer({ id: "route", type: "line", source: "route", layout: round, paint: { "line-color": "#a99a72", "line-width": 3.5, "line-dasharray": [1.4, 1.6] } });
        map.addLayer({ id: "leg-casing", type: "line", source: "leg", layout: round, paint: { "line-color": "#ffffff", "line-width": 12 } });
        map.addLayer({ id: "leg", type: "line", source: "leg", layout: round, paint: { "line-color": "#f6d36a", "line-width": 8 } });
        map.addLayer({ id: "todo", type: "line", source: "todo", layout: round, paint: { "line-color": "#f2b705", "line-width": 8 } });
        map.addLayer({
          id: "todo-arrows",
          type: "symbol",
          source: "todo",
          layout: { "symbol-placement": "line", "symbol-spacing": 55, "icon-image": "arrow", "icon-size": 0.62, "icon-rotation-alignment": "map", "icon-allow-overlap": true },
        });
        map.addLayer({ id: "totrail", type: "line", source: "totrail", layout: round, paint: { "line-color": "#2f7de1", "line-width": 4, "line-dasharray": [0.6, 1.6] } });
        map.addLayer({ id: "accuracy", type: "fill", source: "accuracy", paint: { "fill-color": "#2f7de1", "fill-opacity": 0.13 } });
        ready.current = true;
        redraw.current();
      });
    })();
    return () => {
      cancelled = true;
      ready.current = false;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  /* ---------- tappe: partenza, completate, X attuale, future numerate ---------- */
  useEffect(() => {
    const draw = () => {
      const map = mapRef.current;
      if (!map || !ready.current) return;
      stopMarkers.current.forEach((m) => m.remove());
      stopMarkers.current = [];
      const add = (el: HTMLElement, at: LngLat, anchor: maplibregl.PositionAnchor = "center") =>
        stopMarkers.current.push(new maplibregl.Marker({ element: el, anchor }).setLngLat(at).addTo(map));

      add(markerEl("mk-start", "🏠", "Cascina Bastia, partenza"), startPoint);
      const currentIdx = current ? missions.findIndex((m) => m.id === current.id) : missions.length;
      missions.forEach((m, i) => {
        if (completedIds.includes(m.id)) add(markerEl("mk-done", rewards[m.rewardId].emoji, `${m.title}, completata`), m.location);
        else if (i > currentIdx) add(markerEl("mk-next", String(m.order), `Tappa ${m.order}: ${m.title}`), m.location);
      });
      if (current) {
        if (distanceDeg(current.location, current.safeStop) > 0) add(markerEl("mk-stop", "", "Punto di sosta"), current.safeStop);
        add(markerEl("mk-target", "<span>✕</span>", `Prossima tappa: ${current.title}`, current.title), current.location);
      }

      (map.getSource("leg") as GeoJSONSource | undefined)?.setData(
        current ? lineFeature(routeSlice(current.leg.startAlong, current.leg.endAlong)) : empty,
      );

      // Inquadratura del nuovo tratto: dalla tappa precedente alla X
      if (current && fittedFor.current !== current.id) {
        fittedFor.current = current.id;
        const pts = routeSlice(current.leg.startAlong, current.leg.endAlong);
        pts.push(current.location);
        map.fitBounds(bboxOf(pts), { padding: { top: 60, bottom: 60, left: 50, right: 50 }, maxZoom: 18, duration: 600 });
      }
    };
    redraw.current = () => {
      draw();
      drawLive();
    };
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, completedIds]);

  /* ---------- posizione, freccia di guida, tratto da fare ---------- */
  const drawLive = () => {
    const map = mapRef.current;
    if (!map || !ready.current) return;
    const todo = map.getSource("todo") as GeoJSONSource | undefined;
    const totrail = map.getSource("totrail") as GeoJSONSource | undefined;
    const acc = map.getSource("accuracy") as GeoJSONSource | undefined;

    if (!reading || guidance?.farAway) {
      me.current?.remove();
      me.current = null;
      meArrow.current?.remove();
      meArrow.current = null;
      trailMk.current?.remove();
      trailMk.current = null;
      todo?.setData(empty);
      totrail?.setData(empty);
      acc?.setData(empty);
      return;
    }

    // Se la posizione esce dallo schermo, la mappa la riporta in vista.
    if (!map.getBounds().contains(reading.position as [number, number]) && heading === null) {
      const pts: LngLat[] = [reading.position];
      if (guidance) pts.push(guidance.trailPoint);
      if (current) pts.push(current.location);
      map.fitBounds(bboxOf(pts), { padding: 70, maxZoom: 18, duration: 500 });
    }

    if (!me.current) me.current = new maplibregl.Marker({ element: markerEl("mk-me", "", "La vostra posizione") }).setLngLat(reading.position).addTo(map);
    me.current.setLngLat(reading.position);
    acc?.setData(circle(reading.position, reading.accuracy));

    if (guidance) {
      if (!meArrow.current) {
        const el = markerEl("mk-heading", "<svg viewBox='0 0 60 60'><path d='M30 4 L50 46 L30 36 L10 46 Z'/></svg>", "Direzione da seguire");
        meArrow.current = new maplibregl.Marker({ element: el, rotationAlignment: "map" }).setLngLat(reading.position).addTo(map);
      }
      meArrow.current.setLngLat(reading.position).setRotation(guidance.bearing);
      todo?.setData(guidance.path.length > 1 ? lineFeature(guidance.path) : empty);
      if (guidance.toTrail > 0) {
        totrail?.setData(lineFeature([reading.position, guidance.trailPoint]));
        if (!trailMk.current)
          trailMk.current = new maplibregl.Marker({ element: markerEl("mk-trail", "", "Vialetto più vicino") }).setLngLat(guidance.trailPoint).addTo(map);
        trailMk.current.setLngLat(guidance.trailPoint);
      } else {
        totrail?.setData(empty);
        trailMk.current?.remove();
        trailMk.current = null;
      }
    }
  };
  useEffect(drawLive); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- bussola: la mappa ruota come il telefono ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (heading === null) {
      if (map.getBearing() !== 0) map.easeTo({ bearing: 0, duration: 400 });
      return;
    }
    map.easeTo({ bearing: heading, duration: 250, center: reading?.position ?? map.getCenter() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heading]);

  /* ---------- "Guidami": inquadra posizione + prossimi metri ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusKey) return;
    const pts: LngLat[] = [];
    if (reading && !guidance?.farAway) {
      pts.push(reading.position);
      if (guidance) pts.push(guidance.trailPoint, ...guidance.path.slice(0, 6));
    }
    if (current) pts.push(current.location);
    if (!pts.length) pts.push(...route);
    map.fitBounds(bboxOf(pts), { padding: 70, maxZoom: 18.5, duration: 600, bearing: map.getBearing() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);

  return <div ref={box} className="map" role="application" aria-label="Mappa del percorso" />;
}

function distanceDeg(a: LngLat, b: LngLat) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}
