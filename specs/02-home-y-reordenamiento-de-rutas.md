# SPEC 02 — Pantalla de inicio (Home) y reordenamiento de rutas

> **Status:** Aprobado
> **Depends on:** 01-pantallas-visuales-mvp
> **Date:** 2026-07-28
> **Objective:** Implementar la pantalla de inicio (home.jsx del template) en Next.js como nueva ruta raíz `/`, migrando la biblioteca actual a `/juegos` y actualizando el Nav para reflejar Inicio / Biblioteca / Salón de la Fama / Acerca de.

## Scope

**In:**

- Nueva ruta raíz `/` que renderiza la pantalla de inicio (home.jsx del template): hero, sección "¿Por qué Arcade Vault?", preview de juegos, stats, actividad en vivo (ticker + top jugadores), pricing/FAQ, CTA final.
- Migración de la biblioteca actual (hoy en `/`) a la nueva ruta `/juegos`, sin cambios funcionales respecto a spec 01.
- Actualización del Nav (`components/nav.tsx`):
  - Nuevo link "Inicio" → `/`.
  - El link "Biblioteca" pasa a apuntar a `/juegos` (antes `/`).
  - Nuevo link "Acerca de" → `/acerca-de` (ruta que aún no existe; se implementa en un spec futuro, este link puede dar 404 mientras tanto).
  - El logo pasa a apuntar a `/` (antes también apuntaba a `/`, sin cambio ahí, pero ahora `/` es Home en vez de Biblioteca).
  - Estado activo: "Inicio" activo solo en `/`; "Biblioteca" activo en `/juegos`, `/juego/[id]` y `/jugar/[id]` (mismo criterio que hoy, ruta base actualizada).
- Componente `components/home-view.tsx` (client) + `app/page.tsx` (server) siguiendo el mismo patrón page/view del resto de la app.
- Preview de juegos en Home reutiliza `GAMES` de `lib/games.ts` (primeros 6).
- Stat "N+ JUEGOS" calculado dinámicamente como `${GAMES.length}+`.
- Sección "Actividad en vivo" (ticker de puntuaciones recientes + top 5 jugadores de hoy) con datos estáticos, copiados tal cual del template (nombres, puntajes, tiempos "hace X min" fijos).
- Migración a `app/globals.css` de las clases CSS de `references/templates/styles.css` que usa específicamente home.jsx (hero, feature-grid, mini-card/mini-rail, home-stats, activity-grid/ticker/top-list, pricing-grid/faq, home-final, home-silos y sus variantes de color asociadas).
- Todos los CTAs de Home navegan a rutas reales: "Explorar juegos" / "Ver todos los juegos" / "Insertar moneda" → `/juegos`; "Crear cuenta" / "Empezar gratis" → `/login`; tarjetas de preview → `/juego/[id]`; "Ver salón" → `/salon-de-la-fama`.
- Animación de aparición al hacer scroll (`useReveal`, IntersectionObserver sobre `.reveal`) portada tal cual del template.

**Out of scope (para specs futuros):**

- Implementación de `/acerca-de` (about.jsx) — solo se agrega el link en el Nav, no la página.
- Cualquier estilo CSS específico de about.jsx o de los widgets de gamepad/arcade-cabinet (`.ab-*`, `.dp-*`, `.gp-*`, `.contact-*`) presentes en el diff reciente de `styles.css` — no se migran en este spec.
- Datos dinámicos/reales para la sección "Actividad en vivo" (quedan estáticos, como en el template).
- Cambios de comportamiento de Home según estado de sesión (los CTAs no cambian si el usuario ya inició sesión).
- Cualquier lógica de juego real, backend, o persistencia adicional a la ya existente de spec 01.

## Data model

Este spec no introduce ninguna estructura de datos nueva ni cambia `lib/games.ts`. Se omite la sección formal de modelo de datos.

Nota: los arrays estáticos del ticker de actividad y del top 5 jugadores (nombre, juego, puntaje, tiempo/rango) viven como literales locales dentro de `components/home-view.tsx` — no se agregan a `lib/games.ts` ni se exponen como tipos compartidos, porque son contenido decorativo fijo, no datos reutilizables por otras pantallas.

## Implementation plan

