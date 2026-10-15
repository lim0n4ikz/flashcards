import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { AppData } from '../types';

export const DOWNLOADS_DIRECTORY_KEY = '@flashcards/downloads-directory';

export interface ImportedWord {
  english: string;
  russian: string;
  groupName?: string;
}

function escapeCsv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      values.push(value);
      value = '';
    } else {
      value += character;
    }
  }

  values.push(value);
  return values;
}

export function createJsonBackup(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function createWordsCsv(
  data: AppData,
  profileId: string,
  groupId: string | null | 'all' = 'all'
): string {
  const rows = ['english,russian,group'];

  const exportedWords = data.words
    .filter(
      (word) =>
        word.profileId === profileId &&
        (groupId === 'all' || word.groupId === groupId)
    );

  exportedWords.forEach((word) => {
    const group = data.wordGroups.find((item) => item.id === word.groupId);

    rows.push(
      [word.english, word.russian, group?.name ?? '']
        .map(escapeCsv)
        .join(',')
    );
  });

  const exportedGroupIds = new Set(
    exportedWords.map((word) => word.groupId).filter(Boolean)
  );
  data.wordGroups
    .filter(
      (group) =>
        group.profileId === profileId &&
        (groupId === 'all' || group.id === groupId) &&
        !exportedGroupIds.has(group.id)
    )
    .forEach((group) =>
      rows.push(['', '', group.name].map(escapeCsv).join(','))
    );

  return `\uFEFF${rows.join('\n')}`;
}

export function parseImportedFile(
  content: string,
  fileName?: string
):
  | { type: 'json'; data: AppData }
  | { type: 'csv'; words: ImportedWord[]; groupNames: string[] } {
  const trimmedContent = content.trim();
  const looksLikeJson =
    fileName?.toLowerCase().endsWith('.json') ||
    trimmedContent.startsWith('{');

  if (looksLikeJson) {
    const parsed = JSON.parse(trimmedContent) as AppData;

    if (
      !Array.isArray(parsed.profiles) ||
      !Array.isArray(parsed.wordGroups) ||
      !Array.isArray(parsed.words)
    ) {
      throw new Error('Некорректный JSON-бэкап.');
    }

    return { type: 'json', data: parsed };
  }

  const lines = trimmedContent
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error('CSV-файл не содержит слов или групп.');
  }

  const header = parseCsvLine(lines[0]).map((item) =>
    item.trim().toLowerCase()
  );
  const englishIndex = header.indexOf('english');
  const russianIndex = header.indexOf('russian');
  const groupIndex = header.indexOf('group');

  if (englishIndex === -1 || russianIndex === -1) {
    const words = lines.flatMap((line) => {
      const match = line.match(/^(.*?)\s*-\s*(.*)$/);

      if (!match?.[1]?.trim() || !match[2]?.trim()) {
        return [];
      }

      return [
        {
          english: match[1].trim(),
          russian: match[2].trim(),
        },
      ];
    });

    if (!words.length) {
      throw new Error(
        'Текст должен содержать строки вида: apple - яблоко.'
      );
    }

    return { type: 'csv', words, groupNames: [] };
  }

  const groupNames = new Set<string>();
  const words = lines.slice(1).flatMap((line) => {
    const values = parseCsvLine(line);
    const english = values[englishIndex]?.trim();
    const russian = values[russianIndex]?.trim();
    const groupName =
      groupIndex === -1 ? undefined : values[groupIndex]?.trim();

    if (groupName) {
      groupNames.add(groupName);
    }

    if (!english || !russian) {
      return [];
    }

    return [
      {
        english,
        russian,
        groupName: groupName || undefined,
      },
    ];
  });

  if (!words.length && !groupNames.size) {
    throw new Error('CSV-файл не содержит корректных слов.');
  }

  return { type: 'csv', words, groupNames: [...groupNames] };
}

export async function saveTextFile(
  content: string,
  fileName: string,
  mimeType: string
): Promise<string> {
  const saveToAppDownloads = async (): Promise<string> => {
    if (!FileSystem.documentDirectory) {
      throw new Error('Хранилище файлов недоступно.');
    }

    const downloadsDir = `${FileSystem.documentDirectory}downloads/`;

    await FileSystem.makeDirectoryAsync(downloadsDir, {
      intermediates: true,
    });

    const uri = `${downloadsDir}${fileName}`;

    await FileSystem.writeAsStringAsync(uri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return uri;
  };

  if (Platform.OS === 'android') {
    const { StorageAccessFramework } = FileSystem;

    try {
      let directoryUri = await AsyncStorage.getItem(
        DOWNLOADS_DIRECTORY_KEY
      );

      if (!directoryUri) {
        const permission =
          await StorageAccessFramework.requestDirectoryPermissionsAsync(
            StorageAccessFramework.getUriForDirectoryInRoot('Download')
          );

        if (!permission.granted) {
          return saveToAppDownloads();
        }

        directoryUri = permission.directoryUri;
        await AsyncStorage.setItem(
          DOWNLOADS_DIRECTORY_KEY,
          directoryUri
        );
      }

      const fileNameWithoutExtension = fileName.replace(/\.[^.]+$/, '');
      const uri = await StorageAccessFramework.createFileAsync(
        directoryUri,
        fileNameWithoutExtension,
        mimeType
      );

      await FileSystem.writeAsStringAsync(uri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      return uri;
    } catch (_error) {
      return saveToAppDownloads();
    }
  }

  return saveToAppDownloads();
}

export async function shareTextFile(
  content: string,
  fileName: string,
  mimeType: string
): Promise<void> {
  if (!FileSystem.cacheDirectory) {
    throw new Error('Временное хранилище файлов недоступно.');
  }

  const uri = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(uri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (typeof Sharing?.isAvailableAsync !== 'function') {
    throw new Error('Системный обмен файлами недоступен.');
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Системный обмен файлами недоступен.');
  }

  await Sharing.shareAsync(uri, {
    mimeType,
    dialogTitle: 'Экспорт слов',
  });
}
