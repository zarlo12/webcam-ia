# Claro media · DATA TECH — "15 minutos"

Kiosco de pósters con IA. El visitante deja su correo, elige uno de los cinco
pósters de la campaña, se toma una foto y recibe el mismo póster con su rostro
en lugar del modelo, con un QR para descargarlo.

```
registro → plantillas → cámara → generando → resultado → QR
```

## Cómo está armado

Las cinco plantillas son **pósters terminados**: ya traen el titular, el badge
"15 MINUTOS" y los logos. El modelo reproduce el póster cambiando quién sale, y
lo que devuelve se publica tal cual — no se compone ningún marco encima.

- `src/components/Pantalla/` — armazón común: fondo, logo, titular y franja de
  controles. Las pantallas se construyen en CSS, no sobre artes con huecos.
- `src/config/datatech.ts` — catálogo de plantillas del lado del kiosco.
- `src/screens/dt/` — una carpeta por pantalla.
- `src/App.tsx` — la máquina de pasos, y nada más.

El registro pide **solo el correo**: sin nombre, sin cédula y sin casilla de
tratamiento de datos.

## Assets

Los de `src/assets/datatech/` y `backend/functions/assets/datatech/` **no se
editan a mano**: se derivan de `referencias_03/` con

```bash
npm run assets          # python3 scripts/prepare-datatech-assets.py
```

El script optimiza el fondo, recorta el logo y genera cada plantilla por
duplicado: en alta para el modelo y en miniatura para la pantalla de selección.

## Backend

Cloud Functions en el proyecto de Firebase `imagen-ia-845a3`, que hospeda
varias activaciones a la vez. **`claro-tech-summit` está en producción con
participantes reales**, así que todo lo de esta va con nombre propio:

| | |
|---|---|
| Funciones | `generateDatatechImage`, `datatechHealthCheck`, `listDatatechParticipantes` |
| Colección Firestore | `claro_datatech_participantes` |
| Storage | `claro-datatech/{originales,generadas,plantillas}` |
| Hosting | sitio `claro-datatech` |

`deploy-datatech.sh` despliega por nombre a propósito: un
`firebase deploy --only functions` sin filtro rompería el Summit.

Las plantillas viajan dentro del paquete de la función y se publican solas en
Storage la primera vez que se usan. Si cambia un arte, hay que borrar el objeto
viejo de `claro-datatech/plantillas/` para que se vuelva a publicar.

### Proveedor de generación

Se comparte con las demás campañas (`src/services/proveedores.ts`): corre sobre
**Replicate** o sobre **fal.ai**, los dos con el mismo modelo de Google
(nano-banana 2). Se elige con `IMAGE_PROVIDER` en el `.env` de las funciones.

Para probar el otro sin redesplegar se manda `provider=fal` en la petición.

## Panel de registros

`https://claro-datatech.web.app/panel` — tabla de participantes con la foto
original y el póster, filtros y exportación a Excel y CSV.

> ⚠️ **El panel no tiene contraseña** y muestra los correos. Para cerrarlo:
> descomentar el bloque `PANEL_TOKEN` en
> [`datatechController.ts`](backend/functions/src/controllers/datatechController.ts),
> poner `PANEL_TOKEN=...` en el `.env`, redesplegar y entrar con `/panel?token=...`.

## Comandos

```bash
npm install
npm run dev                      # frontend en local
npm run build                    # compila y empaqueta
npm run assets                   # regenera los assets desde referencias_03/

cd backend/functions
npm install
./deploy-datatech.sh             # despliega SOLO las funciones de esta activación

./test-datatech.sh foto.jpg 5    # prueba los endpoints contra producción
```

Hosting (desde la raíz del proyecto, no desde `backend/`):

```bash
firebase deploy --only hosting
```

## Variables de entorno

Frontend (`.env`) — opcional, hay un valor por defecto en el código:

```
VITE_DATATECH_FUNCTIONS_URL=https://us-central1-imagen-ia-845a3.cloudfunctions.net
```

Backend (`backend/functions/.env`):

```
IMAGE_PROVIDER=fal
FAL_KEY=id:secreto
REPLICATE_API_TOKEN=r8_...
STORAGE_BUCKET=imagen-ia-845a3.firebasestorage.app
```

## Otras campañas en este repo

Cada una vive en su propia rama y comparte el proyecto de Firebase, con todo
prefijado para no chocar:

| Rama | Activación | Colección |
|---|---|---|
| `proyecto-03` | Claro media · DATA TECH | `claro_datatech_participantes` |
| `claro-tech-summit` | Claro Tech Summit 2026 | `claro_tech_summit_participantes` |
| `feria-flores` | Feria de las Flores | `feria_colombia_participantes` |
