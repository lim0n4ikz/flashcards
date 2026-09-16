export type ThemeMode = 'light' | 'dark';

export type WordStatus = 'new' | 'remembered' | 'needsReview';

export interface Profile {
  id: string;
  name: string;
  createdAt: string;
}

export interface WordGroup {
  id: string;
  profileId: string;
  name: string;
  createdAt: string;
}

export interface Word {
  id: string;
  profileId: string;
  groupId: string | null;
  english: string;
  russian: string;
  status: WordStatus;
  createdAt: string;
  reviewCount: number;
}

export interface AppSettings {
  theme: ThemeMode;
}

export interface AppData {
  profiles: Profile[];
  wordGroups: WordGroup[];
  words: Word[];
  settings: AppSettings;
  activeProfileId: string | null;
}