1. Migrar `app/globals.css`: agregar las clases CSS de `references/templates/styles.css` correspondientes a home.jsx (hero, feature-grid, mini-card/mini-rail, home-stats, activity-grid/ticker/top-list, pricing-grid/faq, home-final, home-silos y variantes de color asociadas). Prueba: `npm run build` compila sin errores; no hay cambio visual todavía (clases sin usar aún).
2. Mover la biblioteca de `/` a `/juegos`: crear `app/juegos/page.tsx` con el mismo contenido que el actual `app/page.tsx` (renderiza `LibraryView` con `GAMES`); eliminar temporalmente el `app/page.tsx` viejo. Prueba: `/juegos` muestra la biblioteca igual que antes.
3. Actualizar todas las referencias internas que apuntaban a `/` como "volver a la biblioteca" para que apunten a `/juegos`: botón "VOLVER A LA BIBLIOTECA" en `hall-of-fame-view.tsx`, "VOLVER AL VAULT" en `game-detail-view.tsx` y en el modal de fin de juego de `game-player-view.tsx`. Prueba: desde salón de la fama, detalle de juego y modal de fin de partida, esos botones llevan a `/juegos`.
4. Actualizar el redirect post-login/registro/invitado en `auth-view.tsx` de `/` a `/juegos` (mantiene el comportamiento original: tras iniciar sesión el usuario llega a la biblioteca, no a la landing). Prueba: iniciar sesión, crear cuenta o entrar como invitado redirige a `/juegos`.
5. Crear `components/home-view.tsx` (client component) portando el JSX de `references/templates/home.jsx`: `FloatingSilhouettes`, `MiniCard`, `FeatureIcon`, `useReveal`, y la sección principal, reemplazando `navigate(...)` por `Link`/`router.push` de Next.js hacia `/juegos`, `/login`, `/juego/[id]`, `/salon-de-la-fama` según corresponda. El stat "N+ JUEGOS" se calcula como `${GAMES.length}+`. Prueba: el componente compila y renderiza sin errores al montarlo en una ruta de prueba.
6. Crear `app/page.tsx` (server) que renderiza `HomeView` pasándole `GAMES` de `lib/games.ts`. Prueba: `/` muestra la pantalla de inicio completa (hero, features, preview de juegos, stats, actividad, pricing, CTA final) con la animación de scroll-reveal funcionando.
7. Actualizar `components/nav.tsx`: agregar link "Inicio" → `/`, cambiar el link "Biblioteca" para que apunte a `/juegos`, agregar link "Acerca de" → `/acerca-de`, y ajustar la lógica de estado activo (`isHomeActive` para `/`, `isLibraryActive` para `/juegos` + `/juego/[id]` + `/jugar/[id]`). Aplicar en el menú de escritorio y en el panel móvil. Prueba: el Nav muestra los 4 links en el orden correcto y resalta el activo según la ruta, en escritorio y en móvil.
8. Pasada final: recorrido manual por `/`, `/juegos`, `/juego/[id]`, `/jugar/[id]`, `/salon-de-la-fama`, `/login`, verificando que todos los CTAs y botones de "volver" naveguen a la ruta correcta y que no haya errores ni warnings en la consola. Prueba: recorrido completo sin errores de consola ni enlaces rotos (salvo `/acerca-de`, que da 404 de forma esperada).

## Acceptance criteria

- [ ] `/` muestra la pantalla de inicio: hero con eyebrow/título/subtítulo/CTAs, silhouettes flotantes decorativas, sección "¿Por qué Arcade Vault?" con 4 feature cards, preview de 6 juegos, sección de stats, actividad en vivo (ticker + top 5), pricing con FAQ, y CTA final.
- [ ] `/juegos` muestra la biblioteca completa (buscador, chips de categoría, grid de 8 juegos), igual que la anterior `/` de spec 01.
- [ ] En Home, "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →" e "INSERTAR MONEDA →" navegan a `/juegos`.
- [ ] En Home, "CREAR CUENTA" y "EMPEZAR GRATIS →" navegan a `/login`.
- [ ] En Home, cada tarjeta de preview de juego navega a `/juego/[id]` del juego correspondiente.
- [ ] En Home, "VER SALÓN →" navega a `/salon-de-la-fama`.
- [ ] El stat de juegos en Home muestra `${GAMES.length}+` (hoy "8+"), no el texto fijo "12+" del template.
- [ ] Las secciones marcadas con `.reveal` en Home aparecen con la animación al hacer scroll (igual que en el template).
- [ ] El Nav muestra, en este orden, en escritorio y en el panel móvil: Inicio, Biblioteca, Salón de la Fama, Acerca de.
- [ ] "Inicio" está activo solo en `/`; "Biblioteca" está activo en `/juegos`, `/juego/[id]` y `/jugar/[id]`; "Salón de la Fama" solo en `/salon-de-la-fama`.
- [ ] El link "Acerca de" apunta a `/acerca-de` (404 esperado, ya que la página no se implementa en este spec).
- [ ] El logo del Nav navega a `/`.
- [ ] "VOLVER A LA BIBLIOTECA" (salón de la fama), "VOLVER AL VAULT" (detalle de juego y modal de fin de partida) navegan a `/juegos`.
- [ ] Iniciar sesión, crear cuenta o entrar como invitado desde `/login` redirige a `/juegos`.
- [ ] No hay errores ni warnings en la consola del navegador al recorrer `/`, `/juegos`, `/juego/[id]`, `/jugar/[id]`, `/salon-de-la-fama` y `/login`.

