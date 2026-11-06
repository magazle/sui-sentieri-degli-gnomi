import { del, get, set } from "idb-keyval";

/**
 * Nomi e foto del diploma: restano solo su questo telefono (IndexedDB),
 * non vengono mai inviati. Si cancellano con «Ricomincia».
 */
export type Crop = { zoom: number; dx: number; dy: number };
export type DiplomaData = {
  names: string[];
  photo: string | null;
  /** dimensioni della foto ridotta, servono per posizionarla */
  photoSize?: { w: number; h: number };
  /** ingrandimento (≥ 1) e spostamento dal centro della cornice, in unità del diploma */
  crop?: Crop;
};

export const NO_CROP: Crop = { zoom: 1, dx: 0, dy: 0 };
export const MAX_ZOOM = 4;

/** Dove disegnare la foto perché copra sempre tutto il cerchio. */
export function placePhoto(size: { w: number; h: number }, crop: Crop, circle: { cx: number; cy: number; r: number }) {
  const d = circle.r * 2;
  const s = (d / Math.min(size.w, size.h)) * crop.zoom;
  const w = size.w * s;
  const h = size.h * s;
  return { x: circle.cx - w / 2 + crop.dx, y: circle.cy - h / 2 + crop.dy, w, h };
}

/** Limita zoom e spostamento: la foto non deve mai lasciare scoperta la cornice. */
export function clampCrop(size: { w: number; h: number }, crop: Crop, r: number): Crop {
  const zoom = Math.min(MAX_ZOOM, Math.max(1, crop.zoom));
  const d = r * 2;
  const s = (d / Math.min(size.w, size.h)) * zoom;
  const mx = Math.max(0, (size.w * s - d) / 2);
  const my = Math.max(0, (size.h * s - d) / 2);
  return { zoom, dx: Math.max(-mx, Math.min(mx, crop.dx)), dy: Math.max(-my, Math.min(my, crop.dy)) };
}

const KEY = "gnomi-diploma";

export async function loadDiploma(): Promise<DiplomaData> {
  try {
    const d = (await get(KEY)) as DiplomaData | undefined;
    if (d && Array.isArray(d.names)) return { names: d.names, photo: d.photo ?? null, photoSize: d.photoSize, crop: d.crop };
  } catch {}
  return { names: [""], photo: null };
}

export async function saveDiploma(d: DiplomaData) {
  try {
    await set(KEY, d);
  } catch {}
}

export async function clearDiploma() {
  try {
    await del(KEY);
  } catch {}
}

/** Riduce la foto (max 1200 px), corregge l'orientamento e la comprime in JPEG. */
export async function preparePhoto(file: File): Promise<{ photo: string; photoSize: { w: number; h: number } }> {
  const max = 1200;
  let w: number;
  let h: number;
  let source: CanvasImageSource;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    source = bmp;
    w = bmp.width;
    h = bmp.height;
  } catch {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();
    source = img;
    w = img.naturalWidth;
    h = img.naturalHeight;
  }
  const k = Math.min(1, max / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.round(w * k);
  c.height = Math.round(h * k);
  c.getContext("2d")!.drawImage(source, 0, 0, c.width, c.height);
  return { photo: c.toDataURL("image/jpeg", 0.86), photoSize: { w: c.width, h: c.height } };
}

/** «Anna», «Anna e Luca», «Anna, Luca e Sofia» */
export function joinNames(names: string[]) {
  const n = names.map((s) => s.trim()).filter(Boolean);
  if (n.length <= 1) return n[0] ?? "";
  return `${n.slice(0, -1).join(", ")} e ${n[n.length - 1]}`;
}
