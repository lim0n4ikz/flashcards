import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootTabParamList = {
  Home: undefined;
  Learn: undefined;
  Flashcards: undefined;
  Words: undefined;
  Stats: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<RootTabParamList>;
  Profiles: undefined;
  ProfileForm: undefined;
  WordForm: {
    groupId?: string | null;
    wordId?: string;
  } | undefined;
  Flashcards: {
    mode?: 'all' | 'needsReview' | 'new' | 'remembered';
    groupId?: string | null;
  };
};