## Decisions

- **Sí:** `/` pasa a ser la pantalla de inicio (Home) y la biblioteca se mueve a `/juegos`. Decisión explícita del usuario para alinear la app con la intención del template actualizado (logo → home, Inicio y Biblioteca como links separados).
- **No:** mantener `/` como biblioteca y meter Home en `/inicio`. Se descartó porque el propio nav.jsx actualizado ya trata "home" como el destino del logo, lo cual es más natural en `/`.
- **Sí:** todas las referencias internas que antes apuntaban a `/` con intención de "volver a la biblioteca" (`hall-of-fame-view.tsx`, `game-detail-view.tsx`, `game-player-view.tsx`) se actualizan a `/juegos`, incluyendo el redirect post-login de `auth-view.tsx`. Mantiene el comportamiento original (login → biblioteca) ahora que `/` significa otra cosa.
- **Sí:** se agrega el link "Acerca de" al Nav ya, apuntando a `/acerca-de`, aunque la página no exista todavía (404 esperado). Decisión explícita del usuario: preferir tener el link visible ahora y resolver la página en un spec futuro, en vez de ocultarlo.
- **Sí:** la sección "Actividad en vivo" usa datos estáticos copiados tal cual del template (nombres de juego en Title Case, distintos del formato MAYÚSCULAS de `lib/games.ts`). Es contenido decorativo, no conectado a datos reales, consistente con cómo spec 01 ya trata el mock data.
- **No:** generar la actividad en vivo desde `seededScores()`/`GAMES`. Se descartó para minimizar el alcance de este spec — no aporta valor real ya que igual es data falsa.
- **Sí:** el stat "N+ JUEGOS" se calcula dinámicamente (`GAMES.length`) en vez de dejar el "12+" fijo del template, para que no quede una cifra incorrecta respecto al catálogo real (8 juegos).
- **No:** migrar en este spec el CSS de about.jsx ni de los widgets de gamepad/arcade-cabinet (`.ab-*`, `.dp-*`, `.gp-*`, `.contact-*`) agregados recientemente a `styles.css`. Quedan fuera de alcance porque pertenecen a about.jsx, no a home.jsx.
- **Sí:** se mantiene el patrón `page.tsx` (Server) + `*-view.tsx` (Client) establecido en spec 01, con `components/home-view.tsx` para la interactividad de Home.

## Risks

| Risk | Mitigation |
| --- | --- |
| Cambiar el significado de `/` (de biblioteca a home) es una ruptura de comportamiento respecto a spec 01; cualquier enlace o marcador guardado a `/` esperando la biblioteca ahora ve la landing. | Cambio intencional confirmado por el usuario. Se documenta explícitamente en este spec como reemplazo del comportamiento de spec 01. |
| El link "Acerca de" en el Nav apunta a una ruta (`/acerca-de`) que no existe todavía, generando un 404 real si se hace clic. | Aceptado como comportamiento esperado en este spec (decisión explícita); se resuelve en el spec que implemente about.jsx. |
| Al mover `app/page.tsx` a `app/juegos/page.tsx`, cualquier referencia interna olvidada que siga apuntando a `/` esperando biblioteca quedaría rota silenciosamente (sin error de build, solo de comportamiento). | El paso 3 del plan de implementación lista explícitamente los 3 puntos conocidos (`hall-of-fame-view.tsx`, `game-detail-view.tsx`, `game-player-view.tsx`) más el redirect de `auth-view.tsx`; el paso 8 incluye un recorrido manual completo para detectar cualquier otro caso. |
