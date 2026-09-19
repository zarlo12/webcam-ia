# Claro Tech Summit 2026 · Soluciones Digitales

Kiosco de generación de imágenes con IA. El visitante se registra, elige un
estilo, se toma una foto y recibe su retrato generado con un QR para
descargarlo en el celular.

```
registro → estilos → cámara → generando → resultado → QR
```

## Cómo está armado

**Las artes mandan.** Diseño entregó las cinco pantallas como PNG con
transparencia sobre negro: el arte trae el texto, los marcos y la decoración, y
deja el hueco donde va el contenido vivo (los campos, la cámara, el retrato, el
código). El código solo pone encima lo interactivo, posicionado en % del lienzo
del arte, así que calza igual en cualquier tamaño de pantalla.

- `src/components/Stage/` — lienzo común: centra el arte respetando su
  proporción y da el sistema de coordenadas. Lo usan cuatro de las cinco
  pantallas.
- `src/config/summit.ts` — **fuente única** del catálogo de estilos y de las
  coordenadas de cada hueco. Ningún componente tiene coordenadas propias.
- `src/screens/` — una carpeta por pantalla.
- `src/App.tsx` — la máquina de pasos, y nada más.

La pantalla de estilos es la excepción: no tiene un arte propio (el mockup trae
las tarjetas dibujadas dentro), así que se arma por partes. Está explicado en
`src/screens/Estilos/Estilos.tsx`.

## Assets

Los assets de `src/assets/summit/` y `backend/functions/assets/summit/` **no se
editan a mano**: se derivan de `referencias_02/` con

```bash
python3 scripts/prepare-summit-assets.py
```

El script recorta las tarjetas, separa la silueta del retrato de su marco,
extrae el logo y prepara las referencias de estilo que se le mandan al modelo.
Al final imprime las medidas que hay que verificar contra `src/config/summit.ts`
si diseño entrega artes nuevas.

## Backend

Cloud Functions en el proyecto de Firebase `imagen-ia-845a3`, que hospeda varias
activaciones a la vez. Todo lo de esta va con nombre propio para no chocar:

| | |
|---|---|
| Funciones | `generateSummitImage`, `summitHealthCheck`, `getSummitStatus` |
| Colección Firestore | `claro_tech_summit_participantes` |
| Storage | `claro-tech-summit/{originales,generadas,referencias}` |
| Hosting | sitio `claro-tech-summit` |

Al generar, el backend manda al modelo dos imágenes —la referencia del estilo y
la foto del visitante— y sobre el retrato que devuelve compone el marco de la
campaña con `sharp`. Por eso lo que se ve en pantalla es exactamente lo que se
descarga por QR.

Las referencias de estilo viajan dentro del paquete de la función y se publican
solas en Storage la primera vez que se usan: no hay que subir plantillas a mano.
Si cambia un arte, hay que borrar el objeto viejo de
`claro-tech-summit/referencias/` para que se vuelva a publicar.

## Comandos

```bash
npm install
npm run dev                 # frontend en local
npm run build               # compila y empaqueta

cd backend/functions
npm install
./deploy-summit.sh          # despliega SOLO las funciones de esta activación

./test-summit.sh foto.jpg 4 # prueba los endpoints contra producción
```

`deploy-summit.sh` despliega por nombre a propósito: un
`firebase deploy --only functions` sin filtro volvería a desplegar las demás
campañas que viven en el mismo proyecto.

## Variables de entorno

Frontend (`.env`) — opcional, hay un valor por defecto en el código:

```
VITE_SUMMIT_FUNCTIONS_URL=https://us-central1-imagen-ia-845a3.cloudfunctions.net
```

Backend (`backend/functions/.env`):

```
REPLICATE_API_TOKEN=...
STORAGE_BUCKET=imagen-ia-845a3.appspot.com
```
