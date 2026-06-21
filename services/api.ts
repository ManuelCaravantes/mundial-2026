import axios from 'axios';
import { CONFIG } from '../config';
import type { Fixture, FixtureEvent } from '../types/api';

const client = axios.create({
  baseURL: 'https://api-football-v1.p.rapidapi.com/v3',
  headers: {
    'x-rapidapi-host': CONFIG.RAPIDAPI_HOST,
    'x-rapidapi-key': CONFIG.RAPIDAPI_KEY,
  },
  timeout: 10_000,
});

export async function fetchAllFixtures(): Promise<Fixture[]> {
  const { data } = await client.get('/fixtures', {
    params: {
      league: CONFIG.WORLD_CUP_LEAGUE_ID,
      season: CONFIG.WORLD_CUP_SEASON,
    },
  });
  return data.response ?? [];
}

export async function fetchLiveFixtures(): Promise<Fixture[]> {
  const { data } = await client.get('/fixtures', {
    params: {
      live: 'all',
      league: CONFIG.WORLD_CUP_LEAGUE_ID,
    },
  });
  return data.response ?? [];
}

export async function fetchFixtureEvents(fixtureId: number): Promise<FixtureEvent[]> {
  const { data } = await client.get('/fixtures/events', {
    params: { fixture: fixtureId },
  });
  return data.response ?? [];
}

export function isLive(short: string): boolean {
  return ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'].includes(short);
}

export function isFinished(short: string): boolean {
  return ['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(short);
}

export function isScheduled(short: string): boolean {
  return short === 'NS';
}
