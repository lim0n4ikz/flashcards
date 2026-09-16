import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppData } from '../types';

const STORAGE_KEY = '@flashcards_app_data';
const BACKUP_STORAGE_KEY = '@flashcards_app_backup';

const defaultData: AppData = {
  profiles: [],
  wordGroups: [],
  words: [],
  settings: {
    theme: 'light',
  },
  activeProfileId: null,
};

export function normalizeAppData(data: Partial<AppData>): AppData {
  return {
    profiles: Array.isArray(data.profiles)
      ? data.profiles
      : defaultData.profiles,
    wordGroups: Array.isArray(data.wordGroups)
      ? data.wordGroups
      : defaultData.wordGroups,
    words: Array.isArray(data.words)
      ? data.words
      : defaultData.words,
    settings: {
      ...defaultData.settings,
      ...(data.settings ?? {}),
    },
    activeProfileId:
      typeof data.activeProfileId === 'string'
        ? data.activeProfileId
        : null,
  };
}

export async function loadAppData(): Promise<AppData> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);

    if (!json) {
      return defaultData;
    }

    const data = JSON.parse(json) as AppData;

    return normalizeAppData(data);
  } catch (error) {
    console.error('Failed to load app data:', error);
    return defaultData;
  }
}

export async function saveAppData(data: AppData): Promise<void> {
  try {
    const currentJson = await AsyncStorage.getItem(STORAGE_KEY);

    if (currentJson) {
      await AsyncStorage.setItem(BACKUP_STORAGE_KEY, currentJson);
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save app data:', error);
  }
}

export async function loadBackupAppData(): Promise<AppData | null> {
  try {
    const json = await AsyncStorage.getItem(BACKUP_STORAGE_KEY);

    if (!json) {
      return null;
    }

    return normalizeAppData(JSON.parse(json) as Partial<AppData>);
  } catch (error) {
    console.error('Failed to load app backup:', error);
    return null;
  }
}

export async function clearAppData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear app data:', error);
  }
}