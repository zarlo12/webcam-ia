#!/usr/bin/env python3
"""
Prepara los assets de Claro Tech Summit 2026 a partir de las artes originales.

Entrada:  referencias_02/            (las 5 pantallas + la carpeta estilos/)
Salida:   src/assets/summit/         (assets del frontend)
          backend/functions/assets/summit/  (marco y mascara para el compositor)

Es idempotente: se puede volver a correr cuando diseño entregue artes nuevas.

    python3 scripts/prepare-summit-assets.py

Lo único que NO se deriva automáticamente son las coordenadas de los hotspots
(campos del formulario, ventana de cámara, etc.). Viven en src/config/summit.ts
y este script las imprime al final para poder verificarlas contra el arte nuevo.
"""

from __future__ import annotations

import shutil
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "referencias_02"
ESTILOS_SRC = SRC / "estilos"
OUT = ROOT / "src" / "assets" / "summit"
OUT_ESTILOS = OUT / "estilos"
OUT_BACKEND = ROOT / "backend" / "functions" / "assets" / "summit"

# Orden de las tarjetas en la pantalla de estilos. El id es el que viaja al
# backend; el archivo es el arte que entregó diseño.
ESTILOS = [
    (1, "acuarela.png"),
    (2, "ilustracion.png"),
    (3, "universo_fantastico.png"),
    (4, "cyberpunk.png"),
]


def log(msg: str) -> None:
    print(f"  {msg}")


