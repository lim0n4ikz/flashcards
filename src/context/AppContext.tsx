import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  AppData,
  AppSettings,
  Profile,
  Word,
  WordGroup,
  WordStatus,
} from '../types';

import {
  loadBackupAppData,
  loadAppData,
  normalizeAppData,
  saveAppData,
} from '../storage/storage';
import { getTheme, type AppTheme } from '../theme/theme';
import type { ImportedWord } from '../storage/backup';

interface AppContextValue {
  data: AppData;
  theme: AppTheme;
  isLoading: boolean;

  activeProfile: Profile | null;
  activeProfileWords: Word[];
  activeProfileWordGroups: WordGroup[];

  createProfile: (name: string) => Promise<void>;
  updateProfile: (profileId: string, name: string) => Promise<void>;
  selectProfile: (profileId: string) => Promise<void>;
  deleteProfile: (profileId: string) => Promise<void>;

  createWordGroup: (name: string) => Promise<void>;
  editWordGroup: (groupId: string, name: string) => Promise<void>;
  deleteWordGroup: (groupId: string) => Promise<void>;
  deleteWordsByGroup: (groupId: string) => Promise<void>;
  deleteWordsWithoutGroup: () => Promise<void>;
  moveWordsToGroup: (
    wordIds: string[],
    groupId: string | null
  ) => Promise<void>;

  addWord: (
    english: string,
    russian: string,
    groupId?: string | null
  ) => Promise<void>;
  updateWord: (
    wordId: string,
    english: string,
    russian: string,
    groupId: string | null
  ) => Promise<void>;
  deleteWord: (wordId: string) => Promise<void>;

  updateWordStatus: (
    wordId: string,
    status: WordStatus
  ) => Promise<void>;

  markWordRemembered: (wordId: string) => Promise<void>;
  markWordNeedsReview: (wordId: string) => Promise<void>;

  setTheme: (theme: AppSettings['theme']) => Promise<void>;

