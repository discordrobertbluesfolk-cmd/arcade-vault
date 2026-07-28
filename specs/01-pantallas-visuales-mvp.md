# SPEC 01 — Pantallas visuales de Arcade Vault (MVP)

> **Status:** Implementado
> **Depends on:** Ninguno (primer spec del proyecto)
> **Date:** 2026-07-27
> **Objective:** Implementar en Next.js las 5 pantallas del template de referencia (biblioteca, detalle de juego, reproductor, inicio de sesión, salón de la fama) con datos mock y navegación real de App Router, sin lógica de juego jugable.

## Scope

**In:**

- 5 rutas reales de App Router: `/` (biblioteca), `/juego/[id]` (detalle), `/jugar/[id]` (reproductor), `/salon-de-la-fama`, `/login`.
- Layout raíz (`app/layout.tsx`) con Nav superior + panel móvil (hamburguesa) + footer, compartidos por todas las rutas.
- Capa de datos mock tipada en `lib/games.ts`: `GAMES`, `CATS`, `PLAYERS`, `seededScores()`, con interfaces `Game` y `ScoreRow`.
- Contexto de cliente para el usuario mock (login/registro/invitado), persistido en `localStorage`, consumido por Nav, la pantalla de login y el reproductor.
- Biblioteca: buscador por nombre, chips de categoría, grid de tarjetas de juego con efecto tilt.
- Detalle de juego: portada, tags, descripción, stats (partidas, mejor global, dificultad), leaderboard mock del juego, CTA "Jugar ahora".
- Reproductor: HUD (jugador, puntuación, vidas, nivel), arena animada solo con CSS (sin juego real), puntuación que sube sola con temporizador simulado, pausa/reanudar, modal de fin de juego con guardado mock de puntuación en `localStorage`.
- Salón de la fama: tabs por juego, podio top 3, tabla completa de puntuaciones, fila "tu mejor marca" si hay usuario logueado.
- Login: tabs iniciar sesión / crear cuenta, botón de invitado, botones sociales decorativos (Google/GitHub, sin funcionalidad real).
- Migración de `styles.css` del template a `app/globals.css`, adaptando colores/tokens al bloque `@theme inline` de Tailwind v4, conservando el diseño visual del mockup.
- Cada ruta: Server Component (`page.tsx`) que renderiza un Client Component interno con la interactividad.

**Out of scope (para specs futuros):**

- Lógica de juego real para cualquiera de los 8 juegos (Bloque Buster, Caída, Serpentina, etc.).
- Backend o autenticación real (OAuth Google/GitHub reales, verificación de contraseña, base de datos de usuarios).
- Persistencia real más allá de `localStorage` (sin API, sin DB).
- Modo versus / multijugador real (Duelo Pixel).
- Audio o efectos de sonido.
- Validación de puntuaciones o anti-cheat.
- Internacionalización (la app queda solo en español).
- Arte real de portadas (se mantienen los gradientes CSS como placeholder).
- Sistema real de créditos/monedas (el contador "CRÉDITOS · 03" queda estático, sin economía real).

## Data model

`lib/games.ts` — datos mock tipados, reutilizados por Server y Client Components:

```ts
export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
  cover: string; // clase CSS del gradiente placeholder, ej. "cover-bricks"
  color: "cyan" | "magenta" | "green" | "yellow";
  best: number;
  plays: string; // ej. "12.4K"
}

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string; // "DD/MM/2026"
}

export const GAMES: Game[]; // los mismos 8 juegos del template
export const CATS: string[]; // ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]
export const PLAYERS: string[]; // nombres para generar leaderboards falsos
export function seededScores(seed: number, count?: number): ScoreRow[];
```

Contexto de usuario mock (Client Component, ej. `components/user-context.tsx`), envuelto en `app/layout.tsx`:

```ts
type User = { name: string } | null;

interface UserContextValue {
  user: User;
  login: (u: User) => void;
  signOut: () => void;
  saveScore: (entry: { game: string; score: number; name: string }) => void;
}
```

Claves de `localStorage` (mismas que el template):

- `av_user` — usuario logueado (`User` serializado en JSON, o ausente/null si es invitado).
- `av_scores` — array de puntuaciones guardadas (`{ game, score, name, at }[]`).

No se introduce ningún otro almacenamiento; no hay base de datos ni API routes en este spec.

## Implementation plan

