# Gradient Studio

Editor web para crear fondos de gradiente animados en tiempo real con WebGL. Elige un estilo, ajusta la paleta y los parámetros, aplica un efecto, y exporta un PNG o comparte el diseño con un link.

## Funciones

- **7 estilos animados:** Flow, Beam, Mesh, Liquid, Wave, Silk y Stripe, con escala, curl, drift, openness, seed, velocidad y grain.
- **Paleta de 2 a 8 colores:** selector de color, input hex, presets, generador de paletas armónicas, bloqueo de colores y reordenamiento arrastrando.
- **6 efectos:** grain, glow, chromatic, glass, dither y halftone, con intensidad ajustable.
- **Timeline:** barra de progreso con scrubbing, duración de 5, 10, 20 o 30 s y loop sin cortes (excepto en Flow).
- **Exportar y compartir:** descarga PNG, link con todo el estado, relación de aspecto (Free, 16:9, 4:3, 1:1, 9:16) y pantalla completa.
- **Undo/redo** y guardado automático en `localStorage`.

## Atajos

| Tecla | Acción |
| --- | --- |
| `Espacio` | Genera una paleta armónica nueva |
| `P` | Play / pausa |
| `Tab` | Siguiente estilo |
| `Ctrl/Cmd + Z` | Deshacer |
| `Ctrl/Cmd + Shift + Z` | Rehacer |

## Desarrollo

Requiere Node 20 o superior.

```bash
npm install
npm run dev        # servidor de desarrollo en http://localhost:5173
npm run build      # typecheck + build de producción
npm run lint       # ESLint
npm run test:run   # tests (Vitest)
```

## Estructura

```
src/
  components/   UI: TopBar, Sidebar, GradientCanvas, PlaybackBar, EffectsPanel...
  constants/    rangos de parámetros, estilos y límites compartidos
  hooks/        useWebGL (contexto y render), useAnimation (loop), atajos
  shaders/      un shader por estilo, shared.ts (helpers GLSL) y post.ts (efectos)
  store/        estado global (Zustand) y validación de lo guardado
  utils/        URL compartible, timeline, export PNG, color y paletas
```

## Link compartible

El botón **Share** copia una URL con el diseño completo en la query string:

`shader`, `colors` (hex sin `#`, separados por coma), `scale`, `curl`, `drift`, `openness`, `seed`, `speed`, `grain`, `effect`, `fx` (intensidad 0 a 1), `dur` (5, 10, 20 o 30) y `ar`.

Los valores inválidos se ignoran y los numéricos se limitan a su rango.

## Tecnologías

React 18, TypeScript, Vite, Tailwind CSS, Zustand, WebGL 1 con shaders GLSL, Vitest y Testing Library.
