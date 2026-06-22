# Mundial 2026 — Contexto del proyecto

## Expo docs
Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

---

## Descripción

App Android para seguir el Mundial 2026. Sin login. Solo lectura de datos del torneo.
Stack: **Expo SDK 56 / React Native 0.85.3 / React 19 / TypeScript**.

---

## API de datos

- **Proveedor:** football-data.org v4 (free tier — incluye WC de por vida)
- **Base URL:** `https://api.football-data.org/v4`
- **Auth header:** `X-Auth-Token: <token>`
- **Token:** en `.env` como `EXPO_PUBLIC_API_TOKEN` (gitignored). Configurado también en EAS Dashboard para development/preview/production.
- **Competición:** `WC` (código) / id `2000`
- **Temporada:** `2026` (config en `CONFIG.WORLD_CUP_SEASON`)
- **Rate limit free tier:** 10 calls/min → mitigado con React Query staleTime 5 min
- **Endpoints usados:**
  - `GET /competitions/WC/matches?season=2026` — todos los partidos
  - `GET /competitions/WC/matches?season=2026&status=IN_PLAY,PAUSED,...` — partidos en vivo
  - `GET /competitions/2000/scorers?season=2026&limit=50` — goleadores y asistencias
- **Endpoint NO usado:** `/competitions/WC/standings` devuelve tabla general, no por grupo. Las tablas de grupo se calculan client-side a partir de los partidos.

### WC 2026 particularidades
- 48 equipos, 12 grupos (A–L), 4 equipos por grupo
- Rondas eliminatorias: `LAST_32` (16 partidos) → `LAST_16` (8 partidos) → `QUARTER_FINALS` → `SEMI_FINALS` → `THIRD_PLACE` → `FINAL`
- El stage `LAST_32` existía en versiones anteriores como "16avos" — no omitirlo

---

## Estructura de archivos

```
config.ts                  — CONFIG: API_TOKEN, WORLD_CUP_SEASON, LIVE_POLL_INTERVAL_MS
types/api.ts               — Todas las interfaces TypeScript (FDMatch, Scorer, TeamStat, etc.)
services/api.ts            — Funciones fetch + cálculos client-side
services/notifications.ts  — Background task, canales Android, checkAndNotify
constants/theme.ts         — Colores y spacing (dark navy/gold)
constants/flags.ts         — getFlag(countryName) → emoji de bandera
components/
  MatchCard.tsx            — Tarjeta de partido (equipos, marcador/hora, live badge)
  LiveBadge.tsx            — Punto rojo animado + texto estado
  GroupTable.tsx           — Tabla de grupo (Pos/PJ/DG/Pts)
  BracketMatchCard.tsx     — Tarjeta compacta para bracket
screens/
  CalendarioScreen.tsx     — SectionList por fecha, filtros Todos/Hoy/Por jugar
  ResultadosScreen.tsx     — Partidos en vivo (poll 60s) + terminados agrupados
  GruposScreen.tsx         — 12 grupos con tabla calculada client-side
  BracketScreen.tsx        — Selector por ronda, grid 2 columnas (1 centrado en Final/3er)
  EstadisticasScreen.tsx   — 3 sub-tabs: Goleadores / Asistencias / Equipos, headers ordenables
navigation/TabNavigator.tsx — 5 tabs: Calendario / Resultados / Grupos / Bracket / Stats
App.tsx                    — QueryClient + NavigationContainer + setup notificaciones
app.json                   — package: com.mundial2026.app, projectId: 03be8885-...
eas.json                   — development(apk) / preview(apk,channel:preview) / production(aab,channel:production)
```

---

## Servicios clave (`services/api.ts`)

