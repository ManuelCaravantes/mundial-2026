import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchAllMatches, KNOCKOUT_STAGES, isFinished } from '../services/api';
import { COLORS, SPACING } from '../constants/theme';
import BracketMatchCard from '../components/BracketMatchCard';
import type { FDMatch } from '../types/api';

type StageKey = typeof KNOCKOUT_STAGES[number]['key'];

export default function BracketScreen() {
  const [activeStage, setActiveStage] = useState<StageKey>('LAST_16');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['matches'],
    queryFn: fetchAllMatches,
    staleTime: 5 * 60_000,
  });

  const stageMatches = useMemo<FDMatch[]>(() => {
    if (!data) return [];
    return data
      .filter((m) => m.stage === activeStage)
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
  }, [data, activeStage]);

  const stageProgress = useMemo(() => {
    if (!data) return {};
    return KNOCKOUT_STAGES.reduce<Record<string, { total: number; played: number }>>((acc, s) => {
      const matches = data.filter((m) => m.stage === s.key);
      acc[s.key] = {
        total: matches.length,
        played: matches.filter((m) => isFinished(m.status)).length,
      };
      return acc;
    }, {});
  }, [data]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bracket</Text>
        <Text style={styles.subtitle}>Fase eliminatoria · Mundial 2026</Text>
      </View>

      {/* Stage tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stageTabsContent}
        style={styles.stageTabs}
      >
        {KNOCKOUT_STAGES.map(({ key, label }) => {
          const progress = stageProgress[key];
          const active = activeStage === key;
          const hasMatches = (progress?.total ?? 0) > 0;

          return (
            <TouchableOpacity
              key={key}
              style={[styles.stageTab, active && styles.stageTabActive]}
              onPress={() => setActiveStage(key)}
            >
              <Text style={[styles.stageTabText, active && styles.stageTabTextActive]}>
                {label}
              </Text>
              {hasMatches && (
                <Text style={[styles.stageProgress, active && styles.stageProgressActive]}>
                  {progress.played}/{progress.total}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Cargando bracket…</Text>
        </View>
      )}

      {error && !isLoading && (
        <View style={styles.center}>
          <Text style={styles.errorText}>Error al cargar el bracket.</Text>
        </View>
      )}

      {!isLoading && !error && stageMatches.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🗓</Text>
          <Text style={styles.emptyText}>Aún no hay partidos en esta ronda.</Text>
          <Text style={styles.emptySubtext}>Se definirán al terminar la fase de grupos.</Text>
        </View>
      )}

      {!isLoading && stageMatches.length > 0 && (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        >
          {activeStage === 'FINAL' || activeStage === 'THIRD_PLACE' ? (
            // Partido único centrado
            <View style={styles.singleMatchContainer}>
              {stageMatches.map((m) => (
                <BracketMatchCard key={m.id} match={m} />
              ))}
            </View>
          ) : (
            // Lista de partidos en dos columnas
            <View style={styles.matchGrid}>
              {stageMatches.map((m, i) => (
                <View key={m.id} style={styles.gridItem}>
                  <Text style={styles.matchNumber}>Partido {i + 1}</Text>
                  <BracketMatchCard match={m} />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 56,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  stageTabs: {
    maxHeight: 56,
    marginBottom: SPACING.sm,
  },
  stageTabsContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  stageTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.card,
    alignItems: 'center',
  },
  stageTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stageTabText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  stageTabTextActive: {
    color: '#030A1C',
    fontWeight: '700',
  },
  stageProgress: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  stageProgressActive: {
    color: '#030A1C',
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  matchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  gridItem: {
    width: '48%',
  },
  matchNumber: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  singleMatchContainer: {
    maxWidth: 300,
    alignSelf: 'center',
    width: '100%',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  emptyIcon: { fontSize: 40, marginBottom: SPACING.sm },
  emptyText: { color: COLORS.textPrimary, fontWeight: '600', fontSize: 15 },
  emptySubtext: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center' },
  loadingText: { color: COLORS.textSecondary, marginTop: SPACING.sm },
  errorText: { color: COLORS.textPrimary, fontWeight: '600', fontSize: 15 },
});
