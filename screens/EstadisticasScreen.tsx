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

export default function EstadisticasScreen() {
  const [tab, setTab] = useState<Tab>('goleadores');
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

  const topScorers = useMemo(
    () => scorers?.slice().sort((a, b) => b.goals - a.goals) ?? [],
    [scorers]
  );

  const topAssists = useMemo(
    () =>
      scorers
        ?.filter((s) => (s.assists ?? 0) > 0)
        .slice()
        .sort((a, b) => (b.assists ?? 0) - (a.assists ?? 0)) ?? [],
    [scorers]
  );

  const teamStats = useMemo(
    () => (matches ? calculateTeamStats(matches) : []),
    [matches]
  );

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Estadísticas</Text>
        <Text style={styles.subtitle}>Mundial 2026</Text>
      </View>

      {/* Tabs */}
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

      {/* Goleadores */}
      {!isLoading && tab === 'goleadores' && (
        <FlatList
          data={topScorers}
          keyExtractor={(item) => String(item.player.id)}
          renderItem={({ item, index }) => <ScorerRow item={item} rank={index + 1} showAssists />}
          ListHeaderComponent={<ScorerHeader showAssists />}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
          ListEmptyComponent={<EmptyState text="Sin datos de goleadores aún." />}
        />
      )}

      {/* Asistencias */}
      {!isLoading && tab === 'asistentes' && (
        <FlatList
          data={topAssists}
          keyExtractor={(item) => String(item.player.id)}
          renderItem={({ item, index }) => <ScorerRow item={item} rank={index + 1} showAssists={false} />}
          ListHeaderComponent={<ScorerHeader showAssists={false} />}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
          ListEmptyComponent={<EmptyState text="Sin datos de asistencias aún." />}
        />
      )}

      {/* Equipos */}
      {!isLoading && tab === 'equipos' && (
        <FlatList
          data={teamStats}
          keyExtractor={(item) => String(item.team.id)}
          renderItem={({ item, index }) => <TeamRow stat={item} rank={index + 1} />}
          ListHeaderComponent={<TeamHeader />}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
          ListEmptyComponent={<EmptyState text="Sin partidos finalizados aún." />}
        />
      )}
    </View>
  );
}

/* ── Fila de goleador / asistente ── */
function ScorerRow({ item, rank, showAssists }: { item: Scorer; rank: number; showAssists: boolean }) {
  const stat = showAssists ? item.goals : (item.assists ?? 0);
  const secondary = showAssists ? (item.assists ?? 0) : item.goals;

  return (
    <View style={[rowStyles.row, rank % 2 === 0 && rowStyles.rowAlt]}>
      <Text style={rowStyles.rank}>{rank}</Text>
      <Text style={rowStyles.flag}>{getFlag(item.player.nationality)}</Text>
      <View style={rowStyles.nameBlock}>
        <Text style={rowStyles.name} numberOfLines={1}>{item.player.name}</Text>
        <Text style={rowStyles.team} numberOfLines={1}>{item.team.shortName}</Text>
      </View>
      <Text style={rowStyles.pj}>{item.playedMatches}</Text>
      <Text style={rowStyles.statMain}>{stat}</Text>
      <Text style={rowStyles.statSec}>{secondary}</Text>
    </View>
  );
}

function ScorerHeader({ showAssists }: { showAssists: boolean }) {
  return (
    <View style={[rowStyles.row, rowStyles.header]}>
      <Text style={[rowStyles.rank, rowStyles.headerText]}>#</Text>
      <View style={{ width: 28 }} />
      <Text style={[rowStyles.nameBlock, rowStyles.headerText, { flex: 1 }]}>Jugador</Text>
      <Text style={[rowStyles.pj, rowStyles.headerText]}>PJ</Text>
      <Text style={[rowStyles.statMain, rowStyles.headerText]}>{showAssists ? 'Goles' : 'Asis'}</Text>
      <Text style={[rowStyles.statSec, rowStyles.headerText]}>{showAssists ? 'Asis' : 'Goles'}</Text>
    </View>
  );
}

/* ── Fila de equipo ── */
function TeamRow({ stat, rank }: { stat: TeamStat; rank: number }) {
  return (
    <View style={[rowStyles.row, rank % 2 === 0 && rowStyles.rowAlt]}>
      <Text style={rowStyles.rank}>{rank}</Text>
      <Text style={rowStyles.flag}>{getFlag(stat.team.name)}</Text>
      <View style={rowStyles.nameBlock}>
        <Text style={rowStyles.name} numberOfLines={1}>{stat.team.shortName}</Text>
        <Text style={rowStyles.team}>{stat.gamesPlayed} PJ</Text>
      </View>
      <Text style={rowStyles.pj}>{stat.goalsFor}</Text>
      <Text style={rowStyles.statMain}>{stat.goalsAgainst}</Text>
      <Text style={[rowStyles.statSec, stat.cleanSheets > 0 && rowStyles.cleanSheet]}>
        {stat.cleanSheets}
      </Text>
    </View>
  );
}

function TeamHeader() {
  return (
    <View style={[rowStyles.row, rowStyles.header]}>
      <Text style={[rowStyles.rank, rowStyles.headerText]}>#</Text>
      <View style={{ width: 28 }} />
      <Text style={[rowStyles.nameBlock as object, rowStyles.headerText, { flex: 1 }]}>Equipo</Text>
      <Text style={[rowStyles.pj, rowStyles.headerText]}>GF</Text>
      <Text style={[rowStyles.statMain, rowStyles.headerText]}>GC</Text>
      <Text style={[rowStyles.statSec, rowStyles.headerText]}>🔒</Text>
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
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    marginBottom: 4,
  },
  headerText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' },
  rank: { width: 22, fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', fontWeight: '600' },
  flag: { fontSize: 22, width: 28, textAlign: 'center' },
  nameBlock: { flex: 1 },
  name: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '600' },
  team: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  pj: { width: 32, fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },
  statMain: { width: 40, fontSize: 16, fontWeight: '800', color: COLORS.primary, textAlign: 'center' },
  statSec: { width: 36, fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', fontWeight: '600' },
  cleanSheet: { color: COLORS.win },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 56,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: 0.3 },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.card,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  tabTextActive: { color: '#030A1C', fontWeight: '700' },
  listContent: { paddingHorizontal: SPACING.sm, paddingBottom: SPACING.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: SPACING.sm },
  loadingText: { color: COLORS.textSecondary, marginTop: SPACING.sm },
  emptyText: { color: COLORS.textSecondary, fontSize: 14 },
});
