import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchScorers, fetchAllMatches, calculateTeamStats } from '../services/api';
import { COLORS, SPACING } from '../constants/theme';
import { getFlag } from '../constants/flags';
import type { Scorer, TeamStat } from '../types/api';

type Tab = 'goleadores' | 'asistentes' | 'equipos';
type SortDir = 'asc' | 'desc';
type ScorerKey = 'goals' | 'assists' | 'playedMatches';
type TeamKey = 'goalsFor' | 'goalsAgainst' | 'cleanSheets';

interface SortState<K extends string> { key: K; dir: SortDir }

function nextSort<K extends string>(current: SortState<K>, tapped: K): SortState<K> {
  if (current.key === tapped) return { key: tapped, dir: current.dir === 'desc' ? 'asc' : 'desc' };
  return { key: tapped, dir: 'desc' };
}

function sortArrow(active: boolean, dir: SortDir) {
  if (!active) return '';
  return dir === 'desc' ? ' ↓' : ' ↑';
}

/* ── Celda de header ordenable ── */
function SortCol({
  label, width, flex, sortKey, current, onSort,
}: {
  label: string;
  width?: number;
  flex?: number;
  sortKey: string;
  current: SortState<string>;
  onSort: (k: string) => void;
}) {
  const active = current.key === sortKey;
  return (
    <TouchableOpacity
      style={[hStyles.col, width ? { width } : { flex: flex ?? 1 }]}
      onPress={() => onSort(sortKey)}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
    >
      <Text style={[hStyles.text, active && hStyles.textActive]}>
        {label}{sortArrow(active, current.dir)}
      </Text>
    </TouchableOpacity>
  );
}

const hStyles = StyleSheet.create({
  col: { alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, textAlign: 'center' },
  textActive: { color: COLORS.primary },
});

/* ════════════════════════════════════════ */

