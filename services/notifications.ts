import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { fetchLiveFixtures } from './api';
import type { Fixture } from '../types/api';

const TASK_ID = 'wc-live-check';
const STORAGE_KEY = 'wc_live_goals';

// Comportamiento cuando llega una notificación con la app abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Definición de la tarea en background (debe estar al nivel de módulo)
TaskManager.defineTask(TASK_ID, async () => {
  try {
    const fixtures = await fetchLiveFixtures();
    await checkAndNotify(fixtures);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function setupNotifications(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('wc-goals', {
      name: 'Goles',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 300, 100, 300],
      lightColor: '#C9A84C',
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('wc-updates', {
      name: 'Eventos del partido',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function registerBackgroundFetch(): Promise<void> {
  const status = await BackgroundFetch.getStatusAsync();
  if (
    status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
    status === BackgroundFetch.BackgroundFetchStatus.Denied
  ) return;

  try {
    await BackgroundFetch.registerTaskAsync(TASK_ID, {
      minimumInterval: 15 * 60, // mínimo permitido por Android: 15 min
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch {
    // Ya estaba registrada
  }
}

export async function checkAndNotify(fixtures: Fixture[]): Promise<void> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const stored: Record<string, number> = raw ? JSON.parse(raw) : {};
  const updated = { ...stored };

  for (const f of fixtures) {
    const id = String(f.fixture.id);
    const homeGoals = f.goals.home ?? 0;
    const awayGoals = f.goals.away ?? 0;
    const total = homeGoals + awayGoals;
    const prev = stored[id];

    if (prev === undefined) {
      await schedule({
        title: '⚡ Partido en vivo · Mundial 2026',
        body: `${f.teams.home.name} vs ${f.teams.away.name}`,
        channelId: 'wc-updates',
        data: { fixtureId: f.fixture.id },
      });
    } else if (total > prev) {
      await schedule({
        title: '⚽ ¡GOOOL! · Mundial 2026',
        body: `${f.teams.home.name}  ${homeGoals} — ${awayGoals}  ${f.teams.away.name}`,
        channelId: 'wc-goals',
        data: { fixtureId: f.fixture.id },
      });
    }

    updated[id] = total;
  }

  // Limpiar partidos que ya no están en vivo
  const liveIds = new Set(fixtures.map((f) => String(f.fixture.id)));
  for (const key of Object.keys(updated)) {
    if (!liveIds.has(key)) delete updated[key];
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

async function schedule(params: {
  title: string;
  body: string;
  channelId: string;
  data?: Record<string, unknown>;
}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: params.title,
      body: params.body,
      data: params.data,
      ...(Platform.OS === 'android' && { channelId: params.channelId }),
    },
    trigger: null, // inmediata
  });
}
