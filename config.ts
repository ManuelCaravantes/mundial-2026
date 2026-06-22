export const CONFIG = {
  API_TOKEN: process.env.EXPO_PUBLIC_API_TOKEN ?? '',
  WORLD_CUP_SEASON: 2026,
  LIVE_POLL_INTERVAL_MS: 60_000,
} as const;
