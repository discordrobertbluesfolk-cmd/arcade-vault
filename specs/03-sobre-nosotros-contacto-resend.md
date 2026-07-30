# SPEC 03 — Sobre Nosotros (About) y envío de correo de contacto con Resend

> **Status:** Aprobado
> **Depends on:** 02-home-y-reordenamiento-de-rutas
> **Date:** 2026-07-28
> **Objective:** Implementar la ruta `/sobre-nosotros` (about.jsx del template) con su formulario de contacto conectado a un envío real de correo vía Resend, actualizando el link "Acerca de" del Nav (hoy apunta a `/acerca-de`) hacia la nueva ruta.

## Scope

**In:**

- Nueva ruta `/sobre-nosotros`: `app/sobre-nosotros/page.tsx` (server) + `components/about-view.tsx` (client), siguiendo el mismo patrón page/view de las specs 01 y 02.
- Migración a `app/globals.css` del CSS de `about.jsx` presente en `references/templates/styles.css`: `.about-*`, `.highlight-row`/`.highlight`/`.hl-icon`, `.about-divider`/`.div-*`, `.contact-*`, `.terminal-success`/`.term-*`.
- Port del JSX de `about.jsx`: hero (kicker, título, misión), fila de 3 highlights con iconos SVG pixelados (HEART/BROWSER/PLANT vía `HighlightIcon`), banner divisor animado, sección de contacto (intro + tips + formulario).
- Animación scroll-reveal (`.reveal` + `IntersectionObserver`), igual patrón que ya existe en `home-view.tsx` (spec 02).
- Formulario de contacto (nombre, email, mensaje) con la validación client-side ya presente en el template (campos no vacíos, efecto "shake" si falla) — se conserva tal cual.
- Server Action (`app/sobre-nosotros/actions.ts`, `"use server"`) que:
  - Revalida server-side: nombre/mensaje no vacíos (trim) y email con formato válido (regex simple).
  - Envía el correo vía SDK de Resend: destino y remitente desde variables de entorno, `reply-to` = email del visitante, asunto y cuerpo incluyendo nombre/email/mensaje.
  - Devuelve un resultado tipado de éxito o error con mensaje legible.
- Estados de UI del formulario: idle → cargando (botón "ENVIANDO…" deshabilitado) → éxito (reemplaza el formulario por un mensaje simple, reutilizando el estilo `terminal-success` pero sin las líneas animadas) o error (mensaje inline en el formulario, datos conservados para reintentar).
- Instalación de la dependencia `resend` (npm).
- Variables de entorno: `RESEND_API_KEY`, `CONTACT_EMAIL_TO` (default `discordrobertbluesfolk@gmail.com`), `CONTACT_EMAIL_FROM` (default `Arcade Vault <onboarding@resend.dev>`). Se crea `.env.example` documentando las 3 (sin valores reales); `.env.local` no se commitea (ya cubierto por `.env*` en `.gitignore`).
- Actualizar `components/nav.tsx`: los 3 usos de `/acerca-de` (link desktop, link móvil, `isAboutActive`) pasan a `/sobre-nosotros`.

**Out of scope (para specs futuros):**

- Protección anti-spam (honeypot, CAPTCHA, rate limiting) — descartado explícitamente por el usuario para este spec.
- Dominio propio verificado en Resend — se usa `onboarding@resend.dev` hasta que el usuario configure uno.
- Persistencia de los mensajes de contacto (no hay DB ni `localStorage`; solo se envía el correo).
- Correo de confirmación/autoresponder al remitente — solo se notifica al destino configurado.
- Widgets de gamepad/arcade-cabinet (`.gp-*`, `.dp-*`, `.ab-*`) de `styles.css` — no los usa `about.jsx`, quedan fuera.
- Internacionalización.
- Cambios a otras rutas o componentes fuera de `nav.tsx` y los archivos nuevos de esta ruta.

## Data model

Este spec no introduce estructuras de datos persistentes (no hay DB ni `localStorage` nuevos). Sí introduce un tipo de estado para la Server Action y variables de entorno de configuración.

```ts
// app/sobre-nosotros/actions.ts
"use server";

export type ContactActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function sendContactMessage(
  prevState: ContactActionState,
  formData: FormData
): Promise<ContactActionState>;
```

- `components/about-view.tsx` consume esta acción vía `useActionState(sendContactMessage, { status: "idle" })`, siguiendo el patrón oficial de Server Actions + `useActionState` documentado en `node_modules/next/dist/docs/01-app/02-guides/forms.md`.
- Los inputs del formulario mantienen `name="name"`, `name="email"`, `name="msg"` para que `FormData` los recoja nativamente, conservando el estado controlado existente (para la validación client-side y el efecto "shake").

**Variables de entorno** (`.env.local`, no commiteado; `.env.example` documenta las claves sin valores):

