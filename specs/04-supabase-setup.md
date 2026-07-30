# SPEC 04 — Conexión con Supabase

> **Status:** Aprobado
> **Depends on:** Ninguno (spec de infraestructura, no depende funcionalmente de specs anteriores)
> **Date:** 2026-07-29
> **Objective:** Configurar los clientes de Supabase (browser y servidor) en el proyecto Next.js usando `@supabase/supabase-js` y `@supabase/ssr`, con las credenciales vía variables de entorno, dejando fuera de este spec cualquier funcionalidad de autenticación, storage o edge functions.

## Scope

**In:**

- Instalar las dependencias `@supabase/supabase-js` y `@supabase/ssr` (`npm install`).
- Crear `lib/supabase/client.ts`: cliente de Supabase para Client Components, vía `createBrowserClient` de `@supabase/ssr`.
- Crear `lib/supabase/server.ts`: cliente de Supabase para Server Components/Actions, vía `createServerClient` de `@supabase/ssr`, usando `cookies()` de `next/headers` (async, requerido en Next 16).
- Corregir el typo en `.env.example`: `SUPBASE_DB_PASSWORD` → `SUPABASE_DB_PASSWORD`.
- Documentar en `.env.example` las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (sin valores reales). El nombre exacto de la clave pública se confirma contra la guía oficial de Supabase para Next.js (vía `mcp__supabase__search_docs`) al implementar, dado el rebranding reciente de "anon key" a "publishable key" — si el nombre oficial actual difiere, se usa ese.
- Verificar que el proyecto Supabase (`syzuwkgxmtxdhbdpdpup`, ya conectado en `.mcp.json`) responde, usando las herramientas MCP (`list_tables` / `execute_sql`) durante la implementación. Esta verificación no deja código ni rutas en el repo.

**Out of scope (para specs futuros):**

- Cualquier funcionalidad de autenticación (login/registro real, OAuth, invitado/anónimo) — `auth-view.tsx` y `user-context.tsx` no se tocan en este spec.
- Persistencia real de puntajes o del Salón de la Fama — siguen usando `localStorage` y `seededScores` tal como hoy.
- Supabase Storage.
- Supabase Edge Functions.
- `proxy.ts` / middleware de refresco de sesión — no aplica sin auth todavía.
- Migraciones o tablas nuevas en la base de datos — no hay modelo de datos de la app aún.
- La clave `service_role`/secret — se agrega solo cuando exista una operación admin real que la necesite.
- Cualquier ruta o componente visible en la app (ej. `/api/health`) para probar la conexión desde el navegador — decisión explícita de verificar solo vía MCP en esta sesión.

## Data model

Este spec no introduce estructuras de datos persistentes en la aplicación (no hay tablas, migraciones ni tipos de dominio nuevos). Introduce dos módulos de cliente de Supabase y sus variables de entorno de configuración.

```ts
// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```ts
// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll() {} } }
  );
}
```

Las firmas exactas (en particular el manejo de `setAll` para cookies) se ajustan durante la implementación contra la guía oficial de Supabase para Next.js App Router (`mcp__supabase__search_docs`), ya que `cookies()` en Next 16 es async-only y el snippet de arriba es ilustrativo, no literal.

**Variables de entorno** (`.env.local`, no commiteado; `.env.example` documenta las claves sin valores):

| Variable                        | Uso                                                                                           | Dónde se define                                                                    |
| ------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL del proyecto Supabase                                                                     | `.env.local` (el usuario la pega manualmente)                                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (anon/publishable) usada por ambos clientes                                     | `.env.local` (el usuario la pega manualmente)                                      |
| `SUPABASE_DB_PASSWORD`          | Password de la base de datos, ya existente, para uso futuro (ej. conexión directa a Postgres) | `.env.local` (ya existe; en este spec solo se corrige el nombre en `.env.example`) |

## Implementation plan

1. Instalar las dependencias `@supabase/supabase-js` y `@supabase/ssr` (`npm install @supabase/supabase-js @supabase/ssr`). Prueba: `npm run build` sigue compilando sin errores.
2. Corregir `.env.example`: renombrar `SUPBASE_DB_PASSWORD` → `SUPABASE_DB_PASSWORD`, y agregar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (sin valores reales, con comentario de dónde obtenerlas en el dashboard de Supabase). Prueba: `.env.example` documenta las 3 variables correctamente nombradas.
3. Crear `lib/supabase/client.ts` con una función `createClient()` que use `createBrowserClient` de `@supabase/ssr`. Prueba: el archivo compila y tipa correctamente (aún no se usa en ningún componente).
4. Crear `lib/supabase/server.ts` con una función `createClient()` async que use `createServerClient` de `@supabase/ssr` junto con `cookies()` de `next/headers`. Prueba: el archivo compila y tipa correctamente (aún no se usa en ninguna Server Action/Component).
5. Pegar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` reales en `.env.local` (tarea del usuario, fuera del repo). Prueba: `npm run build` sigue compilando sin errores.
6. Verificar la conectividad al proyecto Supabase (`syzuwkgxmtxdhbdpdpup`) ejecutando `mcp__supabase__list_tables` y/o `mcp__supabase__execute_sql` (ej. `select now()`) durante la implementación. Prueba: la consulta MCP responde sin error, confirmando que el proyecto está accesible.

