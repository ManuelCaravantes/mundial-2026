import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { getFlag } from '../constants/flags';
import type { GroupStanding } from '../types/api';

interface Props {
  group: GroupStanding;
}

const COL = { pos: 28, team: 110, pj: 26, pts: 32, gd: 32 };

export default function GroupTable({ group }: Props) {
  const groupLabel = group.group?.replace('GROUP_', 'Grupo ') ?? '';

  return (
    <View style={styles.card}>
      <Text style={styles.groupTitle}>{groupLabel}</Text>

      {/* Header */}
      <View style={styles.row}>
        <Text style={[styles.cell, { width: COL.pos }]} />
        <Text style={[styles.headerCell, { flex: 1 }]}>País</Text>
        <Text style={[styles.headerCell, { width: COL.pj }]}>PJ</Text>
        <Text style={[styles.headerCell, { width: COL.gd }]}>DG</Text>
        <Text style={[styles.headerCell, { width: COL.pts }]}>Pts</Text>
      </View>

      <View style={styles.divider} />

      {group.table.map((entry, idx) => {
        const qualifies = idx < 2;
        const possiblyQualifies = idx === 2;

        return (
          <React.Fragment key={entry.team.id}>
            {idx === 2 && <View style={styles.classifierLine} />}
            <View style={[styles.row, styles.dataRow]}>
              <View style={[styles.posContainer, { width: COL.pos }]}>
                <Text style={[
                  styles.pos,
                  qualifies && styles.posQualifies,
                  possiblyQualifies && styles.posMaybe,
                ]}>
                  {entry.position}
                </Text>
              </View>

              <View style={[styles.teamCell, { flex: 1 }]}>
                <Text style={styles.flag}>{getFlag(entry.team.name)}</Text>
                <Text style={styles.teamName} numberOfLines={1}>
                  {entry.team.shortName}
                </Text>
              </View>

              <Text style={[styles.cell, { width: COL.pj }]}>{entry.playedGames}</Text>
              <Text style={[styles.cell, { width: COL.gd }]}>
                {entry.goalDifference > 0 ? `+${entry.goalDifference}` : entry.goalDifference}
              </Text>
              <Text style={[styles.cell, styles.ptsCell, { width: COL.pts }]}>
                {entry.points}
              </Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm + 2,
    paddingBottom: SPACING.sm,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.separator,
    marginHorizontal: SPACING.md,
    marginBottom: 2,
  },
  classifierLine: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: SPACING.sm,
    borderStyle: 'dashed',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  dataRow: {
    paddingVertical: 7,
  },
  headerCell: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  cell: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  ptsCell: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  posContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pos: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    width: 20,
    textAlign: 'center',
  },
  posQualifies: {
    color: COLORS.win,
  },
  posMaybe: {
    color: COLORS.primary,
  },
  teamCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flag: {
    fontSize: 18,
  },
  teamName: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
});
