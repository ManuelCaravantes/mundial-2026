import axios from 'axios';
import { CONFIG } from '../config';
import type { FDMatch, FDMatchesResponse, GroupStanding, StandingEntry } from '../types/api';

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

// Calcula la tabla de cada grupo a partir de los partidos (no requiere endpoint extra)
export function calculateGroupStandings(matches: FDMatch[]): GroupStanding[] {
  const groupMatches = matches.filter((m) => m.stage === 'GROUP_STAGE' && m.group);

  type TeamStats = {
    playedGames: number; won: number; draw: number; lost: number;
    points: number; goalsFor: number; goalsAgainst: number;
  };

  const groups: Record<string, Record<number, { team: FDMatch['homeTeam']; stats: TeamStats }>> = {};

  for (const match of groupMatches) {
    const g = match.group!;
    if (!groups[g]) groups[g] = {};

    const init = (team: FDMatch['homeTeam']) => {
      if (!groups[g][team.id]) {
        groups[g][team.id] = {
          team,
          stats: { playedGames: 0, won: 0, draw: 0, lost: 0, points: 0, goalsFor: 0, goalsAgainst: 0 },
        };
      }
    };

    init(match.homeTeam);
    init(match.awayTeam);

    if (!isFinished(match.status)) continue;

    const hg = match.score.fullTime.home ?? 0;
    const ag = match.score.fullTime.away ?? 0;
    const home = groups[g][match.homeTeam.id].stats;
    const away = groups[g][match.awayTeam.id].stats;

    home.playedGames++; away.playedGames++;
    home.goalsFor += hg; home.goalsAgainst += ag;
    away.goalsFor += ag; away.goalsAgainst += hg;

    if (match.score.winner === 'HOME_TEAM') {
      home.won++; home.points += 3; away.lost++;
    } else if (match.score.winner === 'AWAY_TEAM') {
      away.won++; away.points += 3; home.lost++;
    } else {
      home.draw++; away.draw++; home.points += 1; away.points += 1;
    }
  }

  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([groupName, teamMap]) => {
      const table: StandingEntry[] = Object.values(teamMap)
        .sort((a, b) => {
          const s = (x: TeamStats) => ({ pts: x.points, gd: x.goalsFor - x.goalsAgainst, gf: x.goalsFor });
          const sa = s(a.stats); const sb = s(b.stats);
          if (sb.pts !== sa.pts) return sb.pts - sa.pts;
          if (sb.gd !== sa.gd) return sb.gd - sa.gd;
          if (sb.gf !== sa.gf) return sb.gf - sa.gf;
          return a.team.name.localeCompare(b.team.name);
        })
        .map((entry, idx) => ({
          position: idx + 1,
          team: entry.team,
          playedGames: entry.stats.playedGames,
          won: entry.stats.won,
          draw: entry.stats.draw,
          lost: entry.stats.lost,
          points: entry.stats.points,
          goalsFor: entry.stats.goalsFor,
          goalsAgainst: entry.stats.goalsAgainst,
          goalDifference: entry.stats.goalsFor - entry.stats.goalsAgainst,
          form: null,
        }));

      return { stage: 'GROUP_STAGE', type: 'TOTAL', group: groupName, table };
    });
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
