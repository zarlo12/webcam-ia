---
name: Desbloquea Tu Poder — Claro Gaming 2026
description: Campaña gaming de Claro con 4 personajes IA (guerrero/cyberpunk x hombre/mujer), tema negro/rojo cyberpunk
type: project
---

Campaña activa: **"Desbloquea Tu Poder"** para Claro Gaming.

**Why:** El jefe (Danilo González) envió 4 prompts nuevos para transformar fotos reales en personajes de videojuego. Se migró del tema anterior (Fiesta Jesús Ávila 2026, playa Peanuts) a este nuevo tema.

**How to apply:** El proyecto sigue siendo la misma app webcam-IA con Replicate + Firebase. Los cambios afectan el flujo, prompts, visual y Firebase collection.

## Flujo actual
1. **Selection** — Formulario (Nombre, Apellidos, Email, Dirección + términos) + selección de género (hombre/mujer) + estilo (guerrero/cyberpunk)
2. **Photo** — Captura de foto con webcam
3. **Waiting** — Pantalla de carga con spinner rojo/cyan
4. **Result** — Imagen generada + "ESTÁS LISTO PARA EL JUEGO" + QR

## 4 prompts (AvatarPhoto.tsx — PROMPTS map)
- `mujer-guerrero` — Guerrera fantasía, armadura metal+cuero, espada/hacha, fondo rojo gradiente
- `mujer-cyberpunk` — Cyberpunk futurista, visor/gafas, jetpack, neón rojo+cyan, pose flotando
- `hombre-guerrero` — Guerrero épico, armadura pesada, hacha/martillo/espada, iluminación dramática
- `hombre-cyberpunk` — Cyberpunk masculino, techwear/cyber armor, jetpack, glowing lines rojo+cyan

## Datos Firestore
- Collection: `DesbloqueatuPoder`
- Storage: `DesbloqueatuPoder/`
- Campos: nombre, apellidos, email, direccion, terms, gender, characterStyle, imageUrl, imagenOriginal, date

## Paleta visual
- Fondo: `#080808` (negro)
- Rojo principal: `#E30613` (Claro red)
- Cyan acento: `#00D4FF`
- Texto: `#FFFFFF` / `#AAAAAA`

## Archivos clave
- `src/components/Selection/` — Nuevo componente (pantalla 1)
- `src/components/AvatarAi/AvatarPhoto.tsx` — 4 prompts en mapa PROMPTS
- `src/App.tsx` — Estados: nombre, apellidos, email, direccion, terms, gender, characterStyle
