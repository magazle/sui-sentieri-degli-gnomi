"use client";

import { useEffect, useRef, useState } from "react";
import { DiplomaArt, H, PHOTO, W } from "./DiplomaArt";
import { joinNames, loadDiploma, preparePhoto, saveDiploma, type DiplomaData } from "./diplomaData";

const MAX_NAMES = 6;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Esporta il diploma come PNG: il disegno (SVG) e la foto vengono composti su
 * un canvas. La foto si disegna a parte perché alcuni browser (Safari)
 * bloccano l'esportazione di un SVG che contiene immagini.
 */
async function renderPng(svg: SVGSVGElement, photo: string | null, scale = 1.6): Promise<Blob> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(W));
  clone.setAttribute("height", String(H));
  const xml = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const art = await loadImage(url);
    const c = document.createElement("canvas");
    c.width = Math.round(W * scale);
    c.height = Math.round(H * scale);
    const g = c.getContext("2d")!;
    g.scale(scale, scale);
    g.drawImage(art, 0, 0, W, H);
    if (photo) {
      const img = await loadImage(photo);
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - side) / 2;
      const sy = (img.naturalHeight - side) / 2;
      g.save();
      g.beginPath();
      g.arc(PHOTO.cx, PHOTO.cy, PHOTO.r, 0, Math.PI * 2);
      g.clip();
      g.drawImage(img, sx, sy, side, side, PHOTO.cx - PHOTO.r, PHOTO.cy - PHOTO.r, PHOTO.r * 2, PHOTO.r * 2);
      g.restore();
      // le foglie della cornice tornano sopra la foto
      g.save();
      g.beginPath();
      g.arc(PHOTO.cx, PHOTO.cy, PHOTO.r, 0, Math.PI * 2);
      g.lineWidth = 3;
      g.strokeStyle = "#3e2410";
      g.stroke();
      g.restore();
    }
    return await new Promise<Blob>((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("png"))), "image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function DiplomaEditor() {
  const [data, setData] = useState<DiplomaData>({ names: [""], photo: null });
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<null | "photo" | "save" | "print">(null);
  const [printSrc, setPrintSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const exportRef = useRef<SVGSVGElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const date = new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });

  useEffect(() => {
    loadDiploma().then((d) => {
      setData(d);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) saveDiploma(data);
  }, [data, loaded]);

  const setName = (i: number, v: string) => setData((d) => ({ ...d, names: d.names.map((n, j) => (j === i ? v : n)) }));
  const addName = () => setData((d) => (d.names.length < MAX_NAMES ? { ...d, names: [...d.names, ""] } : d));
  const removeName = (i: number) => setData((d) => ({ ...d, names: d.names.length > 1 ? d.names.filter((_, j) => j !== i) : [""] }));

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy("photo");
    setError(null);
    try {
      const photo = await preparePhoto(file);
      setData((d) => ({ ...d, photo }));
    } catch {
      setError("Non sono riuscito ad aprire la foto. Provate a scattarne un'altra.");
    } finally {
      setBusy(null);
    }
  };

  const fileName = () => {
    const who = joinNames(data.names).replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
    return `diploma-custode-del-bosco${who ? `-${who}` : ""}.png`;
  };

  const save = async () => {
    if (!exportRef.current) return;
    setBusy("save");
    setError(null);
    try {
      const blob = await renderPng(exportRef.current, data.photo);
      const file = new File([blob], fileName(), { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        try {
          await nav.share({ files: [file], title: "Diploma di custode del bosco" });
          return;
        } catch (err) {
          if ((err as Error).name === "AbortError") return;
        }
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch {
      setError("Non sono riuscito a creare l'immagine. Riprovate tra un attimo.");
    } finally {
      setBusy(null);
    }
  };

  const print = async () => {
    if (!exportRef.current) return;
    setBusy("print");
    try {
      const blob = await renderPng(exportRef.current, data.photo, 2);
      const src = URL.createObjectURL(blob);
      setPrintSrc(src);
      await loadImage(src);
      setTimeout(() => window.print(), 150);
    } catch {
      setError("Non sono riuscito a preparare la stampa.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="dp-editor" aria-label="Il vostro diploma">
      <div className="dp-preview">
        <DiplomaArt names={data.names} photo={data.photo} date={date} />
      </div>

      <div className="dp-form">
        <h3>Chi ha ritrovato i segreti?</h3>
        {data.names.map((n, i) => (
          <div className="dp-name" key={i}>
            <input
              value={n}
              onChange={(e) => setName(i, e.target.value)}
              placeholder={i === 0 ? "Nome del bambino" : "Un altro nome"}
              aria-label={`Nome ${i + 1}`}
              maxLength={24}
              autoCapitalize="words"
              enterKeyHint="done"
            />
            {(data.names.length > 1 || n) && (
              <button className="btn btn-ghost btn-sm" onClick={() => removeName(i)} aria-label={`Togli ${n || "questo nome"}`}>
                ✕
              </button>
            )}
          </div>
        ))}
        {data.names.length < MAX_NAMES && (
          <button className="btn btn-soft btn-sm" onClick={addName}>
            + Aggiungi un altro esploratore
          </button>
        )}

        <h3>La foto ricordo</h3>
        <p className="small muted">Resta solo su questo telefono: non viene inviata a nessuno.</p>
        <div className="row">
          <button className="btn btn-soft" onClick={() => cameraRef.current?.click()} disabled={busy === "photo"}>
            📷 {data.photo ? "Rifai la foto" : "Scatta la foto"}
          </button>
          <button className="btn btn-ghost" onClick={() => galleryRef.current?.click()} disabled={busy === "photo"}>
            Scegli dalla galleria
          </button>
          {data.photo && (
            <button className="btn btn-ghost" onClick={() => setData((d) => ({ ...d, photo: null }))}>
              Togli la foto
            </button>
          )}
        </div>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onPhoto} />
        <input ref={galleryRef} type="file" accept="image/*" hidden onChange={onPhoto} />
        {busy === "photo" && <p className="small muted">Preparo la foto…</p>}
        {error && <p className="banner banner-warn small">{error}</p>}

        <div className="actions">
          <button className="btn btn-big" onClick={save} disabled={busy !== null}>
            {busy === "save" ? "Preparo il diploma…" : "Salva o condividi il diploma"}
          </button>
          <button className="btn btn-soft" onClick={print} disabled={busy !== null}>
            🖨 Stampa
          </button>
        </div>
      </div>

      {/* copia senza animazioni né foto, usata per creare l'immagine */}
      <div className="dp-export" aria-hidden>
        <DiplomaArt ref={exportRef} names={data.names} photo={data.photo} date={date} forExport />
      </div>
      {printSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="dp-print" src={printSrc} alt="" />
      )}
    </section>
  );
}
