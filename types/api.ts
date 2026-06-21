export type FixtureStatusShort =
  | 'NS' | '1H' | 'HT' | '2H' | 'ET' | 'BT' | 'P'
  | 'FT' | 'AET' | 'PEN' | 'SUSP' | 'INT' | 'PST'
  | 'CANC' | 'ABD' | 'AWD' | 'WO' | 'LIVE';

export interface FixtureStatus {
  long: string;
  short: FixtureStatusShort;
  elapsed: number | null;
}

export interface Team {
  id: number;
  name: string;
  logo: string;
  winner: boolean | null;
}

export interface Goals {
  home: number | null;
  away: number | null;
}

export interface Fixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    status: FixtureStatus;
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    season: number;
    round: string;
  };
  teams: {
    home: Team;
    away: Team;
  };
  goals: Goals;
  score: {
    halftime: Goals;
    fulltime: Goals;
    extratime: Goals;
    penalty: Goals;
  };
}

export interface FixtureEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string; logo: string };
  player: { id: number; name: string };
  assist: { id: number | null; name: string | null };
  type: 'Goal' | 'Card' | 'subst' | 'Var';
  detail: string;
  comments: string | null;
}
