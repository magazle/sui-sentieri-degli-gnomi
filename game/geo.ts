export type LngLat = [number, number];

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

/** Distanza in metri tra due punti [lng, lat]. */
export function distanceMeters(a: LngLat, b: LngLat): number {
  const dLat = rad(b[1] - a[1]);
  const dLng = rad(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export type NearestOnLine = {
  point: LngLat;
  distance: number;
  /** metri dall'inizio del tracciato */
  along: number;
  segmentIndex: number;
};

/** Punto più vicino su una polilinea (proiezione locale, adeguata su scala di parco). */
export function nearestOnLine(
  p: LngLat,
  line: LngLat[],
  fromSegment = 0,
  toSegment = line.length - 2,
): NearestOnLine {
  const k = Math.cos(rad(p[1]));
  const toXY = (q: LngLat) => [rad(q[0] - p[0]) * R * k, rad(q[1] - p[1]) * R];
  let best: NearestOnLine = { point: line[0], distance: Infinity, along: 0, segmentIndex: 0 };
  let acc = 0;
  for (let i = 0; i < line.length - 1; i++) {
    if (i < fromSegment || i > toSegment) {
      acc += distanceMeters(line[i], line[i + 1]);
      continue;
    }
    const [ax, ay] = toXY(line[i]);
    const [bx, by] = toXY(line[i + 1]);
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
    const x = ax + t * dx;
    const y = ay + t * dy;
    const d = Math.hypot(x, y);
    const segLen = distanceMeters(line[i], line[i + 1]);
    if (d < best.distance) {
      best = {
        point: [
          line[i][0] + t * (line[i + 1][0] - line[i][0]),
          line[i][1] + t * (line[i + 1][1] - line[i][1]),
        ],
        distance: d,
        along: acc + t * segLen,
        segmentIndex: i,
      };
    }
    acc += segLen;
  }
  return best;
}

export function lineLength(line: LngLat[]): number {
  let s = 0;
  for (let i = 0; i < line.length - 1; i++) s += distanceMeters(line[i], line[i + 1]);
  return s;
}
