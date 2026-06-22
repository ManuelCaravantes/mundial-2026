import axios from 'axios';
import { CONFIG } from '../config';
import type { FDMatch, FDMatchesResponse, GroupStanding, StandingsResponse } from '../types/api';

const client = axios.create({
  baseURL: 'https://api.football-data.org/v4',
  headers: {
    'X-Auth-Token': CONFIG.API_TOKEN,
  },
  timeout: 10_000,
});

export async function fetchAllMatches(): Promise<FDMatch[]> {
  const { data } = await client.get<FDMatchesResponse>('/competitions/WC/matches', {
    params: { season: CONFIG.WORLD_CUP_SEASON },
  });
  return data.matches ?? [];
}

export async function fetchLiveMatches(): Promise<FDMatch[]> {
  const { data } = await client.get<FDMatchesResponse>('/competitions/WC/matches', {
    params: { season: CONFIG.WORLD_CUP_SEASON, status: 'IN_PLAY,PAUSED,EXTRA_TIME,PENALTY_SHOOTOUT' },
  });
  return data.matches ?? [];
}

export function isLive(status: string): boolean {
  return ['IN_PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT'].includes(status);
}

export function isFinished(status: string): boolean {
  return ['FINISHED', 'AWARDED'].includes(status);
}

export async function fetchStandings(): Promise<GroupStanding[]> {
  const { data } = await client.get<StandingsResponse>('/competitions/WC/standings', {
    params: { season: CONFIG.WORLD_CUP_SEASON },
  });
  return (data.standings ?? []).filter((s) => s.type === 'TOTAL');
}

export const KNOCKOUT_STAGES = [
  { key: 'LAST_16', label: '16avos' },
  { key: 'QUARTER_FINALS', label: 'Cuartos' },
  { key: 'SEMI_FINALS', label: 'Semis' },
  { key: 'THIRD_PLACE', label: '3er Lugar' },
  { key: 'FINAL', label: 'Final' },
] as const;

export function getRoundLabel(stage: string, group: string | null): string {
  const base: Record<string, string> = {
    GROUP_STAGE: 'Fase de Grupos',
    LAST_16: 'Octavos de Final',
    QUARTER_FINALS: 'Cuartos de Final',
    SEMI_FINALS: 'Semifinales',
    THIRD_PLACE: 'Tercer Lugar',
    FINAL: 'Final',
  };
  const label = base[stage] ?? stage;
  if (stage === 'GROUP_STAGE' && group) {
    return `${label} · ${group.replace('GROUP_', 'Grupo ')}`;
  }
  return label;
}
