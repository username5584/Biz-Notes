import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary, ModalPortalProvider } from '@/components';
import { GoogleDriveSyncProvider } from '@/context/GoogleDriveSyncContext';
import { NotesProvider } from '@/context';
import colors from '@/constants/colors';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 250,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        contentStyle: { backgroundColor: colors.light.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="note/[id]" />
      <Stack.Screen name="search" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <NotesProvider>
          <GoogleDriveSyncProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <ModalPortalProvider>
                  <RootLayoutNav />
                </ModalPortalProvider>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </GoogleDriveSyncProvider>
        </NotesProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