## Acceptance criteria

- [ ] `@supabase/supabase-js` y `@supabase/ssr` están instalados como dependencias en `package.json`.
- [ ] `.env.example` ya no contiene el typo `SUPBASE_DB_PASSWORD`; en su lugar dice `SUPABASE_DB_PASSWORD`.
- [ ] `.env.example` documenta `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_DB_PASSWORD`, sin valores reales.
- [ ] `lib/supabase/client.ts` existe y exporta una función que crea un cliente de Supabase para browser vía `createBrowserClient`.
- [ ] `lib/supabase/server.ts` existe y exporta una función async que crea un cliente de Supabase para servidor vía `createServerClient`, usando `cookies()` de `next/headers`.
- [ ] `npm run build` compila sin errores tras agregar ambos archivos.
- [ ] Ninguna ruta, página, componente o Server Action de la app importa o usa `lib/supabase/client.ts` ni `lib/supabase/server.ts` todavía (queda para el spec de auth).
- [ ] `auth-view.tsx` y `user-context.tsx` no tienen cambios.
- [ ] Una consulta vía MCP (`list_tables` o `execute_sql`) al proyecto `syzuwkgxmtxdhbdpdpup` responde exitosamente durante la implementación.

## Decisions

- **Sí:** usar el patrón oficial `@supabase/ssr` (cliente de browser + cliente de servidor) en vez de un único cliente `supabase-js` simple, para que la base ya esté lista cuando se implemente auth. Decisión explícita del usuario, dado que planea usar auth/storage/edge functions a futuro.
- **Sí:** el usuario pega las credenciales manualmente en `.env.local` en vez de que se obtengan vía MCP. Decisión explícita del usuario.
- **No:** crear una ruta o página de prueba (ej. `/api/health`) para verificar la conexión desde el navegador. Se verifica solo vía MCP durante esta sesión — implica que el código nuevo no queda ejercitado por la app hasta el spec de auth (ver Riesgos).
- **No:** incluir auth (login/registro/OAuth/invitado anónimo) en este spec. Decisión explícita del usuario; se implementará en un spec futuro.
- **No:** incluir Storage ni Edge Functions en este spec, aunque el usuario planea usarlos a futuro. Se descartan para mantener este spec enfocado solo en la conexión base.
- **No:** agregar `proxy.ts` / middleware de refresco de sesión. No hay sesión de usuario que refrescar sin auth; se agrega junto con el spec de auth.
- **No:** agregar la clave `service_role`/secret todavía. No hay ninguna operación admin que la necesite en este spec; se agrega cuando exista una.
- **Sí:** corregir el typo `SUPBASE_DB_PASSWORD` → `SUPABASE_DB_PASSWORD` en `.env.example`. Decisión explícita del usuario, alinea con el nombre ya correcto en `.env` real.
- **Sí:** el nombre exacto de la clave pública (`NEXT_PUBLIC_SUPABASE_ANON_KEY` vs. una posible variante "publishable key") se confirma contra la documentación oficial de Supabase para Next.js al momento de implementar, dado el rebranding reciente de Supabase de "anon key" a "publishable key". Evita fijar en el spec un nombre que podría estar desactualizado.

## Risks

| Risk                                                                                                                                                                                                                                                                              | Mitigation                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/supabase/client.ts` y `lib/supabase/server.ts` no son importados por ninguna ruta o componente en este spec, por lo que un error de tipado o de patrón incorrecto podría no manifestarse hasta el spec de auth.                                                              | Los pasos 3-4 exigen que ambos archivos compilen (`npm run build`) y sigan el patrón oficial confirmado contra la documentación de Supabase; el spec de auth será la primera prueba end-to-end real. |
| El nombre de la clave pública puede diferir del asumido (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) si Supabase completó su rebranding a "publishable key" con un nombre de variable distinto.                                                                                              | Se confirma contra `mcp__supabase__search_docs` al implementar (ver Decisiones); si difiere, se usa el nombre oficial vigente.                                                                       |
| La verificación del paso 6 usa las herramientas MCP directamente contra el proyecto Supabase, no el código de la app — puede pasar aunque el usuario nunca pegue las credenciales reales en `.env.local`, dando una falsa sensación de que "la conexión de la app" quedó probada. | Documentado explícitamente en Acceptance criteria: este spec verifica que el proyecto Supabase responde, no que el cliente de la app funcione end-to-end; eso se prueba en el spec de auth.          |
