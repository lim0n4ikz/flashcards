import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootTabParamList = {
  Home: undefined;
  Learn: undefined;
  Flashcards: undefined;
  Words: {
    filter?: 'all' | 'needsReview' | 'new' | 'remembered';
  } | undefined;
  Stats: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<RootTabParamList>;
  Profiles: {
    profileId?: string;
  } | undefined;
  ProfileForm: {
    profileId?: string;
  } | undefined;
  WordForm: {
    groupId?: string | null;
    wordId?: string;
  } | undefined;
  Flashcards: {
    mode?: 'all' | 'needsReview' | 'new' | 'remembered';
    groupId?: string | null;
  };
};