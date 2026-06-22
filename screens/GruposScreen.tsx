import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchStandings } from '../services/api';
import { COLORS, SPACING } from '../constants/theme';
import GroupTable from '../components/GroupTable';

export default function GruposScreen() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['standings'],
    queryFn: fetchStandings,
    staleTime: 5 * 60_000,
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Grupos</Text>
        {data && (
          <Text style={styles.subtitle}>{data.length} grupos · Mundial 2026</Text>
        )}
      </View>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Cargando grupos…</Text>
        </View>
      )}

      {error && !isLoading && (
        <View style={styles.center}>
          <Text style={styles.errorText}>Error al cargar los grupos.</Text>
          <Text style={styles.errorSub}>Verifica tu token en .env</Text>
        </View>
      )}

      {!isLoading && data && (
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
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.win }]} />
              <Text style={styles.legendText}>Clasifican</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
              <Text style={styles.legendText}>Posible 3ro</Text>
            </View>
          </View>

          {data.map((group) => (
            <GroupTable key={group.group} group={group} />
          ))}
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
  legend: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
  loadingText: { color: COLORS.textSecondary, marginTop: SPACING.sm },
  errorText: { color: COLORS.textPrimary, fontWeight: '600', fontSize: 15 },
  errorSub: { color: COLORS.textSecondary, fontSize: 13 },
});
