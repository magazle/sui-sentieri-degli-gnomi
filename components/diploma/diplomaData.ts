import { del, get, set } from "idb-keyval";

/**
 * Nomi e foto del diploma: restano solo su questo telefono (IndexedDB),
 * non vengono mai inviati. Si cancellano con «Ricomincia».
 */
export type DiplomaData = { names: string[]; photo: string | null };

const KEY = "gnomi-diploma";

export async function loadDiploma(): Promise<DiplomaData> {
  try {
    const d = (await get(KEY)) as DiplomaData | undefined;
    if (d && Array.isArray(d.names)) return { names: d.names, photo: d.photo ?? null };
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
export async function preparePhoto(file: File): Promise<string> {
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
  return c.toDataURL("image/jpeg", 0.86);
}

/** «Anna», «Anna e Luca», «Anna, Luca e Sofia» */
export function joinNames(names: string[]) {
  const n = names.map((s) => s.trim()).filter(Boolean);
  if (n.length <= 1) return n[0] ?? "";
  return `${n.slice(0, -1).join(", ")} e ${n[n.length - 1]}`;
}
