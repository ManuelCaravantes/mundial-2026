export type MatchStatus =
  | 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED'
  | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT' | 'FINISHED'
  | 'SUSPENDED' | 'CANCELLED' | 'POSTPONED' | 'AWARDED';

export type MatchWinner = 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
export type MatchDuration = 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT';
export type MatchStage =
  | 'GROUP_STAGE' | 'LAST_32' | 'LAST_16' | 'QUARTER_FINALS'
  | 'SEMI_FINALS' | 'THIRD_PLACE' | 'FINAL';

export interface FDTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export interface FDScore {
  winner: MatchWinner;
  duration: MatchDuration;
  fullTime: { home: number | null; away: number | null };
  halfTime: { home: number | null; away: number | null };
}

export interface FDMatch {
  id: number;
  utcDate: string;
  status: MatchStatus;
  matchday: number | null;
  stage: MatchStage;
  group: string | null;
  lastUpdated: string;
  homeTeam: FDTeam;
  awayTeam: FDTeam;
  score: FDScore;
}

export interface FDMatchesResponse {
  count: number;
  matches: FDMatch[];
}

export interface FDPlayer {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  section: string;
  position: string | null;
  shirtNumber: number | null;
}

export interface Scorer {
  player: FDPlayer;
  team: FDTeam;
  playedMatches: number;
  goals: number;
  assists: number;
  penalties: number | null;
}

export interface ScorersResponse {
  count: number;
  scorers: Scorer[];
}

export interface TeamStat {
  team: FDTeam;
  gamesPlayed: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  wins: number;
}

export interface StandingEntry {
  position: number;
  team: FDTeam;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form: string | null;
}

export interface GroupStanding {
  stage: string;
  type: string;
  group: string | null;
  table: StandingEntry[];
}

export interface StandingsResponse {
  standings: GroupStanding[];
}
