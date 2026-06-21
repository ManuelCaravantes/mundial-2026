// Reemplaza RAPIDAPI_KEY con tu clave de https://rapidapi.com/api-sports/api/api-football
export const CONFIG = {
  RAPIDAPI_KEY: 'YOUR_RAPIDAPI_KEY_HERE',
  RAPIDAPI_HOST: 'api-football-v1.p.rapidapi.com',
  WORLD_CUP_LEAGUE_ID: 1,
  WORLD_CUP_SEASON: 2026,
  LIVE_POLL_INTERVAL_MS: 60_000, // 60s — ajusta según tu plan de API
} as const;