export default function EstadisticasScreen() {
  const [tab, setTab] = useState<Tab>('goleadores');

  const [scorerSort, setScorerSort] = useState<SortState<ScorerKey>>({ key: 'goals', dir: 'desc' });
  const [assistSort, setAssistSort] = useState<SortState<ScorerKey>>({ key: 'assists', dir: 'desc' });
  const [teamSort, setTeamSort] = useState<SortState<TeamKey>>({ key: 'goalsFor', dir: 'desc' });

  const queryClient = useQueryClient();

  const { data: scorers, isLoading: loadingScorers, isFetching: fetchingScorers } = useQuery({
    queryKey: ['scorers'],
    queryFn: () => fetchScorers(50),
    staleTime: 5 * 60_000,
  });

  const { data: matches, isLoading: loadingMatches, isFetching: fetchingMatches } = useQuery({
    queryKey: ['matches'],
    queryFn: fetchAllMatches,
    staleTime: 5 * 60_000,
  });

  const sortScorers = (list: Scorer[], sort: SortState<ScorerKey>) =>
    [...(list ?? [])].sort((a, b) => {
      const val = (s: Scorer) =>
        sort.key === 'goals' ? s.goals :
        sort.key === 'assists' ? (s.assists ?? 0) :
        s.playedMatches;
      return sort.dir === 'desc' ? val(b) - val(a) : val(a) - val(b);
    });

  const topScorers = useMemo(
    () => sortScorers(scorers ?? [], scorerSort),
    [scorers, scorerSort]
  );

  const topAssists = useMemo(
    () => sortScorers(
      (scorers ?? []).filter((s) => (s.assists ?? 0) > 0),
      assistSort
    ),
    [scorers, assistSort]
  );

  const teamStats = useMemo(() => {
    if (!matches) return [];
    const stats = calculateTeamStats(matches);
    return [...stats].sort((a, b) => {
      const val = (s: TeamStat) =>
        teamSort.key === 'goalsFor' ? s.goalsFor :
        teamSort.key === 'goalsAgainst' ? s.goalsAgainst :
        s.cleanSheets;
      return teamSort.dir === 'desc' ? val(b) - val(a) : val(a) - val(b);
    });
  }, [matches, teamSort]);

  const isLoading = tab === 'equipos' ? loadingMatches : loadingScorers;
  const isFetching = tab === 'equipos' ? fetchingMatches : fetchingScorers;

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['scorers'] });
    queryClient.invalidateQueries({ queryKey: ['matches'] });
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'goleadores', label: '⚽ Goleadores' },
    { key: 'asistentes', label: '🅰️ Asistencias' },
    { key: 'equipos', label: '🛡 Equipos' },
  ];

  /* ── Header goleadores ── */
  const ScorerTableHeader = ({ sort, onSort }: { sort: SortState<ScorerKey>; onSort: (k: ScorerKey) => void }) => (
    <View style={[rowStyles.row, rowStyles.header]}>
      <Text style={[rowStyles.rank, rowStyles.headerText]}>#</Text>
      <View style={{ width: 28 }} />
      <Text style={[rowStyles.headerText, { flex: 1 }]}>Jugador</Text>
      <SortCol label="PJ" width={32} sortKey="playedMatches" current={sort as SortState<string>} onSort={k => onSort(k as ScorerKey)} />
      <SortCol label="Goles" width={48} sortKey="goals" current={sort as SortState<string>} onSort={k => onSort(k as ScorerKey)} />
      <SortCol label="Asis" width={40} sortKey="assists" current={sort as SortState<string>} onSort={k => onSort(k as ScorerKey)} />
    </View>
  );

  /* ── Header asistencias ── */
  const AssistTableHeader = ({ sort, onSort }: { sort: SortState<ScorerKey>; onSort: (k: ScorerKey) => void }) => (
    <View style={[rowStyles.row, rowStyles.header]}>
      <Text style={[rowStyles.rank, rowStyles.headerText]}>#</Text>
      <View style={{ width: 28 }} />
      <Text style={[rowStyles.headerText, { flex: 1 }]}>Jugador</Text>
      <SortCol label="PJ" width={32} sortKey="playedMatches" current={sort as SortState<string>} onSort={k => onSort(k as ScorerKey)} />
      <SortCol label="Asis" width={48} sortKey="assists" current={sort as SortState<string>} onSort={k => onSort(k as ScorerKey)} />
      <SortCol label="Goles" width={40} sortKey="goals" current={sort as SortState<string>} onSort={k => onSort(k as ScorerKey)} />
    </View>
  );

  /* ── Header equipos ── */
  const TeamTableHeader = ({ sort, onSort }: { sort: SortState<TeamKey>; onSort: (k: TeamKey) => void }) => (
    <View style={[rowStyles.row, rowStyles.header]}>
      <Text style={[rowStyles.rank, rowStyles.headerText]}>#</Text>
      <View style={{ width: 28 }} />
      <Text style={[rowStyles.headerText, { flex: 1 }]}>Equipo</Text>
      <SortCol label="GF" width={40} sortKey="goalsFor" current={sort as SortState<string>} onSort={k => onSort(k as TeamKey)} />
      <SortCol label="GC" width={40} sortKey="goalsAgainst" current={sort as SortState<string>} onSort={k => onSort(k as TeamKey)} />
      <SortCol label="🔒" width={40} sortKey="cleanSheets" current={sort as SortState<string>} onSort={k => onSort(k as TeamKey)} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Estadísticas</Text>
        <Text style={styles.subtitle}>Mundial 2026</Text>
      </View>

      <View style={styles.tabRow}>
        {tabs.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tabBtn, tab === key && styles.tabBtnActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Cargando estadísticas…</Text>
        </View>
      )}

      {!isLoading && tab === 'goleadores' && (
        <FlatList
          data={topScorers}
          keyExtractor={(item) => String(item.player.id)}
          renderItem={({ item, index }) => (
            <ScorerRow item={item} rank={index + 1} primaryKey="goals" secondaryKey="assists" />
          )}
          ListHeaderComponent={
            <ScorerTableHeader
              sort={scorerSort}
              onSort={(k) => setScorerSort((s) => nextSort(s, k))}
            />
          }
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
          ListEmptyComponent={<EmptyState text="Sin datos de goleadores aún." />}
        />
      )}

      {!isLoading && tab === 'asistentes' && (
        <FlatList
          data={topAssists}
          keyExtractor={(item) => String(item.player.id)}
          renderItem={({ item, index }) => (
            <ScorerRow item={item} rank={index + 1} primaryKey="assists" secondaryKey="goals" />
          )}
          ListHeaderComponent={
            <AssistTableHeader
              sort={assistSort}
              onSort={(k) => setAssistSort((s) => nextSort(s, k))}
            />
          }
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
          ListEmptyComponent={<EmptyState text="Sin datos de asistencias aún." />}
        />
      )}

      {!isLoading && tab === 'equipos' && (
        <FlatList
          data={teamStats}
          keyExtractor={(item) => String(item.team.id)}
          renderItem={({ item, index }) => <TeamRow stat={item} rank={index + 1} sortKey={teamSort.key} />}
          ListHeaderComponent={
            <TeamTableHeader
              sort={teamSort}
              onSort={(k) => setTeamSort((s) => nextSort(s, k))}
            />
          }
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
          ListEmptyComponent={<EmptyState text="Sin partidos finalizados aún." />}
        />
      )}
    </View>
  );
}