| Función | Descripción |
|---|---|
| `fetchAllMatches()` | Todos los partidos del torneo |
| `fetchLiveMatches()` | Partidos en vivo/pausa/prorroga/penales |
| `fetchScorers(limit)` | Goleadores (incluye assists) |
| `calculateGroupStandings(matches)` | Tabla por grupo desde partidos (sin endpoint extra) |
| `calculateTeamStats(matches)` | GF/GC/porterías a 0 por equipo desde partidos terminados |
| `isLive(status)` | IN_PLAY, PAUSED, EXTRA_TIME, PENALTY_SHOOTOUT |
| `isFinished(status)` | FINISHED, AWARDED |
| `getRoundLabel(stage, group)` | Texto legible de la ronda |
| `KNOCKOUT_STAGES` | Array ordenado de rondas eliminatorias con etiquetas en español |

---

## Pantalla de Estadísticas

3 sub-tabs con headers de columna **ordenables** (tap = orden DESC, re-tap = toggle ASC/DESC, flecha ↑/↓ en columna activa resaltada en dorado):

- **Goleadores:** columnas PJ / Goles (default DESC) / Asis
- **Asistencias:** columnas PJ / Asis (default DESC) / Goles
- **Equipos:** columnas GF (default DESC) / GC / 🔒 (porterías a 0)

---

## React Query

```typescript
// Queries reutilizadas entre pantallas (sin re-fetch innecesario)
['matches']       — staleTime: 5 min  — Calendario, Resultados, Grupos, Bracket, Stats
['matches-live']  — staleTime: 0      — Resultados (poll refetchInterval: 60s)
['scorers']       — staleTime: 5 min  — Estadísticas
```

---

## Notificaciones y background

- `services/notifications.ts` debe importarse en `App.tsx` al inicio (registra el task en el módulo top-level)
- Background task: `wc-live-check` (expo-task-manager) — intervalo mínimo 15 min
- Canales Android:
  - `wc-goals` — HIGH priority (goles, inicio de partido)
  - `wc-updates` — DEFAULT priority (OTA updates)
- `checkAndNotify(matches)`: compara goles vs AsyncStorage, dispara notificación local si hay cambio

---

## Tema visual (`constants/theme.ts`)

| Token | Valor | Uso |
|---|---|---|
| `background` | `#030A1C` | Fondo general |
| `card` | `#0D1B3E` | Tarjetas |
| `cardBorder` | `#1A2B50` | Bordes |
| `primary` | `#C9A84C` | Dorado — acento, columna activa, tabs activos |
| `live` | `#FF3B30` | Badge en vivo |
| `win` | `#30D158` | Verde — ganador, portería a 0, clasificados |
| `textPrimary` | `#FFFFFF` | Texto principal |
| `textSecondary` | `#7A8EAD` | Texto secundario, headers |

---

## EAS — build y deploy

```bash
# Build desarrollo (con dev client, APK)
eas build --profile development --platform android

# Build preview (APK distribuible internamente)
eas build --profile preview --platform android

# Build producción (AAB para Play Store)
eas build --profile production --platform android

# OTA update (solo cambios JS — no rebuild nativo)
eas update --channel preview --message "descripción"
eas update --channel production --message "descripción"
```

### OTA vs nueva build
- Cambios JS/TS/assets: solo `eas update` (segundos)
- Cambios nativos (app.json plugins, nuevas dependencias nativas, ícono, permisos): requiere nueva build

---

## Gotchas conocidos

- `eas-cli` debe instalarse **global** (`npm i -g eas-cli`), NO como dependencia del proyecto
- `expo-status-bar` SDK 56: el prop `backgroundColor` no es válido — usar `expo-system-ui` para el color del system bar
- `/competitions/WC/standings` devuelve tabla agregada, no por grupo — siempre calcular desde matches
- El stage `LAST_32` tiene 16 partidos (no confundir con 32); `LAST_16` tiene 8
- Expo Go no es compatible con SDK 56 en Play Store — usar development build con `expo-dev-client`
- Variables de entorno: solo `EXPO_PUBLIC_*` son accesibles en el bundle. El token va en `.env` y en EAS Dashboard
