import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { AppProvider, useApp } from './src/context/AppContext';
import UpdateModal from './src/components/UpdateModal';
import RootNavigator from './src/navigation/RootNavigator';
import {
  checkForUpdate,
  type UpdateInfo,
} from './src/services/updateService';

function AppContent() {
  const { isLoading, theme, data } = useApp();
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    let mounted = true;

    checkForUpdate().then((update) => {
      if (mounted) {
        setUpdateInfo(update);
      }
    });

    return () => {
      mounted = false;
    };
  }, [isLoading]);

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
      <UpdateModal
        theme={theme}
        update={updateInfo}
        onLater={() => setUpdateInfo(null)}
      />
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