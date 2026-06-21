// Importar la definición del background task antes de todo
import './services/notifications';

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupNotifications, registerBackgroundFetch } from './services/notifications';
import TabNavigator from './navigation/TabNavigator';
import { COLORS } from './constants/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: 1000,
    },
  },
});

export default function App() {
  useEffect(() => {
    (async () => {
      const granted = await setupNotifications();
      if (granted) {
        await registerBackgroundFetch();
      }
    })();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <StatusBar style="light" />
        <TabNavigator />
      </NavigationContainer>
    </QueryClientProvider>
  );
}
