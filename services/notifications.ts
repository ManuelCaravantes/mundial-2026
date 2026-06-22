import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { fetchLiveMatches } from './api';
import type { FDMatch } from '../types/api';

const TASK_ID = 'wc-live-check';
const STORAGE_KEY = 'wc_live_state';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

TaskManager.defineTask(TASK_ID, async () => {
  try {
    const matches = await fetchLiveMatches();
    await checkAndNotify(matches);
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
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch {
    // ya registrada
  }
}

interface StoredState {
  status: string;
  goals: number;
}

export async function checkAndNotify(matches: FDMatch[]): Promise<void> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const stored: Record<string, StoredState> = raw ? JSON.parse(raw) : {};
  const updated = { ...stored };

  for (const m of matches) {
    const id = String(m.id);
    const homeGoals = m.score.fullTime.home ?? 0;
    const awayGoals = m.score.fullTime.away ?? 0;
    const totalGoals = homeGoals + awayGoals;
    const prev = stored[id];

    if (!prev) {
      await schedule({
        title: '⚡ Partido en vivo · Mundial 2026',
        body: `${m.homeTeam.shortName} vs ${m.awayTeam.shortName}`,
        channelId: 'wc-updates',
        data: { matchId: m.id },
      });
    } else if (totalGoals > prev.goals) {
      await schedule({
        title: '⚽ ¡GOOOL! · Mundial 2026',
        body: `${m.homeTeam.shortName}  ${homeGoals} — ${awayGoals}  ${m.awayTeam.shortName}`,
        channelId: 'wc-goals',
        data: { matchId: m.id },
      });
    }

    updated[id] = { status: m.status, goals: totalGoals };
  }

  const liveIds = new Set(matches.map((m) => String(m.id)));
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
    trigger: null,
  });
}
