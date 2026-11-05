# Mappe

**Ora**: base cartografica [OpenFreeMap](https://openfreemap.org) (dati © OpenStreetMap, nessuna API key). Il service worker mette in cache le tile già viste, quindi una prima apertura della mappa con rete rende il percorso consultabile anche con segnale debole. Se la base non si carica, la mappa mostra comunque tracciato e tappe su sfondo neutro.

**Per l'offline completo** (evoluzione prevista): estratto PMTiles del solo parco, servito dall'app stessa.

```bash
# richiede la CLI pmtiles (https://github.com/protomaps/go-pmtiles)
pmtiles extract https://build.protomaps.com/<BUILD>.pmtiles public/maps/parco-monza.pmtiles \
  --bbox=9.268,45.590,9.282,45.602 --maxzoom=18
```

Poi in `components/map/MapView.tsx`: registrare il protocollo `pmtiles://` (pacchetto `pmtiles`) e usare uno stile Protomaps puntato al file locale. Il file del solo parco pesa pochi MB.