1. ~~Migrar styles.css a globals.css~~ — **Ya hecho.** `app/globals.css` tiene los estilos completos y `app/layout.tsx` ya carga las fuentes (Press Start 2P, JetBrains Mono, Courier Prime) y el scaffold `av-bg`/`av-noise`/`#root`/`av-main`.
2. Crear `lib/games.ts` con las interfaces `Game`/`ScoreRow` y los datos mock (`GAMES`, `CATS`, `PLAYERS`, `seededScores`) migrados de `data.jsx`. Prueba: el build de TypeScript compila sin errores.
3. Crear el contexto de usuario (`components/user-context.tsx`) con estado respaldado por `localStorage` (`av_user`, `av_scores`) y envolverlo en `app/layout.tsx`. Prueba: la app sigue arrancando igual, sin cambios visuales aún.
4. Construir `Nav` (client component, consume el contexto) con panel móvil de hamburguesa, y montarlo en `app/layout.tsx` junto con el footer (dentro del `#root` / `av-main` ya existente). Prueba: cualquier ruta muestra el Nav y el footer.
5. Implementar la biblioteca: `app/page.tsx` (server, reemplaza el scaffold de create-next-app) + `components/library-view.tsx` (client) con buscador, chips de categoría, grid de tarjetas con efecto tilt. Prueba: en `/`, buscar y filtrar funciona; cada tarjeta enlaza a `/juego/[id]`.
6. Implementar el detalle de juego: `app/juego/[id]/page.tsx` (server) + `components/game-detail-view.tsx`, con portada, tags, stats, leaderboard mock y CTA "Jugar ahora". Prueba: desde una tarjeta se llega al detalle correcto; "Jugar ahora" navega a `/jugar/[id]`.
7. Implementar login: `app/login/page.tsx` (server) + `components/auth-view.tsx` (client), con tabs iniciar sesión/crear cuenta, botón de invitado y botones sociales decorativos, conectados al contexto de usuario. Prueba: loguearse (o entrar como invitado) actualiza el Nav y persiste en `localStorage`.
8. Implementar el reproductor: `app/jugar/[id]/page.tsx` (server) + `components/game-player-view.tsx` (client), con HUD, arena CRT animada solo con CSS, puntuación simulada, pausa/reanudar y modal de fin de juego que guarda el puntaje vía el contexto. Prueba: el puntaje sube solo, pausa lo detiene, "Fin" abre el modal, "Guardar puntuación" escribe en `av_scores`.
9. Implementar el salón de la fama: `app/salon-de-la-fama/page.tsx` (server) + `components/hall-of-fame-view.tsx` (client), con tabs por juego, podio, tabla completa y fila "tu mejor marca" condicionada al usuario logueado. Prueba: cambiar de tab cambia el leaderboard; la fila del usuario aparece solo si hay sesión.
10. Pasada final: verificar el resaltado activo del Nav en las 5 rutas (Biblioteca activa también en detalle y reproductor), el panel móvil, y que no haya errores de consola ni desvíos visuales respecto al template. Prueba: recorrido manual completo por las 5 pantallas.

## Acceptance criteria

- [ ] `/` muestra la biblioteca: hero, buscador, chips de categoría y grid de tarjetas con los 8 juegos de `lib/games.ts`.
- [ ] Escribir en el buscador filtra las tarjetas por título en tiempo real.
- [ ] Seleccionar una categoría (chip) filtra las tarjetas por esa categoría; "TODOS" muestra las 8.
- [ ] Si el filtro no arroja resultados, se muestra el mensaje "NO HAY RESULTADOS".
- [ ] Hacer clic en una tarjeta o en "JUGAR" navega a `/juego/[id]` con el juego correcto.
- [ ] `/juego/[id]` muestra portada, tags, descripción, stats (partidas, mejor global, dificultad) y un leaderboard de 10 filas para ese juego.
- [ ] En el detalle, "JUGAR AHORA" navega a `/jugar/[id]`; "VOLVER AL VAULT" navega a `/`.
- [ ] `/jugar/[id]` muestra el HUD (jugador, puntuación, vidas, nivel) y la puntuación sube sola cada ~220ms mientras no está en pausa ni terminado.
- [ ] Pulsar "PAUSA" detiene el incremento de puntuación y muestra "EN PAUSA" sobre la pantalla CRT; "REANUDAR" lo retoma.
- [ ] Pulsar "FIN" abre el modal de fin de juego con la puntuación final.
- [ ] En el modal, "GUARDAR PUNTUACIÓN" persiste `{ game, score, name, at }` en `localStorage` bajo `av_scores` y muestra el mensaje de confirmación.
- [ ] "JUGAR DE NUEVO" reinicia score/vidas/nivel a sus valores iniciales sin salir de la pantalla.
- [ ] `/login` permite alternar entre "INICIAR SESIÓN" y "CREAR CUENTA"; el campo de correo solo aparece en la tab de crear cuenta.
- [ ] Enviar el formulario de login/registro o pulsar "JUGAR COMO INVITADO" setea el usuario en el contexto, lo persiste en `localStorage` (`av_user`) y redirige a `/`.
- [ ] Con un usuario logueado, el Nav muestra su nombre en vez de "Iniciar Sesión"; pulsarlo cierra sesión y borra `av_user`.
- [ ] `/salon-de-la-fama` muestra tabs con los 8 juegos; cambiar de tab cambia el podio (top 3) y la tabla completa.
- [ ] Con un usuario logueado, la tabla del salón de la fama muestra una fila adicional "TU MEJOR MARCA EN {juego}"; sin usuario, esa fila no aparece.
- [ ] El Nav resalta "Biblioteca" como activo también en `/juego/[id]` y `/jugar/[id]`, y resalta "Salón de la Fama" solo en esa ruta.
- [ ] En viewport móvil (<840px), el menú de links se oculta y el botón de hamburguesa abre el panel lateral con los mismos links.
- [ ] No hay errores ni warnings en la consola del navegador al recorrer las 5 pantallas.

