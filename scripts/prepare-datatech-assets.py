#!/usr/bin/env python3
"""
Prepara los assets de Claro media · DATA TECH ("15 minutos").

Entrada:  referencias_03/
Salida:   src/assets/datatech/                  (frontend)
          backend/functions/assets/datatech/    (plantillas que ve el modelo)

Es idempotente: se puede volver a correr cuando diseño entregue artes nuevas.

    python3 scripts/prepare-datatech-assets.py

A diferencia del Summit, aquí las plantillas son pósters COMPLETOS: ya traen el
titular, el badge y los logos. El modelo las reproduce cambiando a la persona,
y no se compone ningún marco encima.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "referencias_03"
OUT = ROOT / "src" / "assets" / "datatech"
OUT_PLANTILLAS = OUT / "plantillas"
OUT_BACKEND = ROOT / "backend" / "functions" / "assets" / "datatech"

LOGO = "1-Logo-Horizontal-Claro-media-data-tech-.png"

# id → archivo de origen. El id es el que viaja del frontend al backend.
PLANTILLAS = [
    (1, "1-Pantalla-.png"),
    (2, "2-Pantalla-.png"),
    (3, "3-Pantalla-.png"),
    (4, "4-Pantalla-.png"),
    (5, "5-Pantalla-.png"),
]

#: Ancho de la miniatura que se pinta en la pantalla de selección. El póster
#: completo pesa ~1,7 MB; a este tamaño baja a ~60 KB sin verse peor en un
#: kiosco, y son cinco los que cargan a la vez.
ANCHO_MINIATURA = 540


def log(msg: str) -> None:
    print(f"  {msg}")


def recortar_a_contenido(im: Image.Image, umbral: int = 20) -> Image.Image:
    """Quita el margen transparente, que descuadraría cualquier posicionamiento."""
    rgba = im.convert("RGBA")
    ys, xs = np.where(np.array(rgba)[..., 3] > umbral)
    return rgba.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))


def build_fondo() -> None:
    """
    Fondo común de todas las pantallas.

    Viene en PNG de 3,2 MB; como no tiene transparencia ni bordes duros, en JPEG
    pesa una fracción y se ve igual. Es lo primero que carga el kiosco.
    """
    with Image.open(SRC / "fondo.png") as im:
        fondo = im.convert("RGB")

    # 1080 de ancho basta: es la resolución del kiosco y el arte es difuso.
    alto = round(fondo.height * (1080 / fondo.width))
    fondo = fondo.resize((1080, alto), Image.LANCZOS)
    fondo.save(OUT / "fondo.jpg", quality=88, optimize=True)

    peso = (OUT / "fondo.jpg").stat().st_size / 1024
    log(f"fondo.jpg                  {fondo.width}×{fondo.height}  {peso:.0f} KB  (desde 3,2 MB)")


def build_logo() -> None:
    with Image.open(SRC / LOGO) as im:
        logo = recortar_a_contenido(im)

    logo.thumbnail((1200, 1200), Image.LANCZOS)
    logo.save(OUT / "logo.png")
    log(f"logo.png                   {logo.width}×{logo.height}  (proporción {logo.width / logo.height:.2f})")


def build_plantillas() -> None:
    """
    Las plantillas van a dos sitios y con dos tamaños distintos:

      · backend  → resolución completa, es lo que ve el modelo. Mientras más
        detalle reciba del póster, más fiel lo reproduce.
      · frontend → miniatura, solo para que el visitante elija.
    """
    for plantilla_id, archivo in PLANTILLAS:
        with Image.open(SRC / archivo) as im:
            poster = im.convert("RGB")

        completa = OUT_BACKEND / f"plantilla-{plantilla_id}.jpg"
        poster.save(completa, quality=92, optimize=True)

        mini = poster.copy()
        mini.thumbnail((ANCHO_MINIATURA, ANCHO_MINIATURA * 4), Image.LANCZOS)
        destino = OUT_PLANTILLAS / f"plantilla-{plantilla_id}.jpg"
        mini.save(destino, quality=86, optimize=True)

        log(
            f"plantilla-{plantilla_id}              "
            f"modelo {poster.width}×{poster.height} ({completa.stat().st_size / 1024:.0f} KB)  ·  "
            f"kiosco {mini.width}×{mini.height} ({destino.stat().st_size / 1024:.0f} KB)"
        )


def main() -> int:
    if not SRC.exists():
        print(f"❌ No encuentro {SRC}")
        return 1

    for carpeta in (OUT, OUT_PLANTILLAS, OUT_BACKEND):
        carpeta.mkdir(parents=True, exist_ok=True)

    print("\n🟠 Claro media · DATA TECH — preparando assets\n")

    print("── Fondo y logo ──")
    build_fondo()
    build_logo()

    print("\n── Plantillas de póster ──")
    build_plantillas()

    print("\n✅ Listo\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
