import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, SectionList, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAllMatches, fetchLiveMatches, isLive, isFinished } from '../services/api';
import { checkAndNotify } from '../services/notifications';
import { COLORS, SPACING } from '../constants/theme';
import MatchCard from '../components/MatchCard';
import LiveBadge from '../components/LiveBadge';
import { CONFIG } from '../config';
import type { FDMatch } from '../types/api';

type Filter = 'todos' | 'vivo' | 'finalizados';
interface Section { title: string; isLiveSection?: boolean; data: FDMatch[] }

export default function ResultadosScreen() {
  const [filter, setFilter] = useState<Filter>('todos');
  const queryClient = useQueryClient();

  const { data: allMatches, isLoading, error, isFetching } = useQuery({
    queryKey: ['matches'],
    queryFn: fetchAllMatches,
    staleTime: 5 * 60_000,
  });

  const { data: liveMatches } = useQuery({
    queryKey: ['matches-live'],
    queryFn: fetchLiveMatches,
    refetchInterval: CONFIG.LIVE_POLL_INTERVAL_MS,
    staleTime: 0,
  });

  useEffect(() => {
    if (liveMatches && liveMatches.length > 0) {
      checkAndNotify(liveMatches);
    }
  }, [liveMatches]);

  const merged = useMemo<FDMatch[]>(() => {
    if (!allMatches) return [];
    if (!liveMatches?.length) return allMatches;
    const liveMap = new Map(liveMatches.map((m) => [m.id, m]));
    return allMatches.map((m) => liveMap.get(m.id) ?? m);
  }, [allMatches, liveMatches]);

  const sections = useMemo<Section[]>(() => {
    const live = merged.filter((m) => isLive(m.status));
    const finished = merged
      .filter((m) => isFinished(m.status))
      .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime());

    const result: Section[] = [];

    if ((filter === 'todos' || filter === 'vivo') && live.length > 0) {
      result.push({ title: 'EN VIVO', isLiveSection: true, data: live });
    }

    if (filter === 'todos' || filter === 'finalizados') {
      const byDate: Record<string, FDMatch[]> = {};
      for (const m of finished) {
        const key = new Date(m.utcDate).toLocaleDateString('es-MX', {
          weekday: 'short', day: 'numeric', month: 'short',
        }).toUpperCase();
        if (!byDate[key]) byDate[key] = [];
        byDate[key].push(m);
      }
      for (const [title, data] of Object.entries(byDate)) {
        result.push({ title, data });
      }
    }

    return result;
  }, [merged, filter]);

  const liveCount = liveMatches?.length ?? 0;

  const filters: { key: Filter; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'vivo', label: liveCount > 0 ? `En vivo (${liveCount})` : 'En vivo' },
    { key: 'finalizados', label: 'Finalizados' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Resultados</Text>
        {liveCount > 0 && <LiveBadge />}
      </View>

      <View style={styles.filterRow}>
        {filters.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.filterBtn,
              filter === key && styles.filterBtnActive,
              key === 'vivo' && liveCount > 0 && filter !== 'vivo' && styles.filterBtnLive,
            ]}
            onPress={() => setFilter(key)}
          >
            <Text style={[
              styles.filterText,
              filter === key && styles.filterTextActive,
              key === 'vivo' && liveCount > 0 && filter !== 'vivo' && styles.filterTextLive,
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Cargando resultados…</Text>
        </View>
      )}

      {error && !isLoading && (
        <View style={styles.center}>
          <Text style={styles.errorText}>Error al cargar resultados.</Text>
          <Text style={styles.errorSub}>Verifica tu token en .env</Text>
        </View>
      )}

      {!isLoading && sections.length > 0 && (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <MatchCard match={item} />}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeaderRow}>
              <Text style={[
                styles.sectionHeader,
                (section as Section).isLiveSection && styles.sectionHeaderLive,
              ]}>
                {section.title}
              </Text>
              {(section as Section).isLiveSection && (
                <View style={styles.liveIndicatorDot} />
              )}
            </View>
          )}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={() => {
                queryClient.invalidateQueries({ queryKey: ['matches'] });
                queryClient.invalidateQueries({ queryKey: ['matches-live'] });
              }}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      )}

      {!isLoading && !error && sections.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.errorText}>No hay resultados aún.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 56, paddingBottom: SPACING.sm, paddingHorizontal: SPACING.md,
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: 0.3 },
  filterRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, gap: SPACING.sm, flexWrap: 'wrap' },
  filterBtn: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.cardBorder, backgroundColor: COLORS.card,
  },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterBtnLive: { borderColor: COLORS.live },
  filterText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  filterTextActive: { color: '#030A1C', fontWeight: '700' },
  filterTextLive: { color: COLORS.live, fontWeight: '600' },
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginTop: SPACING.sm, gap: 6,
  },
  sectionHeader: { fontSize: 12, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.8 },
  sectionHeaderLive: { color: COLORS.live },
  liveIndicatorDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.live },
  listContent: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  loadingText: { color: COLORS.textSecondary, marginTop: SPACING.sm },
  errorText: { color: COLORS.textPrimary, fontWeight: '600', fontSize: 15 },
  errorSub: { color: COLORS.textSecondary, fontSize: 13 },
});