def largest_opaque_box(rgba: np.ndarray, alpha_min: int = 120) -> tuple[int, int, int, int]:
    """Bounding box de la mancha opaca más grande (la tarjeta, sin halos sueltos)."""
    opaque = rgba[..., 3] > alpha_min
    h, w = opaque.shape
    seen = np.zeros((h, w), bool)
    best: list[tuple[int, int]] = []

    for sy, sx in zip(*np.where(opaque)):
        if seen[sy, sx]:
            continue
        queue = deque([(sy, sx)])
        seen[sy, sx] = True
        blob = [(sy, sx)]
        while queue:
            y, x = queue.popleft()
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and opaque[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    queue.append((ny, nx))
                    blob.append((ny, nx))
        if len(blob) > len(best):
            best = blob

    pts = np.array(best)
    y0, x0 = pts.min(0)
    y1, x1 = pts.max(0)
    return int(x0), int(y0), int(x1), int(y1)


def inner_photo_box(card: np.ndarray) -> tuple[int, int, int, int]:
    """
    Foto interior de una tarjeta de estilo, sin el marco neón ni la banda del
    rótulo. Es la referencia de estilo que se le manda al modelo: si le
    llegara el marco rojo, lo dibujaría dentro del retrato.

    Se busca el borde por abajo (la banda negra del rótulo) y luego se muerde
    un poco por los cuatro lados, porque el neón sangra hacia adentro y basta
    una línea roja para que el modelo la interprete como parte del estilo.
    """
    h, w = card.shape[:2]
    rgb = card[..., :3].astype(int)
    opaque = card[..., 3] > 200

    # Banda del rótulo: filas de la mitad inferior casi todas negras.
    black = opaque & (rgb.max(2) < 32)
    lower = black[int(0.55 * h) :]
    band_rows = np.where(lower.mean(1) > 0.70)[0]
    bottom = int(0.55 * h) + int(band_rows.min()) if len(band_rows) else int(0.80 * h)

    # Caja de la foto: lo que es imagen (ni negro de fondo ni transparente).
    photo = opaque & (rgb.max(2) > 45)
    top_zone = photo[:bottom]
    rows = np.where(top_zone.mean(1) > 0.70)[0]
    cols = np.where(top_zone[rows.min() : rows.max() + 1].mean(0) > 0.70)[0]

    inset_x = round(0.035 * w)
    inset_y = round(0.030 * h)
    return (
        int(cols.min()) + inset_x,
        int(rows.min()) + inset_y,
        int(cols.max()) - inset_x,
        bottom - inset_y,
    )


def copy_art(source: str, dest: str) -> None:
    shutil.copyfile(SRC / source, OUT / dest)
    with Image.open(OUT / dest) as im:
        log(f"{dest:26s} ← {source}  ({im.width}×{im.height})")


# Cuánto se engorda la silueta y cuánto se difumina su borde, en píxeles del
# lienzo de 1123×1401. El ensanche le devuelve aire a la zona de la cabeza; el
# difuminado es lo que evita el corte recto: el pelo se funde en negro.
ENSANCHE = 18
DIFUMINADO = 26


def suavizar_silueta(alpha: Image.Image) -> Image.Image:
    """
    Engorda la silueta y le difumina el borde.

    Difuminar y volver a umbralizar bajo es un dilatado barato: mueve el borde
    hacia afuera ~ENSANCHE px sin recorrer un kernel enorme por píxel. El
    segundo difuminado ya es el degradado que se ve.
    """
    crecida = alpha.filter(ImageFilter.GaussianBlur(ENSANCHE))
    crecida = crecida.point(lambda v: 255 if v > 60 else 0)
    return crecida.filter(ImageFilter.GaussianBlur(DIFUMINADO))


def build_result_mask() -> None:
    """
    paso_4.png trae la silueta orgánica del retrato como transparencia BLANCA
    (255,255,255,0), mientras que el fondo exterior es transparencia NEGRA
    (0,0,0,0). Esa diferencia es la que separa "aquí va la foto" de "aquí no".

    De ahí salen dos assets:
      · resultado-mascara.png → silueta blanca opaca (mask-image en CSS,
        dest-in en sharp).
      · resultado-marco.png   → el arte tal cual, que va ENCIMA del retrato.

    La silueta se engorda y se le difumina el borde (ver ENSANCHE/DIFUMINADO).
    Recortada en seco, a la altura de la cabeza el borde derecho se queda entre
    13 y 32 puntos por dentro de su parte más ancha, y cortaba el pelo con una
    diagonal recta pegada a la cara.
    """
    with Image.open(SRC / "paso_4.png") as im:
        rgba = np.array(im.convert("RGBA"))

    silhouette = (rgba[..., 3] < 16) & (rgba[..., :3].min(2) > 200)

    alpha = suavizar_silueta(Image.fromarray((silhouette * 255).astype(np.uint8)))

    mask = np.zeros_like(rgba)
    mask[..., :3] = 255
    mask[..., 3] = np.array(alpha)
    # Solo al backend: el marco lo compone sharp, el frontend muestra el
    # resultado ya montado.
    Image.fromarray(mask).save(OUT_BACKEND / "resultado-mascara.png")
    shutil.copyfile(SRC / "paso_4.png", OUT_BACKEND / "resultado-marco.png")

    # El recuadro se mide sobre la máscara YA suavizada: si se midiera sobre la
    # silueta en seco, el backend recortaría justo el degradado del borde.
    ys, xs = np.where(np.array(alpha) > 0)
    h, w = silhouette.shape
    log(f"resultado-mascara.png      silueta {xs.max() - xs.min() + 1}×{ys.max() - ys.min() + 1} px")
    log(
        f"                           left {xs.min() / w * 100:.2f}%  top {ys.min() / h * 100:.2f}%  "
        f"w {(xs.max() - xs.min() + 1) / w * 100:.2f}%  h {(ys.max() - ys.min() + 1) / h * 100:.2f}%"
    )
    print(
        f"\n  ► RESULTADO_SILUETA = {{ left: {xs.min()}, top: {ys.min()}, "
        f"width: {xs.max() - xs.min() + 1}, height: {ys.max() - ys.min() + 1} }}  "
        f"(lienzo {w}×{h})\n"
    )


def build_logo() -> None:
    """
    Recorta el lockup "CLARO TECH SUMMIT 2026" del arte del QR.

    Las cinco pantallas traen su texto pintado, así que el logo solo hace falta
    suelto para la pantalla de generación, que no tiene arte propio.
    """
    with Image.open(SRC / "paso_5.png") as im:
        full = im.convert("RGBA")
    rgba = np.array(full)
    h, w = rgba.shape[:2]

    # Ventana ceñida al lockup: más ancha entra la ola decorativa de la esquina,
    # más alta entra la línea roja que va debajo.
    wx0, wy0, wx1, wy1 = int(0.345 * w), int(0.065 * h), int(0.655 * w), int(0.152 * h)
    window = rgba[wy0:wy1, wx0:wx1]
    ys, xs = np.where(window[..., 3] > 60)

    box = (wx0 + int(xs.min()), wy0 + int(ys.min()), wx0 + int(xs.max()) + 1, wy0 + int(ys.max()) + 1)
    logo = full.crop(box)
    logo.save(OUT / "logo.png")
    log(f"logo.png                   {logo.width}×{logo.height}  ← paso_5.png")


def con_contorno(logo: Image.Image, grosor: float = 0.045) -> Image.Image:
    """
    Le pone al logo el mismo halo negro que usan las artes de la campaña.

    Las esquinas del marco están ocupadas —retícula roja a la izquierda, ola
    densa a la derecha—, así que un logo blanco plano se pierde encima. El
    contorno es el recurso que ya usa el arte original para el mismo problema
    (mira "Soluciones Digitales" en paso_3), no un invento.
    """
    radio = max(2, round(grosor * logo.height))
    margen = radio * 3
    lienzo = Image.new("RGBA", (logo.width + margen * 2, logo.height + margen * 2), (0, 0, 0, 0))
    lienzo.paste(logo, (margen, margen))

    # Dilatar el alfa y difuminarlo da el halo; repetirlo lo vuelve opaco
    # bajo el texto sin engordar la silueta.
    halo = lienzo.split()[3].filter(ImageFilter.MaxFilter(radio * 2 + 1))
    halo = halo.filter(ImageFilter.GaussianBlur(radio))
    halo = halo.point(lambda v: min(255, int(v * 2.2)))

    sombra = Image.new("RGBA", lienzo.size, (0, 0, 0, 0))
    sombra.putalpha(halo)
    return Image.alpha_composite(sombra, lienzo)


def build_corner_logos() -> None:
    """
    Logos que el cliente pidió en las esquinas superiores de la imagen generada.

    Vienen enormes (el de la izquierda mide 15224 px de ancho) y con mucho
    margen transparente alrededor, que descuadraría cualquier posicionamiento.
    Se recortan a su contenido y se bajan a un tamaño razonable: el lienzo
    final son 1123 px de ancho, así que 900 px de lado mayor sobra para que se
    vean nítidos.
    """
    Image.MAX_IMAGE_PIXELS = None

    for origen, destino in [
        ("logo arriba izquierda.png", "logo-izquierda.png"),
        ("logo arriba derecha.png", "logo-derecha.png"),
    ]:
        with Image.open(SRC / "logos" / origen) as im:
            full = im.convert("RGBA")

        ys, xs = np.where(np.array(full)[..., 3] > 20)
        recorte = full.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
        recorte.thumbnail((900, 900), Image.LANCZOS)
        recorte = con_contorno(recorte)
        recorte.save(OUT_BACKEND / destino)

        log(
            f"{destino:26s} {recorte.width}×{recorte.height}  "
            f"(proporción {recorte.width / recorte.height:.3f})  ← {origen}"
        )


def fade_edge(im: Image.Image, side: str, fraction: float) -> Image.Image:
    """Desvanece un borde hasta alpha 0, para que el recorte no deje costura."""
    im = im.convert("RGBA")
    w, h = im.size
    alpha = np.array(im)[..., 3].astype(float)

    span = max(1, int(fraction * h))
    ramp = np.linspace(0.0, 1.0, span)

    if side == "bottom":
        alpha[h - span :] *= ramp[::-1][:, None]
    elif side == "top":
        alpha[:span] *= ramp[:, None]
    else:
        raise ValueError(side)

    out = np.array(im)
    out[..., 3] = alpha.astype(np.uint8)
    return Image.fromarray(out)


def build_estilos_pieces() -> None:
    """
    Piezas de la pantalla de estilos.

    paso_2.jpeg es un montaje: trae las cuatro tarjetas dibujadas dentro, y su
    resplandor rojo se derrama por toda la banda central, así que no se puede
    reutilizar de fondo ni taparlo con un rectángulo negro sin que se note.

    De ahí que esa pantalla se arme por partes: la cabecera sale de paso_2
    (logo + titular + bajada), el pie sale de paso_3 (donde "Soluciones
    Digitales" está limpio sobre transparencia) y las tarjetas van en medio.
    Los bordes que dan al centro se desvanecen para que no quede costura.
    """
    with Image.open(SRC / "paso_2.jpeg") as im:
        fondo = im.convert("RGBA")
    w, h = fondo.size

    cabecera = fondo.crop((0, 0, w, int(0.25 * h)))
    cabecera = fade_edge(cabecera, "bottom", 0.10)
    cabecera.save(OUT / "estilos-cabecera.png")
    log(f"estilos-cabecera.png       {cabecera.width}×{cabecera.height}  ← paso_2.jpeg")

    with Image.open(SRC / "paso_3.png") as im:
        camara = im.convert("RGBA")
    cw, ch = camara.size
    pie = camara.crop((int(0.18 * cw), int(0.015 * ch), int(0.84 * cw), int(0.068 * ch)))
    pie.save(OUT / "soluciones-digitales.png")
    log(f"soluciones-digitales.png   {pie.width}×{pie.height}  ← paso_3.png")


def build_style_cards() -> list[tuple[int, str, tuple[float, float, float, float]]]:
    """
    Cada arte de estilo es una capa de pantalla completa con la tarjeta en su
    cuadrante. Se recorta cada tarjeta a su caja real para que sea un elemento
    normal —posicionable, clicable y animable— en vez de cuatro capas que se
    pisan y se comen los clics.

    Además se recorta la foto interior como referencia de estilo para el modelo.
    """
    layout: list[tuple[int, str, tuple[float, float, float, float]]] = []

    for filtro_id, filename in ESTILOS:
        with Image.open(ESTILOS_SRC / filename) as im:
            full = im.convert("RGBA")
        rgba = np.array(full)
        canvas_h, canvas_w = rgba.shape[:2]

        x0, y0, x1, y1 = largest_opaque_box(rgba)
        card = full.crop((x0, y0, x1 + 1, y1 + 1))
        card.save(OUT_ESTILOS / f"tarjeta-{filtro_id}.png")

        px0, py0, px1, py1 = inner_photo_box(np.array(card))
        photo = card.crop((px0, py0, px1 + 1, py1 + 1)).convert("RGB")
        # Solo al backend: es la referencia que se le adjunta al modelo, y la
        # publica en Storage la primera vez que se usa el filtro.
        photo.save(OUT_BACKEND / f"referencia-{filtro_id}.jpg", quality=95)

        box = (
            x0 / canvas_w * 100,
            y0 / canvas_h * 100,
            (x1 - x0 + 1) / canvas_w * 100,
            (y1 - y0 + 1) / canvas_h * 100,
        )
        layout.append((filtro_id, filename, box))
        log(
            f"tarjeta-{filtro_id}.png ({filename[:-4]:20s}) {card.width}×{card.height}"
            f"   referencia {photo.width}×{photo.height}"
        )

    return layout


def main() -> int:
    if not SRC.exists():
        print(f"❌ No encuentro {SRC}")
        return 1

    for folder in (OUT, OUT_ESTILOS, OUT_BACKEND):
        folder.mkdir(parents=True, exist_ok=True)

    print("\n🔴 Claro Tech Summit 2026 · preparando assets\n")

    print("── Artes de pantalla ──")
    copy_art("paso_1.png", "registro.png")
    copy_art("paso_3.png", "camara.png")
    copy_art("paso_5.png", "qr.png")
    build_logo()

    print("\n── Pantalla de estilos ──")
    build_estilos_pieces()

    print("\n── Logos de esquina ──")
    build_corner_logos()

    print("\n── Resultado (marco + máscara) ──")
    build_result_mask()

    print("── Tarjetas de estilo ──")
    layout = build_style_cards()

    print("\n  ► Posiciones para TARJETAS en src/config/summit.ts")
    print("    (lienzo compartido 1131×1391, % del contenedor de tarjetas)")
    for filtro_id, filename, (left, top, width, height) in layout:
        print(
            f"      {filtro_id}: {filename[:-4]:22s} "
            f"left {left:6.2f}%  top {top:6.2f}%  width {width:6.2f}%  height {height:6.2f}%"
        )

    print("\n✅ Listo\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
