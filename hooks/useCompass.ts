"use client";

import { useCallback, useEffect, useState } from "react";

type OrientationEventIOS = DeviceOrientationEvent & { webkitCompassHeading?: number };
type OrientationCtor = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };

/**
 * Bussola del telefono: direzione verso cui punta, in gradi dal nord.
 * Su iPhone il permesso va chiesto dentro un tocco: usare `enable()`.
 */
export function useCompass() {
  const [heading, setHeading] = useState<number | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [denied, setDenied] = useState(false);

  const enable = useCallback(async () => {
    const Ctor = (typeof window !== "undefined" ? window.DeviceOrientationEvent : undefined) as OrientationCtor | undefined;
    if (!Ctor) {
      setDenied(true);
      return false;
    }
    if (typeof Ctor.requestPermission === "function") {
      try {
        if ((await Ctor.requestPermission()) !== "granted") {
          setDenied(true);
          return false;
        }
      } catch {
        setDenied(true);
        return false;
      }
    }
    setEnabled(true);
    return true;
  }, []);

  const disable = useCallback(() => {
    setEnabled(false);
    setHeading(null);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let last = -1;
    const onOrient = (e: Event) => {
      const ev = e as OrientationEventIOS;
      let h: number | null = null;
      if (typeof ev.webkitCompassHeading === "number") h = ev.webkitCompassHeading;
      else if (ev.absolute && typeof ev.alpha === "number") h = (360 - ev.alpha) % 360;
      if (h === null) return;
      // aggiornamenti solo per variazioni sensibili: la mappa resta calma
      if (last < 0 || Math.abs(((h - last + 540) % 360) - 180) > 4) {
        last = h;
        setHeading(h);
      }
    };
    const evName = "ondeviceorientationabsolute" in window ? "deviceorientationabsolute" : "deviceorientation";
    window.addEventListener(evName, onOrient);
    return () => window.removeEventListener(evName, onOrient);
  }, [enabled]);

  return { heading, enabled, denied, enable, disable };
}