/* ── Fila jugador ── */
function ScorerRow({
  item, rank, primaryKey, secondaryKey,
}: {
  item: Scorer;
  rank: number;
  primaryKey: ScorerKey;
  secondaryKey: ScorerKey;
}) {
  const primary = primaryKey === 'goals' ? item.goals : primaryKey === 'assists' ? (item.assists ?? 0) : item.playedMatches;
  const secondary = secondaryKey === 'goals' ? item.goals : secondaryKey === 'assists' ? (item.assists ?? 0) : item.playedMatches;

  return (
    <View style={[rowStyles.row, rank % 2 === 0 && rowStyles.rowAlt]}>
      <Text style={rowStyles.rank}>{rank}</Text>
      <Text style={rowStyles.flag}>{getFlag(item.player.nationality)}</Text>
      <View style={rowStyles.nameBlock}>
        <Text style={rowStyles.name} numberOfLines={1}>{item.player.name}</Text>
        <Text style={rowStyles.teamLabel} numberOfLines={1}>{item.team.shortName}</Text>
      </View>
      <Text style={[rowStyles.cell, { width: 32 }]}>{item.playedMatches}</Text>
      <Text style={[rowStyles.statMain, { width: 48 }]}>{primary}</Text>
      <Text style={[rowStyles.statSec, { width: 40 }]}>{secondary}</Text>
    </View>
  );
}

/* ── Fila equipo ── */
function TeamRow({ stat, rank, sortKey }: { stat: TeamStat; rank: number; sortKey: TeamKey }) {
  return (
    <View style={[rowStyles.row, rank % 2 === 0 && rowStyles.rowAlt]}>
      <Text style={rowStyles.rank}>{rank}</Text>
      <Text style={rowStyles.flag}>{getFlag(stat.team.name)}</Text>
      <View style={rowStyles.nameBlock}>
        <Text style={rowStyles.name} numberOfLines={1}>{stat.team.shortName}</Text>
        <Text style={rowStyles.teamLabel}>{stat.gamesPlayed} PJ</Text>
      </View>
      <Text style={[rowStyles.cell, { width: 40 }, sortKey === 'goalsFor' && rowStyles.colActive]}>
        {stat.goalsFor}
      </Text>
      <Text style={[rowStyles.cell, { width: 40 }, sortKey === 'goalsAgainst' && rowStyles.colActive]}>
        {stat.goalsAgainst}
      </Text>
      <Text style={[rowStyles.cell, { width: 40 }, sortKey === 'cleanSheets' && rowStyles.colActive, stat.cleanSheets > 0 && rowStyles.cleanSheet]}>
        {stat.cleanSheets}
      </Text>
    </View>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: SPACING.sm,
    gap: 6,
  },
  rowAlt: { backgroundColor: 'rgba(255,255,255,0.03)' },
  header: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    marginBottom: 2,
  },
  headerText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  rank: { width: 22, fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', fontWeight: '600' },
  flag: { fontSize: 22, width: 28, textAlign: 'center' },
  nameBlock: { flex: 1 },
  name: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '600' },
  teamLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  cell: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', fontWeight: '600' },
  statMain: { fontSize: 17, fontWeight: '800', color: COLORS.primary, textAlign: 'center' },
  statSec: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', fontWeight: '600' },
  colActive: { color: COLORS.primary, fontWeight: '800', fontSize: 15 },
  cleanSheet: { color: COLORS.win },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 56, paddingBottom: SPACING.sm, paddingHorizontal: SPACING.md },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: 0.3 },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  tabRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, gap: SPACING.sm },
  tabBtn: {
    flex: 1, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.card, alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  tabTextActive: { color: '#030A1C', fontWeight: '700' },
  listContent: { paddingHorizontal: SPACING.sm, paddingBottom: SPACING.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: SPACING.sm },
  loadingText: { color: COLORS.textSecondary, marginTop: SPACING.sm },
  emptyText: { color: COLORS.textSecondary, fontSize: 14 },
});
