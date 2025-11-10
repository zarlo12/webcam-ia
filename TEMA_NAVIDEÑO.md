# 🎄 Tema Navideño - Documentación de Diseño

## 🎨 Paleta de Colores

### Colores Principales

- **Rojo Navideño**: `#C41E3A` - Color principal, usado en botones y acentos
- **Rojo Oscuro**: `#8B1428` - Para gradientes y sombras
- **Verde Pino**: `#165B33` - Fondo principal y elementos secundarios
- **Verde Oscuro**: `#0a4d2e` - Para gradientes de fondo
- **Verde Medio**: `#2d8659` - Transiciones en degradados

### Colores de Acento

- **Dorado Brillante**: `#FFD700` - Bordes, textos destacados y efectos
- **Naranja Dorado**: `#FFA500` - Gradientes en botones especiales
- **Blanco Nieve**: `#FFFFFF` - Texto principal y fondos de tarjetas
- **Plateado**: `#C0C0C0` - Efectos sutiles

## 🎯 Elementos Principales

### 1. Fondos

```scss
// Fondo verde navideño con gradiente
background: linear-gradient(
  to bottom,
  #0a4d2e 0%,
  #165B33 30%,
  #2d8659 50%,
  #165B33 70%,
  #0a4d2e 100%
);
```

### 2. Efecto de Nieve Cayendo

- Copos grandes: Símbolos `❄ ❅ ❆` con animación de 15s
- Copos pequeños: Puntos `·` con animación de 10s
- Ambos con rotación y desvanecimiento gradual

### 3. Tarjetas (Cards)

```scss
background: rgba(255, 255, 255, 0.95);
border-radius: 30px;
box-shadow:
  0 10px 40px rgba(0, 0, 0, 0.3),
  0 0 0 3px #FFD700,
  inset 0 2px 20px rgba(255, 215, 0, 0.2);
border: 2px solid #C41E3A;
```

### 4. Botones Principales

```scss
// Botón rojo navideño
background: linear-gradient(135deg, #C41E3A 0%, #8B1428 100%);
border: 3px solid #FFD700;
color: #ffffff;
box-shadow:
  0 6px 0 rgba(22, 91, 51, 0.6),
  0 10px 25px rgba(0,0,0,0.4),
  inset 0 2px 0 rgba(255,215,0,0.3);
```

### 5. Header/Cabecera

```scss
background: linear-gradient(135deg, #C41E3A 0%, #8B1428 100%);
box-shadow:
  0 4px 20px rgba(196, 30, 58, 0.4),
  inset 0 -2px 10px rgba(0, 0, 0, 0.2);
border-bottom: 3px solid #FFD700;
```

## 📱 Componentes Específicos

### Selector de Género

- Fondo: Verde navideño `#165B33`
- Borde: Dorado `#FFD700` (3px)
- Sombra elevada con efecto 3D
- Hover: Verde más claro con mayor elevación

### Inputs de Formulario

- Fondo: Blanco con toque crema
- Borde: Dorado `#FFD700` (3px)
- Focus: Cambio a rojo `#C41E3A` en el borde
- Placeholder: Verde oscuro semi-transparente

### Marco de Cámara

- Borde: Dorado `#FFD700` (4px)
- Border-radius: 20px
- Sombra: Roja con efecto de profundidad
- Fondo interno: Gradiente dorado/plateado sutil

### Checkbox Navideño

- Fondo: Blanco
- Borde: Dorado `#FFD700`
- Checked: Gradiente rojo con check dorado `✓`
- Sombra con efecto de profundidad

## 🎬 Animaciones

### Nieve Cayendo (`snowfall`)

```scss
@keyframes snowfall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(360deg);
    opacity: 0.3;
  }
}
```

### Luces Parpadeantes (`twinkle`)

```scss
@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}
```

### Spinner de Carga

- Bordes: Dorado, Rojo y Verde
- Rotación continua de 360°
- Sombras en colores navideños

## 🔧 Efectos Especiales (christmas-effects.css)

### Efectos Disponibles

1. **christmas-lights**: Luces navideñas parpadeantes
2. **golden-glow**: Brillo dorado pulsante
3. **starshine**: Estrellas brillantes rotando
4. **christmas-text**: Texto con gradiente navideño
5. **christmas-border**: Borde animado multicolor
6. **frost-effect**: Efecto de escarcha deslizante
7. **christmas-bell**: Campanas balanceándose
8. **garland-top**: Guirnalda decorativa superior
9. **christmas-card-hover**: Hover especial para tarjetas

### Uso de Efectos Especiales

```tsx
// Importar en main.tsx o componente específico
import './christmas-effects.css';

// Aplicar clases
<div className="christmas-text">Feliz Navidad</div>
<div className="frost-effect christmas-card-hover">
  Contenido con efectos
</div>
```

## 🎨 Mejores Prácticas

### Contraste y Legibilidad

- Texto oscuro sobre fondos claros
- Texto dorado/blanco sobre fondos oscuros
- Sombras de texto para mejor legibilidad

### Consistencia

- Border-radius: 20-30px para elementos principales
- Transiciones: 0.08s - 0.3s ease
- Sombras múltiples para profundidad

### Accesibilidad

- Contraste mínimo 4.5:1 para texto
- Bordes gruesos (3px) para mejor visibilidad
- Estados hover/focus claramente diferenciados

## 🚀 Archivos Modificados

1. **src/components/AvatarAi/AvatarPhoto.scss**

   - Fondo verde con nieve
   - Botones navideños
   - Tarjeta con marco dorado
   - Selector de género festivo

2. **src/components/AvatarWait/Waiting.scss**

   - Mismo fondo con nieve
   - Inputs navideños
   - Checkbox festivo
   - Spinner de carga temático

3. **src/index.css**

   - Colores globales
   - Botones por defecto navideños
   - Fondo verde base

4. **src/App.css**

   - Root con fondo verde
   - Logo con sombra dorada
   - Cards con estilo festivo

5. **src/christmas-effects.css** (NUEVO)
   - Efectos adicionales opcionales
   - Animaciones especiales
   - Clases utilitarias festivas

## 🎁 Características Especiales

### Efecto de Nieve

- Animación continua e infinita
- Doble capa (copos grandes y pequeños)
- No interfiere con la interacción del usuario (pointer-events: none)

### Profundidad Visual

- Uso de múltiples box-shadows
- Efectos de inset para brillos internos
- Sombras de elevación para efecto 3D

### Interactividad

- Transformaciones en hover (-3px translateY)
- Efectos en active (+2px translateY)
- Cambios de color suaves en transiciones

## 📝 Notas de Implementación

- Todos los colores están en formato HEX para consistencia
- Las animaciones usan `ease` o `linear` según el efecto deseado
- Los z-index están organizados: fondo (1), contenido (2), header (3), card (10)
- Se mantiene la estructura HTML original
- Compatible con todos los navegadores modernos

---

🎄 **¡Felices Fiestas!** 🎄