## Decisions

- **Sí:** rutas reales de App Router (`/`, `/juego/[id]`, `/jugar/[id]`, `/salon-de-la-fama`, `/login`) en vez del hash-routing del template. Es el patrón idiomático de Next.js 16 y habilita navegación real, back/forward y SSR donde aplique.
- **No:** replicar el hash-routing SPA (`#/biblioteca`, etc.) del template original. Iría contra las convenciones de App Router sin aportar nada al MVP.
- **Sí:** mock de autenticación con estado en `localStorage` (`av_user`, `av_scores`), expuesto vía contexto de React. Replica el comportamiento del template (Nav reactivo, guardado de puntuaciones) sin backend real.
- **No:** pantallas estáticas sin estado para login/reproductor. Se sentirían desconectadas del resto de la app y no demostrarían el flujo completo.
- **Sí:** mantener la simulación de puntaje con temporizador falso y los modales de pausa/fin en el reproductor. Es la única forma de que el HUD se vea "vivo" sin implementar un juego real.
- **No:** reproductor en un estado estático fijo. Perdería el propósito de mostrar el HUD funcionando.
- **Sí:** portar `styles.css` del template a `app/globals.css` casi tal cual (ya realizado antes de este spec, junto con las fuentes en `layout.tsx`). Evita rehacer un diseño ya validado por el usuario.
- **No:** rediseñar con el Front-End Design Skill. El mockup ya provee una dirección visual completa y aprobada.
- **Sí:** rutas y slugs en español, consistente con el resto del contenido de la app.
- **Sí:** datos mock (`GAMES`, `CATS`, `PLAYERS`, `seededScores`) migrados a TypeScript tipado en `lib/games.ts`, reutilizable por Server y Client Components.
- **Sí:** cada pantalla se separa en `page.tsx` (Server Component) + un componente cliente interno (ej. `library-view.tsx`) para la interactividad. Más idiomático en App Router que marcar toda la página como `"use client"`.
- **No:** un único reproductor genérico para todos los `id` de juego, sin lógica específica por juego — implementar juegos reales queda explícitamente fuera de este spec.

## Risks

| Risk | Mitigation |
| --- | --- |
| Hydration mismatch al leer `localStorage` en el contexto de usuario: el Server Component no conoce ese estado en el render inicial. | El contexto arranca en `null`/vacío en el primer render y sincroniza con `localStorage` dentro de un `useEffect` tras montar, aceptando un parpadeo mínimo del Nav en la carga inicial. |
| En Next.js 16, `params` en rutas dinámicas (`/juego/[id]`, `/jugar/[id]`) es async-only. | Los `page.tsx` de esas rutas hacen `await params` antes de leer el `id`, siguiendo `node_modules/next/dist/docs/01-app/` como indica `AGENTS.md`. |
| `localStorage` deshabilitado (modo privado/incógnito). | La app sigue funcionando en memoria durante la sesión; simplemente no persiste tras recargar. No se agrega fallback adicional en este spec. |

## What is **not** in this spec

- Lógica de juego real para ninguno de los 8 juegos.
- Backend, autenticación real o base de datos.
- Persistencia más allá de `localStorage`.
- Modo versus / multijugador real (Duelo Pixel).
- Audio y efectos de sonido.
- Validación de puntuaciones o anti-cheat.
- Internacionalización.
- Arte real de portadas.
- Sistema real de créditos/monedas.

Cada uno de estos, si se implementa, va en su propio spec.
