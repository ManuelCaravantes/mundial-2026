import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { getFlag } from '../constants/flags';
import LiveBadge from './LiveBadge';
import { isLive, isFinished } from '../services/api';
import type { Fixture } from '../types/api';

interface Props {
  fixture: Fixture;
}

export default function MatchCard({ fixture }: Props) {
  const { teams, goals, score, fixture: f, league } = fixture;
  const status = f.status.short;
  const live = isLive(status);
  const finished = isFinished(status);
  const upcoming = !live && !finished;

  const matchTime = new Date(f.date).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const roundLabel = league.round
    .replace('Group Stage', 'Fase de Grupos')
    .replace('Round of 16', 'Octavos de Final')
    .replace('Quarter-finals', 'Cuartos de Final')
    .replace('Semi-finals', 'Semifinales')
    .replace('3rd Place Final', 'Tercer Lugar')
    .replace('Final', 'Final');

  return (
    <View style={[styles.card, live && styles.cardLive]}>
      <Text style={styles.round}>{roundLabel}</Text>

      <View style={styles.matchRow}>
        {/* Equipo local */}
        <View style={styles.teamBlock}>
          <Text style={styles.flag}>{getFlag(teams.home.name)}</Text>
          <Text style={styles.teamName} numberOfLines={1}>{teams.home.name}</Text>
        </View>

        {/* Marcador / Hora */}
        <View style={styles.scoreBlock}>
          {upcoming ? (
            <Text style={styles.time}>{matchTime}</Text>
          ) : (
            <>
              <Text style={[
                styles.score,
                finished && teams.home.winner === true && styles.scoreWin,
                finished && teams.home.winner === false && styles.scoreLose,
              ]}>
                {goals.home ?? '-'}
              </Text>
              <Text style={styles.scoreSep}>:</Text>
              <Text style={[
                styles.score,
                finished && teams.away.winner === true && styles.scoreWin,
                finished && teams.away.winner === false && styles.scoreLose,
              ]}>
                {goals.away ?? '-'}
              </Text>
            </>
          )}
        </View>

        {/* Equipo visitante */}
        <View style={[styles.teamBlock, styles.teamRight]}>
          <Text style={styles.flag}>{getFlag(teams.away.name)}</Text>
          <Text style={styles.teamName} numberOfLines={1}>{teams.away.name}</Text>
        </View>
      </View>

      {/* Estado inferior */}
      <View style={styles.statusRow}>
        {live && (
          <LiveBadge elapsed={f.status.elapsed} short={status} />
        )}
        {finished && (
          <Text style={styles.statusFin}>
            {status === 'PEN'
              ? `Penales: ${score.penalty.home ?? '-'} - ${score.penalty.away ?? '-'}`
              : status === 'AET'
              ? 'Final (prórroga)'
              : 'Final'}
          </Text>
        )}
        {upcoming && (
          <Text style={styles.statusUpcoming}>Por jugar</Text>
        )}
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
    backgroundColor: '#0D1B3E',
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
  teamBlock: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 4,
  },
  teamRight: {
    alignItems: 'flex-end',
  },
  flag: {
    fontSize: 28,
  },
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
  scoreWin: {
    color: COLORS.win,
  },
  scoreLose: {
    color: COLORS.textSecondary,
  },
  scoreSep: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  time: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  statusRow: {
    marginTop: SPACING.sm,
    alignItems: 'center',
  },
  statusFin: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  statusUpcoming: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});
