# Prompts de la campaña · Antioquia nos enseña a llegar lejos

Estos archivos son una **copia exportada** de la fuente real:
`backend/functions/src/config/feria.ts`. Sirven para pegarlos en Replicate
y probar. Si editas un prompt, edítalo en `feria.ts` y vuelve a exportar:

```bash
cd backend/functions && npm run build && cd ..
```

## Cómo probarlos en Replicate (google/nano-banana-2)

| Campo | Valor |
|---|---|
| image_input | **1º la plantilla, 2º la foto de la persona** |
| aspect_ratio | 3:4 |
| resolution | 1K |
| output_format | jpg |
| image_search / google_search | false |

El orden de las imágenes es crítico: el prompt las nombra IMAGE 1 e IMAGE 2.

## Qué archivo es cuál

| Archivo | Rótulo en la app | Plantilla |
|---|---|---|
| prompts/filtro1.txt | Filtro 1 | feria-colombia/Filtro1.png |
| prompts/filtro2.txt | Filtro 3 | feria-colombia/Filtro2.png |
| prompts/filtro3.txt | Filtro 2 | feria-colombia/Filtro3.png |
