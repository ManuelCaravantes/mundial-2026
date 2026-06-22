import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { getFlag } from '../constants/flags';
import LiveBadge from './LiveBadge';
import { isLive, isFinished, getRoundLabel } from '../services/api';
import type { FDMatch } from '../types/api';

interface Props {
  match: FDMatch;
}

export default function MatchCard({ match }: Props) {
  const { homeTeam, awayTeam, score, status, utcDate, stage, group } = match;
  const live = isLive(status);
  const finished = isFinished(status);
  const upcoming = !live && !finished;

  const homeGoals = score.fullTime.home;
  const awayGoals = score.fullTime.away;

  const matchTime = new Date(utcDate).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const homeWins = score.winner === 'HOME_TEAM';
  const awayWins = score.winner === 'AWAY_TEAM';

  return (
    <View style={[styles.card, live && styles.cardLive]}>
      <Text style={styles.round}>{getRoundLabel(stage, group)}</Text>

      <View style={styles.matchRow}>
        {/* Local */}
        <View style={styles.teamBlock}>
          <Text style={styles.flag}>{getFlag(homeTeam.name)}</Text>
          <Text style={styles.teamName} numberOfLines={1}>{homeTeam.shortName}</Text>
        </View>

        {/* Marcador / Hora */}
        <View style={styles.scoreBlock}>
          {upcoming ? (
            <Text style={styles.time}>{matchTime}</Text>
          ) : (
            <>
              <Text style={[styles.score, finished && homeWins && styles.scoreWin, finished && awayWins && styles.scoreLose]}>
                {homeGoals ?? '-'}
              </Text>
              <Text style={styles.scoreSep}>:</Text>
              <Text style={[styles.score, finished && awayWins && styles.scoreWin, finished && homeWins && styles.scoreLose]}>
                {awayGoals ?? '-'}
              </Text>
            </>
          )}
        </View>

        {/* Visitante */}
        <View style={[styles.teamBlock, styles.teamRight]}>
          <Text style={styles.flag}>{getFlag(awayTeam.name)}</Text>
          <Text style={styles.teamName} numberOfLines={1}>{awayTeam.shortName}</Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        {live && <LiveBadge short={status} />}
        {finished && (
          <Text style={styles.statusFin}>
            {status === 'AWARDED' ? 'Walkover' :
             score.duration === 'PENALTY_SHOOTOUT' ? 'Final (penales)' :
             score.duration === 'EXTRA_TIME' ? 'Final (prórroga)' : 'Final'}
          </Text>
        )}
        {upcoming && <Text style={styles.statusUpcoming}>Por jugar</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    marginBottom: SPACING.sm,
  },
  cardLive: {
    borderColor: COLORS.live,
    shadowColor: COLORS.live,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  round: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.4,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamBlock: { flex: 1, alignItems: 'flex-start', gap: 4 },
  teamRight: { alignItems: 'flex-end' },
  flag: { fontSize: 28 },
  teamName: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '500',
    maxWidth: 100,
  },
  scoreBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.sm,
  },
  score: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    minWidth: 20,
    textAlign: 'center',
  },
  scoreWin: { color: COLORS.win },
  scoreLose: { color: COLORS.textSecondary },
  scoreSep: { fontSize: 22, fontWeight: '700', color: COLORS.textSecondary },
  time: { fontSize: 20, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.5 },
  statusRow: { marginTop: SPACING.sm, alignItems: 'center' },
  statusFin: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  statusUpcoming: { fontSize: 11, color: COLORS.textSecondary, fontStyle: 'italic' },
});