| Variable | Uso | Default sugerido |
| --- | --- | --- |
| `RESEND_API_KEY` | API key de Resend | (sin default, obligatoria) |
| `CONTACT_EMAIL_TO` | Destino del correo de contacto | `discordrobertbluesfolk@gmail.com` |
| `CONTACT_EMAIL_FROM` | Remitente usado por Resend | `Arcade Vault <onboarding@resend.dev>` |

## Implementation plan

1. Instalar la dependencia `resend` (`npm install resend`) y crear `.env.example` documentando `RESEND_API_KEY`, `CONTACT_EMAIL_TO` y `CONTACT_EMAIL_FROM` (sin valores reales, con los defaults sugeridos como comentario). Prueba: `npm run build` sigue compilando sin errores.
2. Migrar a `app/globals.css` las clases CSS de `about.jsx` desde `references/templates/styles.css`: `.about-*`, `.highlight-row`/`.highlight`/`.hl-icon`, `.about-divider`/`.div-*`, `.contact-*`, `.terminal-success`/`.term-*`. Prueba: build compila sin errores; sin cambio visual todavía (clases sin usar aún).
3. Crear `app/sobre-nosotros/actions.ts` (`"use server"`) con `sendContactMessage`: valida server-side (nombre/mensaje no vacíos tras `trim`, email con regex simple), llama al SDK de `resend` usando `RESEND_API_KEY`, enviando a `CONTACT_EMAIL_TO` desde `CONTACT_EMAIL_FROM` con `reply_to` = email del formulario, asunto "Nuevo mensaje de contacto — Arcade Vault" y cuerpo con nombre/email/mensaje; devuelve `{ status: "success" }` o `{ status: "error", message }`. Prueba: el archivo compila y tipa correctamente (aún no conectado a la UI).
4. Crear `components/about-view.tsx` (client) portando el JSX de `about.jsx`: hero, `highlight-row` con `HighlightIcon`, divider animado, sección de contacto usando `useActionState(sendContactMessage, { status: "idle" })`. Se reemplaza el estado local `sent` y la animación de terminal falsa por los estados reales (idle/pendiente/éxito/error): botón "ENVIANDO…" deshabilitado mientras `pending`, mensaje de éxito simple (reutilizando el estilo `terminal-success` sin líneas animadas) si `status === "success"`, mensaje de error inline con los datos conservados si `status === "error"`. Se conserva la validación client-side + `shake` para campos vacíos antes de permitir el submit nativo. Prueba: el componente compila sin errores.
5. Crear `app/sobre-nosotros/page.tsx` (server) que renderiza `AboutView`. Prueba: `/sobre-nosotros` muestra la pantalla completa (hero, highlights, divider, formulario) con la animación scroll-reveal funcionando.
6. Actualizar `components/nav.tsx`: los 3 usos de `/acerca-de` (link desktop, link móvil, `isAboutActive`) pasan a `/sobre-nosotros`. Prueba: el link "Acerca de" del Nav (escritorio y móvil) navega a `/sobre-nosotros` y se resalta como activo ahí.
7. Configurar `.env.local` con una `RESEND_API_KEY` real (provista por el usuario, fuera del repo) y probar el envío real desde `/sobre-nosotros`: caso éxito (llega el correo a `CONTACT_EMAIL_TO`), caso campo vacío (shake, no se llama a Resend), caso error (ej. API key inválida temporalmente) mostrando el mensaje de error sin perder los datos escritos. Prueba: recorrido manual de los 3 casos sin errores de consola.

## Acceptance criteria

- [ ] `/sobre-nosotros` muestra: hero con kicker/título/misión, fila de 3 highlights (HEART/BROWSER/PLANT) con sus iconos SVG, banner divisor animado, y sección de contacto (intro + tips + formulario).
- [ ] Las secciones marcadas con `.reveal` en `/sobre-nosotros` aparecen con la animación al hacer scroll.
- [ ] Enviar el formulario con algún campo vacío (nombre, email o mensaje) dispara el efecto "shake" y no llama a la Server Action ni a Resend.
- [ ] Enviar el formulario con todos los campos válidos deshabilita el botón y muestra "ENVIANDO…" mientras la Server Action está en curso.
- [ ] Un envío exitoso reemplaza el formulario por un mensaje de éxito (estilo `terminal-success`, sin animación de líneas) y el correo llega efectivamente a la dirección configurada en `CONTACT_EMAIL_TO`.
- [ ] El correo recibido tiene como `reply-to` el email ingresado en el formulario, y el cuerpo incluye nombre, email y mensaje.
- [ ] Si Resend falla (ej. `RESEND_API_KEY` inválida), se muestra un mensaje de error en el formulario y los datos ingresados se conservan (no se limpian los campos).
- [ ] La Server Action revalida server-side los campos (no vacíos + formato de email) independientemente de la validación client-side.
- [ ] El link "Acerca de" del Nav (escritorio y panel móvil) navega a `/sobre-nosotros` y aparece resaltado como activo ahí.
- [ ] `.env.example` documenta `RESEND_API_KEY`, `CONTACT_EMAIL_TO` y `CONTACT_EMAIL_FROM` sin valores reales; `.env.local` no está trackeado por git.
- [ ] No hay errores ni warnings en la consola del navegador al recorrer `/sobre-nosotros` y enviar el formulario (casos éxito y error).