  resetAllData: () => Promise<void>;
  restoreAppData: (nextData: AppData) => Promise<void>;
  restoreLastBackup: () => Promise<boolean>;
  importWords: (words: ImportedWord[]) => Promise<number>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setData] = useState<AppData>({
    profiles: [],
    wordGroups: [],
    words: [],
    settings: {
      theme: 'light',
    },
    activeProfileId: null,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      const savedData = await loadAppData();

      if (mounted) {
        setData(savedData);
        setIsLoading(false);
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  const updateData = useCallback(
    async (updater: (current: AppData) => AppData) => {
      setData((current) => {
        const next = updater(current);

        saveAppData(next).catch((error) => {
          console.error(
            'Failed to save application data:',
            error
          );
        });

        return next;
      });
    },
    []
  );

  const createProfile = useCallback(
    async (name: string) => {
      const trimmedName = name.trim();

      if (!trimmedName) {
        return;
      }

      const profile: Profile = {
        id: `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,
        name: trimmedName,
        createdAt: new Date().toISOString(),
      };

      await updateData((current) => ({
        ...current,
        profiles: [...current.profiles, profile],
        activeProfileId:
          current.activeProfileId ?? profile.id,
      }));
    },
    [updateData]
  );

  const updateProfile = useCallback(
    async (profileId: string, name: string) => {
      const trimmedName = name.trim();

      if (!trimmedName) {
        return;
      }

      await updateData((current) => ({
        ...current,
        profiles: current.profiles.map((profile) =>
          profile.id === profileId
            ? {
                ...profile,
                name: trimmedName,
              }
            : profile
        ),
      }));
    },
    [updateData]
  );

  const selectProfile = useCallback(
    async (profileId: string) => {
      await updateData((current) => ({
        ...current,
        activeProfileId: profileId,
      }));
    },
    [updateData]
  );

  const deleteProfile = useCallback(
    async (profileId: string) => {
      await updateData((current) => {
        const profiles = current.profiles.filter(
          (profile) => profile.id !== profileId
        );

        const wordGroups = current.wordGroups.filter(
          (group) => group.profileId !== profileId
        );

        const words = current.words.filter(
          (word) => word.profileId !== profileId
        );

        let activeProfileId = current.activeProfileId;

        if (activeProfileId === profileId) {
          activeProfileId = profiles[0]?.id ?? null;
        }

        return {
          ...current,
          profiles,
          wordGroups,
          words,
          activeProfileId,
        };
      });
    },
    [updateData]
  );

  const createWordGroup = useCallback(
    async (name: string) => {
      const trimmedName = name.trim();

      if (!trimmedName || !data.activeProfileId) {
        return;
      }

      const wordGroup: WordGroup = {
        id: `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,
        profileId: data.activeProfileId,
        name: trimmedName,
        createdAt: new Date().toISOString(),
      };

      await updateData((current) => ({
        ...current,
        wordGroups: [...current.wordGroups, wordGroup],
      }));
    },
    [data.activeProfileId, updateData]
  );

  const editWordGroup = useCallback(
    async (groupId: string, name: string) => {
      const trimmedName = name.trim();

      if (!trimmedName) {
        return;
      }

      await updateData((current) => ({
        ...current,
        wordGroups: current.wordGroups.map((group) =>
          group.id === groupId
            ? { ...group, name: trimmedName }
            : group
        ),
      }));
    },
    [updateData]
  );

  const deleteWordGroup = useCallback(
    async (groupId: string) => {
      await updateData((current) => ({
        ...current,
        wordGroups: current.wordGroups.filter(
          (group) => group.id !== groupId
        ),
        words: current.words.filter(
          (word) => word.groupId !== groupId
        ),
      }));
    },
    [updateData]
  );

  const deleteWordsByGroup = useCallback(
    async (groupId: string) => {
      await updateData((current) => ({
        ...current,
        words: current.words.filter(
          (word) => word.groupId !== groupId
        ),
      }));
    },
    [updateData]
  );

  const deleteWordsWithoutGroup = useCallback(async () => {
    await updateData((current) => ({
      ...current,
      words: current.words.filter((word) => word.groupId !== null),
    }));
  }, [updateData]);

  const moveWordsToGroup = useCallback(
    async (wordIds: string[], groupId: string | null) => {
      if (!wordIds.length) {
        return;
      }

      await updateData((current) => ({
        ...current,
        words: current.words.map((word) =>
          wordIds.includes(word.id)
            ? { ...word, groupId }
            : word
        ),
      }));
    },
    [updateData]
  );

  const addWord = useCallback(
    async (
      english: string,
      russian: string,
      groupId?: string | null
    ) => {
      const trimmedEnglish = english.trim();
      const trimmedRussian = russian.trim();

      if (!trimmedEnglish || !trimmedRussian) {
        return;
      }

      await updateData((current) => {
        if (!current.activeProfileId) {
          return current;
        }

        const word: Word = {
          id: `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`,
          profileId: current.activeProfileId,
          groupId: groupId ?? null,
          english: trimmedEnglish,
          russian: trimmedRussian,
          status: 'new',
          createdAt: new Date().toISOString(),
          reviewCount: 0,
        };

        return {
          ...current,
          words: [...current.words, word],
        };
      });
    },
    [updateData]
  );

  const deleteWord = useCallback(
    async (wordId: string) => {
      await updateData((current) => ({
        ...current,
        words: current.words.filter(
          (word) => word.id !== wordId
        ),
      }));
    },
    [updateData]
  );

  const updateWord = useCallback(
    async (
      wordId: string,
      english: string,
      russian: string,
      groupId: string | null
    ) => {
      const trimmedEnglish = english.trim();
      const trimmedRussian = russian.trim();

      if (!trimmedEnglish || !trimmedRussian) {
        return;
      }

      await updateData((current) => ({
        ...current,
        words: current.words.map((word) =>
          word.id === wordId
            ? {
                ...word,
                english: trimmedEnglish,
                russian: trimmedRussian,
                groupId,
              }
            : word
        ),
      }));
    },
    [updateData]
  );

  const updateWordStatus = useCallback(
    async (wordId: string, status: WordStatus) => {
      await updateData((current) => ({
        ...current,
        words: current.words.map((word) =>
          word.id === wordId
            ? {
                ...word,
                status,
                reviewCount:
                  status === 'needsReview'
                    ? word.reviewCount + 1
                    : word.reviewCount,
              }
            : word
        ),
      }));
    },
    [updateData]
  );

  const markWordRemembered = useCallback(
    async (wordId: string) => {
      await updateWordStatus(wordId, 'remembered');
    },
    [updateWordStatus]
  );

  const markWordNeedsReview = useCallback(
    async (wordId: string) => {
      await updateWordStatus(wordId, 'needsReview');
    },
    [updateWordStatus]
  );

  const setTheme = useCallback(
    async (theme: AppSettings['theme']) => {
      await updateData((current) => ({
        ...current,
        settings: {
          ...current.settings,
          theme,
        },
      }));
    },
    [updateData]
  );

  const resetAllData = useCallback(async () => {
    const emptyData: AppData = {
      profiles: [],
      wordGroups: [],
      words: [],
      settings: {
        theme: 'light',
      },
      activeProfileId: null,
    };

    await updateData(() => emptyData);
  }, [updateData]);

  const restoreAppData = useCallback(
    async (nextData: AppData) => {
      await updateData(() => normalizeAppData(nextData));
    },
    [updateData]
  );

  const restoreLastBackup = useCallback(async () => {
    const backup = await loadBackupAppData();

    if (!backup) {
      return false;
    }

    await updateData(() => backup);
    return true;
  }, [updateData]);

  const importWords = useCallback(
    async (words: ImportedWord[]) => {
      let importedCount = 0;

      await updateData((current) => {
        if (!current.activeProfileId) {
          return current;
        }

        const profileId = current.activeProfileId;
        const existingKeys = new Set(
          current.words
            .filter((word) => word.profileId === profileId)
            .map(
              (word) =>
                `${word.english.trim().toLowerCase()}\u0000${word.russian
                  .trim()
                  .toLowerCase()}`
            )
        );
        const groupsByName = new Map(
          current.wordGroups
            .filter((group) => group.profileId === profileId)
            .map((group) => [group.name.trim().toLowerCase(), group])
        );
        const newGroups: WordGroup[] = [];
        const newWords: Word[] = [];

        words.forEach((item) => {
          const english = item.english.trim();
          const russian = item.russian.trim();
          const key = `${english.toLowerCase()}\u0000${russian.toLowerCase()}`;

          if (!english || !russian || existingKeys.has(key)) {
            return;
          }

          let groupId: string | null = null;
          const groupName = item.groupName?.trim();

          if (groupName) {
            const groupKey = groupName.toLowerCase();
            let group = groupsByName.get(groupKey);

            if (!group) {
              group = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                profileId,
                name: groupName,
                createdAt: new Date().toISOString(),
              };
              groupsByName.set(groupKey, group);
              newGroups.push(group);
            }

            groupId = group.id;
          }

          existingKeys.add(key);
          importedCount += 1;
          newWords.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            profileId,
            groupId,
            english,
            russian,
            status: 'new' as const,
            createdAt: new Date().toISOString(),
            reviewCount: 0,
          });
        });

        return {
          ...current,
          wordGroups: [...current.wordGroups, ...newGroups],
          words: [...current.words, ...newWords],
        };
      });

      return importedCount;
    },
    [updateData]
  );

  const activeProfile = useMemo(
    () =>
      data.profiles.find(
        (profile) =>
          profile.id === data.activeProfileId
      ) ?? null,
    [data.profiles, data.activeProfileId]
  );

  const activeProfileWordGroups = useMemo(
    () =>
      data.wordGroups.filter(
        (group) => group.profileId === data.activeProfileId
      ),
    [data.wordGroups, data.activeProfileId]
  );

  const activeProfileWords = useMemo(
    () =>
      data.words.filter(
        (word) =>
          word.profileId === data.activeProfileId
      ),
    [data.words, data.activeProfileId]
  );

  const theme = useMemo(
    () => getTheme(data.settings.theme),
    [data.settings.theme]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      theme,
      isLoading,

      activeProfile,
      activeProfileWords,
      activeProfileWordGroups,

      createProfile,
      updateProfile,
      selectProfile,
      deleteProfile,

      createWordGroup,
      editWordGroup,
      deleteWordGroup,
      deleteWordsByGroup,
      deleteWordsWithoutGroup,
      moveWordsToGroup,

      addWord,
      updateWord,
      deleteWord,

      updateWordStatus,
      markWordRemembered,
      markWordNeedsReview,

      setTheme,

      resetAllData,
      restoreAppData,
      restoreLastBackup,
      importWords,
    }),
    [
      data,
      theme,
      isLoading,
      activeProfile,
      activeProfileWords,
      activeProfileWordGroups,
      createProfile,
      updateProfile,
      selectProfile,
      deleteProfile,
      createWordGroup,
      editWordGroup,
      deleteWordGroup,
      deleteWordsByGroup,
      deleteWordsWithoutGroup,
      moveWordsToGroup,
      addWord,
      updateWord,
      deleteWord,
      updateWordStatus,
      markWordRemembered,
      markWordNeedsReview,
      setTheme,
      resetAllData,
      restoreAppData,
      restoreLastBackup,
      importWords,
    ]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      'useApp must be used within AppProvider'
    );
  }

  return context;
}
