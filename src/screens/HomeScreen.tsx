import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  const {
    theme,
    activeProfile,
    activeProfileWords,
  } = useApp();

  const totalWords = activeProfileWords.length;

  const rememberedWords = activeProfileWords.filter(
    (word) => word.status === 'remembered'
  ).length;

  const progress =
    totalWords > 0 ? Math.round((rememberedWords / totalWords) * 100) : 0;

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>
          Мой английский
        </Text>

        {activeProfile ? (
          <>
            <Text
              style={[
                styles.subtitle,
                { color: theme.secondaryText },
              ]}
            >
              Привет, {activeProfile.name}! 👋
            </Text>

            <TouchableOpacity
              style={[
                styles.card,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('MainTabs', { screen: 'Learn' })
              }
            >
              <Text
                style={[
                  styles.cardTitle,
                  { color: theme.text },
                ]}
              >
                Твои слова
              </Text>

              <Text
                style={[
                  styles.wordCount,
                  { color: theme.primary },
                ]}
              >
                {totalWords}
              </Text>

              <Text
                style={[
                  styles.description,
                  { color: theme.secondaryText },
                ]}
              >
                {totalWords === 0
                  ? 'Добавь первые слова, чтобы начать обучение'
                  : `Запомнено: ${rememberedWords} из ${totalWords}`}
              </Text>

              <View
                style={[
                  styles.progressBackground,
                  { backgroundColor: theme.border },
                ]}
              >
                <View
                  style={[
                    styles.progress,
                    {
                      backgroundColor: theme.primary,
                      width: `${progress}%`,
                    },
                  ]}
                />
              </View>

              <Text
                style={[
                  styles.progressText,
                  { color: theme.secondaryText },
                ]}
              >
                Прогресс: {progress}%
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.emptyTitle,
                { color: theme.text },
              ]}
            >
              Пока нет профиля
            </Text>

            <Text
              style={[
                styles.description,
                { color: theme.secondaryText },
              ]}
            >
              Создай профиль, чтобы начать учить английский.
            </Text>

            <View
              style={[
                styles.button,
                { backgroundColor: theme.primary },
              ]}
              onTouchEnd={() => navigation.navigate('Profiles')}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: theme.primaryText },
                ]}
              >
                + Создать профиль
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingTop: 36,
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 17,
    marginBottom: 24,
  },

  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },

  wordCount: {
    fontSize: 48,
    fontWeight: '800',
  },

  description: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },

  progressBackground: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 20,
  },

  progress: {
    height: '100%',
    borderRadius: 5,
  },

  progressText: {
    fontSize: 14,
    marginTop: 8,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
  },

  button: {
    marginTop: 24,
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});