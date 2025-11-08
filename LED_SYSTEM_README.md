# 📺 Sistema de Pantallas LED - Xnova Gofest

Sistema de cola rotativa para mostrar imágenes en 3 pantallas LED sincronizadas.

## 🎯 Funcionamiento

Las imágenes se rotan automáticamente cada **5 segundos** entre 3 pantallas:

```
Tiempo | Pantalla 1 | Pantalla 2 | Pantalla 3
-------|------------|------------|------------
  0s   | Imagen 1   | -          | -
  5s   | Imagen 2   | Imagen 1   | -
 10s   | Imagen 3   | Imagen 2   | Imagen 1
 15s   | Imagen 4   | Imagen 3   | Imagen 2
```

## 📁 Estructura de la Colección

### Colección: `XnovaGofestLED`

```typescript
{
  // Campos originales
  nombre: string,              // Nombre del usuario
  email: string,               // Email
  telefono: string,            // Teléfono
  empresa: string,             // Empresa
  imageUrl: string,            // URL de la imagen
  consentimientoAceptado: string, // "Sí"
  date: timestamp,             // Fecha de creación
  correoEnviado: boolean,      // Si se envió correo

  // Campos del sistema LED
  displayOrder: number,        // Orden en la cola (1, 2, 3...)
  currentScreen: number,       // 0=pendiente, 1-3=pantalla actual
  lastScreenUpdate: timestamp, // Última actualización
  screenHistory: number[],     // [1, 2, 3] historial
  status: string              // 'pending' | 'displaying' | 'completed'
}
```

## 🚀 Pasos de Implementación

### 1. Migrar los datos existentes

Accede al panel de administración:

```
/admin-led
```

Opciones disponibles:

- **Migrar Colección**: Duplica `XnovaGofest` → `XnovaGofestLED`
- **Crear Datos de Prueba**: Genera 3 imágenes de prueba

### 2. Visualizar las pantallas LED

Accede a la vista de pantallas:

```
/led-screens
```

Verás 3 pantallas en tiempo real mostrando las imágenes rotativas.

### 3. Agregar nuevas imágenes

Cuando se cree un nuevo registro, usa el servicio LED:

```typescript
import ledScreenService from './services/ledScreenService';

// Agregar imagen a la cola
const newImage = {
  nombre: "Juan Pérez",
  email: "juan@example.com",
  telefono: "3001234567",
  empresa: "Tech Corp",
  imageUrl: "https://...",
  consentimientoAceptado: "Sí",
  correoEnviado: true
};

await ledScreenService.addImageToQueue(newImage);
```

## 📊 Estados de las Imágenes

- **pending**: En cola, esperando ser mostrada
- **displaying**: Actualmente en una pantalla (1, 2 o 3)
- ~~**completed**: Ya pasó por las 3 pantallas~~ ✅ **Las imágenes se reciclan automáticamente**

### ♻️ Sistema de Reciclaje Infinito

Cuando una imagen completa el ciclo de las 3 pantallas:

1. Automáticamente vuelve al estado `pending`
2. Se limpia su historial (`screenHistory = []`)
3. Vuelve a entrar en la cola de rotación

**Esto garantiza que las pantallas SIEMPRE tengan contenido visible**, incluso con pocas imágenes en la base de datos.

**Ejemplo con 3 imágenes:**

```
Ciclo 1: [Img1] → [Img2] → [Img3]
Ciclo 2: [Img1] → [Img2] → [Img3]  ♻️ Repetición infinita
Ciclo 3: [Img1] → [Img2] → [Img3]
```

## 🎨 Personalización

### Cambiar tiempo de rotación

En `ledScreenService.ts`:

```typescript
private screenRotationInterval = 5000; // 5 segundos
```

### Modificar colores de pantallas

En `LEDScreen.scss`:

```scss
.screen-1 { color: #ff0080; } // Rosa
.screen-2 { color: #00d4ff; } // Azul
.screen-3 { color: #ffd700; } // Dorado
```

## 🔧 Arquitectura

```
┌─────────────────────────────────────────┐
│  Firebase Firestore (XnovaGofestLED)    │
│  - Almacena imágenes y estado           │
└──────────────┬──────────────────────────┘
               │
               │ Real-time listeners
               │
┌──────────────▼──────────────────────────┐
│  ledScreenService.ts                    │
│  - Gestiona cola y rotación             │
│  - Actualiza estados cada 5s            │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┬──────────┐
        │             │          │
┌───────▼────┐ ┌──────▼───┐ ┌───▼──────┐
│ Pantalla 1 │ │Pantalla 2│ │Pantalla 3│
│  (Rosa)    │ │ (Azul)   │ │(Dorado)  │
└────────────┘ └──────────┘ └──────────┘
```

## 📱 Rutas Disponibles

- `/admin-led` - Panel de administración y migración
- `/led-screens` - Vista de las 3 pantallas LED
- `/led-screen/1` - Pantalla individual 1
- `/led-screen/2` - Pantalla individual 2
- `/led-screen/3` - Pantalla individual 3

## ⚡ Características

- ✅ Rotación automática cada 5 segundos
- ✅ Sincronización en tiempo real (Firebase)
- ✅ 3 pantallas simultáneas
- ✅ Animaciones suaves (fade-in)
- ✅ Colores diferentes por pantalla
- ✅ Sistema de cola automático
- ✅ Responsive design
- ✅ Estado persistente

## 🔍 Monitoreo

Logs en consola:

```
🎬 Sistema de rotación de pantallas LED iniciado
📺 Pantalla 1 actualizada: {...}
🏷️ Logo posicionado: (20, 20)
```

## 📞 Soporte

Para cualquier duda o modificación, consulta:

- `src/services/ledScreenService.ts` - Lógica de negocio
- `src/components/LEDScreens/` - Componentes visuales
- `src/utils/migrationScript.ts` - Script de migración