## Decisions

- **Sí:** la ruta es `/sobre-nosotros`, no `/acerca-de` (spec 02 había dejado el link del Nav apuntando a `/acerca-de` con 404 esperado). Decisión explícita del usuario al iniciar este spec; el Nav se actualiza en el paso 6 del plan.
- **Sí:** Server Action real con `useActionState`, eliminando la animación de terminal falsa (líneas `[OK]` hardcodeadas) del template. Decisión explícita del usuario: prioriza envío real y estados honestos sobre fidelidad visual literal al mockup.
- **No:** conservar la simulación de terminal con líneas fijas. Se descarta porque ahora el envío es real y esas líneas simulaban pasos (conexión, validación, transmisión) que no ocurren de verdad.
- **Sí:** reutilizar el estilo visual `terminal-success` para el mensaje final de éxito (sin las líneas animadas), manteniendo la estética "terminal" del template con comportamiento simplificado.
- **Sí:** remitente `onboarding@resend.dev` (sandbox de Resend), ya que el usuario aún no tiene dominio propio verificado. Documentado como limitación temporal, resoluble cambiando `CONTACT_EMAIL_FROM` cuando haya dominio.
- **Sí:** destino configurable vía `CONTACT_EMAIL_TO` (default `discordrobertbluesfolk@gmail.com`) en vez de hardcodear el email en el código.
- **Sí:** validación server-side en la Server Action (nombre/mensaje no vacíos, email con regex) además de la ya existente en el cliente, para no depender solo de JS en el navegador.
- **No:** protección anti-spam (honeypot, CAPTCHA, rate limiting) en este spec. Decisión explícita del usuario; se evalúa en un spec futuro si se vuelve un problema real.
- **Sí:** en caso de error de envío, conservar los datos del formulario para permitir reintentar sin volver a escribirlos. Decisión explícita del usuario.
- **No:** persistir los mensajes de contacto en DB o `localStorage`. Solo se envía el correo; Resend/el email ya actúa como registro, duplicarlo no aporta valor en este MVP.
- **Sí:** usar el SDK oficial `resend` (paquete npm) en vez de llamar a la API HTTP manualmente con `fetch`. Es el approach recomendado por Resend, más simple de tipar y mantener.
- **Sí:** se mantiene el patrón `page.tsx` (Server) + `*-view.tsx` (Client) establecido en specs 01 y 02, con `components/about-view.tsx`.
- **No:** migrar en este spec los widgets `.gp-*`/`.dp-*`/`.ab-*` de `styles.css` (gamepad/arcade-cabinet). No los usa `about.jsx`; pertenecen a otra pantalla no incluida aquí.

## Risks

| Risk | Mitigation |
| --- | --- |
| El remitente `onboarding@resend.dev` (sandbox de Resend) puede tener restricciones de la cuenta gratuita (ej. límite de envíos, marcado como spam por algunos proveedores de correo). | Aceptado como limitación temporal explícita del usuario; se resuelve migrando a un dominio propio verificado en un spec futuro, solo cambiando `CONTACT_EMAIL_FROM`. |
| Sin protección anti-spam, el formulario público puede recibir envíos automatizados de bots, generando correos no deseados a `CONTACT_EMAIL_TO`. | Riesgo aceptado explícitamente por el usuario para este spec; si se vuelve un problema real, se aborda en un spec futuro (honeypot/CAPTCHA/rate limiting). |
| Si `RESEND_API_KEY` no está configurada (o es inválida) en el entorno de despliegue, todos los envíos fallarán silenciosamente para el usuario final más allá del mensaje de error genérico. | El paso 7 del plan incluye probar explícitamente el caso de error (API key inválida) antes de dar el spec por verificado; se documenta en `.env.example` que la variable es obligatoria. |
| Cambiar `name`/`email`/`msg` de inputs controlados sin `name` a inputs controlados **con** `name` (necesario para que `FormData` los capture) podría introducir un bug sutil si el valor controlado y el atributo `name` se desincronizan. | El paso 4 del plan implementa y prueba explícitamente que los 3 campos viajan correctamente en el `FormData` recibido por la Server Action antes de dar el paso por terminado. |
