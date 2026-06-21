import React, { useState, useMemo } from 'react';
import {
  View, Text, SectionList, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchAllFixtures } from '../services/api';
import { COLORS, SPACING } from '../constants/theme';
import MatchCard from '../components/MatchCard';
import type { Fixture } from '../types/api';

type Filter = 'todos' | 'hoy' | 'proximos';

interface Section {
  title: string;
  data: Fixture[];
}

function toDateKey(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).toUpperCase();
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isUpcoming(dateStr: string): boolean {
  return new Date(dateStr) >= new Date();
}

export default function CalendarioScreen() {
  const [filter, setFilter] = useState<Filter>('todos');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['fixtures'],
    queryFn: fetchAllFixtures,
    staleTime: 5 * 60_000,
  });

  const sections = useMemo<Section[]>(() => {
    if (!data) return [];

    let filtered = data;
    if (filter === 'hoy') {
      filtered = data.filter((f) => isToday(f.fixture.date));
    } else if (filter === 'proximos') {
      filtered = data.filter((f) => isUpcoming(f.fixture.date) && f.fixture.status.short === 'NS');
    }

    const map: Record<string, Fixture[]> = {};
    for (const f of filtered) {
      const key = toDateKey(f.fixture.date);
      if (!map[key]) map[key] = [];
      map[key].push(f);
    }

    return Object.entries(map)
      .sort(([, a], [, b]) => a[0].fixture.timestamp - b[0].fixture.timestamp)
      .map(([title, fixtures]) => ({
        title,
        data: fixtures.sort((a, b) => a.fixture.timestamp - b.fixture.timestamp),
      }));
  }, [data, filter]);

  const filters: { key: Filter; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'hoy', label: 'Hoy' },
    { key: 'proximos', label: 'Por jugar' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Mundial 2026</Text>
      </View>

      {/* Filtros */}
      <View style={styles.filterRow}>
        {filters.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.filterBtn, filter === key && styles.filterBtnActive]}
            onPress={() => setFilter(key)}
          >
            <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Cargando calendario…</Text>
        </View>
      )}

      {error && !isLoading && (
        <View style={styles.center}>
          <Text style={styles.errorText}>Error al cargar los partidos.</Text>
          <Text style={styles.errorSub}>Verifica tu API key en config.ts</Text>
        </View>
      )}

      {!isLoading && !error && sections.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.errorText}>No hay partidos para mostrar.</Text>
        </View>
      )}

      {!isLoading && sections.length > 0 && (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.fixture.id)}
          renderItem={({ item }) => <MatchCard fixture={item} />}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.card,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#030A1C',
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.sm,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  errorText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
  errorSub: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
});
