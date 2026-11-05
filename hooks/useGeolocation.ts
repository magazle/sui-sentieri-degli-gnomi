"use client";

import { useEffect, useState } from "react";
import type { GeoReading } from "@/game/geofencing";

export type GeoStatus = "off" | "requesting" | "active" | "denied" | "unavailable" | "unsupported";

/** Segue la posizione solo mentre `enabled` è vero. La posizione resta sul dispositivo e non viene salvata. */
export function useGeolocation(enabled: boolean) {
  const [reading, setReading] = useState<GeoReading | null>(null);
  const [status, setStatus] = useState<GeoStatus>("off");

  useEffect(() => {
    if (!enabled) {
      setStatus("off");
      return;
    }
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus("requesting");
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setStatus("active");
        setReading({
          position: [pos.coords.longitude, pos.coords.latitude],
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [enabled]);

  return { reading, status };
}

/** Tiene lo schermo acceso durante il cammino, dove supportato. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
        if (cancelled) lock.release();
      } catch {}
    };
    const onVisible = () => document.visibilityState === "visible" && acquire();
    acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, [active]);
}
