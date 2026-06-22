import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { getFlag } from '../constants/flags';
import { isLive, isFinished } from '../services/api';
import LiveBadge from './LiveBadge';
import type { FDMatch } from '../types/api';

interface Props {
  match: FDMatch;
}

const TBD = { name: 'Por definir', shortName: 'Por definir' };

export default function BracketMatchCard({ match }: Props) {
  const { homeTeam, awayTeam, score, status, utcDate } = match;
  const live = isLive(status);
  const finished = isFinished(status);

  const isTBD = (name: string) => !name || name === 'TBD';

  const homeGoals = score.fullTime.home;
  const awayGoals = score.fullTime.away;
  const homeWins = score.winner === 'HOME_TEAM';
  const awayWins = score.winner === 'AWAY_TEAM';

  const matchDate = new Date(utcDate).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short',
  });
  const matchTime = new Date(utcDate).toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <View style={[styles.card, live && styles.cardLive]}>
      {/* Equipo local */}
      <View style={[styles.teamRow, finished && homeWins && styles.winnerRow]}>
        <Text style={styles.flag}>
          {isTBD(homeTeam.name) ? '🏳️' : getFlag(homeTeam.name)}
        </Text>
        <Text style={[styles.teamName, finished && homeWins && styles.winnerText]} numberOfLines={1}>
          {isTBD(homeTeam.name) ? TBD.shortName : homeTeam.shortName}
        </Text>
        {(live || finished) && (
          <Text style={[styles.score, finished && homeWins && styles.winnerText]}>
            {homeGoals ?? '-'}
          </Text>
        )}
      </View>

      <View style={styles.separator} />

      {/* Equipo visitante */}
      <View style={[styles.teamRow, finished && awayWins && styles.winnerRow]}>
        <Text style={styles.flag}>
          {isTBD(awayTeam.name) ? '🏳️' : getFlag(awayTeam.name)}
        </Text>
        <Text style={[styles.teamName, finished && awayWins && styles.winnerText]} numberOfLines={1}>
          {isTBD(awayTeam.name) ? TBD.shortName : awayTeam.shortName}
        </Text>
        {(live || finished) && (
          <Text style={[styles.score, finished && awayWins && styles.winnerText]}>
            {awayGoals ?? '-'}
          </Text>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {live && <LiveBadge short={status} />}
        {!live && !finished && (
          <Text style={styles.dateText}>{matchDate} · {matchTime}</Text>
        )}
        {finished && (
          <Text style={styles.finText}>
            {score.duration === 'PENALTY_SHOOTOUT' ? 'Penales' :
             score.duration === 'EXTRA_TIME' ? 'Prórroga' : 'Final'}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  cardLive: {
    borderColor: COLORS.live,
    elevation: 4,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 9,
    gap: 8,
  },
  winnerRow: {
    backgroundColor: 'rgba(48, 209, 88, 0.08)',
  },
  flag: { fontSize: 20 },
  teamName: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  winnerText: {
    color: COLORS.win,
    fontWeight: '700',
  },
  score: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    minWidth: 18,
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.separator,
    marginHorizontal: SPACING.sm,
  },
  footer: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.separator,
    marginTop: 2,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  finText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
