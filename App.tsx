import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { AppProvider, useApp } from './src/context/AppContext';
import RootNavigator from './src/navigation/RootNavigator';

function AppContent() {
  const { isLoading, theme, data } = useApp();

  const statusBarStyle =
    data.settings.theme === 'dark' ? 'light' : 'dark';

  if (isLoading) {
    return (
      <>
        <StatusBar style={statusBarStyle} />
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.background,
          }}
        >
          <ActivityIndicator
            size="large"
            color={theme.primary}
          />
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar style={statusBarStyle} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}