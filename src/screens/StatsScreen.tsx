import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { useApp } from '../context/AppContext';
import type { RootTabParamList } from '../navigation/types';

type NavigationProp = BottomTabNavigationProp<RootTabParamList>;

export default function StatsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {
    theme,
    activeProfileWords,
    activeProfile,
  } = useApp();

  const stats = useMemo(() => {
    const total = activeProfileWords.length;

    const remembered = activeProfileWords.filter(
      (word) => word.status === 'remembered'
    ).length;

    const needsReview = activeProfileWords.filter(
      (word) => word.status === 'needsReview'
    ).length;

    const newWords = activeProfileWords.filter(
      (word) => word.status === 'new'
    ).length;

    const progress =
      total > 0
        ? Math.round((remembered / total) * 100)
        : 0;

    return {
      total,
      remembered,
      needsReview,
      newWords,
      progress,
    };
  }, [activeProfileWords]);

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {
              color: theme.text,
            },
          ]}
        >
          Статистика
        </Text>

        {activeProfile && (
          <Text
            style={[
              styles.subtitle,
              {
                color: theme.secondaryText,
              },
            ]}
          >
            Профиль: {activeProfile.name}
          </Text>
        )}

        <View
          style={[
            styles.progressCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text
            style={[
              styles.progressTitle,
              {
                color: theme.text,
              },
            ]}
          >
            Общий прогресс
          </Text>

          <Text
            style={[
              styles.progressValue,
              {
                color: theme.primary,
              },
            ]}
          >
            {stats.progress}%
          </Text>

          <View
            style={[
              styles.progressBackground,
              {
                backgroundColor: theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.progress,
                {
                  backgroundColor: theme.primary,
                  width: `${stats.progress}%`,
                },
              ]}
            />
          </View>

          <Text
            style={[
              styles.progressDescription,
              {
                color: theme.secondaryText,
              },
            ]}
          >
            {stats.remembered} из {stats.total} слов запомнено
          </Text>
        </View>

        <View style={styles.grid}>
          <TouchableOpacity
            style={[
              styles.statCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
              onPress={() => navigation.navigate('Words', { filter: 'all' })}
          >
            <Text style={styles.icon}>📚</Text>

            <Text
              style={[
                styles.statValue,
                {
                  color: theme.text,
                },
              ]}
            >
              {stats.total}
            </Text>

            <Text
              style={[
                styles.statLabel,
                {
                  color: theme.secondaryText,
                },
              ]}
            >
              Всего слов
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
              onPress={() => navigation.navigate('Words', { filter: 'new' })}
          >
            <Text style={styles.icon}>🆕</Text>

            <Text
              style={[
                styles.statValue,
                {
                  color: theme.text,
                },
              ]}
            >
              {stats.newWords}
            </Text>

            <Text
              style={[
                styles.statLabel,
                {
                  color: theme.secondaryText,
                },
              ]}
            >
              Новых
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
              onPress={() => navigation.navigate('Words', { filter: 'needsReview' })}
          >
            <Text style={styles.icon}>🔄</Text>

            <Text
              style={[
                styles.statValue,
                {
                  color: theme.text,
                },
              ]}
            >
              {stats.needsReview}
            </Text>

            <Text
              style={[
                styles.statLabel,
                {
                  color: theme.secondaryText,
                },
              ]}
            >
              На повторение
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={() => navigation.navigate('Words', { filter: 'remembered' })}
          >
            <Text style={styles.icon}>✅</Text>

            <Text
              style={[
                styles.statValue,
                {
                  color: theme.success,
                },
              ]}
            >
              {stats.remembered}
            </Text>

            <Text
              style={[
                styles.statLabel,
                {
                  color: theme.secondaryText,
                },
              ]}
            >
              Запомнено
            </Text>
          </TouchableOpacity>
        </View>
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
    fontSize: 30,
    fontWeight: '800',
    marginTop: 8,
  },

  subtitle: {
    fontSize: 15,
    marginTop: 6,
    marginBottom: 20,
  },

  progressCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 22,
  },

  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  progressValue: {
    fontSize: 46,
    fontWeight: '800',
    marginTop: 8,
  },

  progressBackground: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 16,
  },

  progress: {
    height: '100%',
    borderRadius: 5,
  },

  progressDescription: {
    fontSize: 14,
    marginTop: 10,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },

  statCard: {
    width: '48%',
    minHeight: 145,
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    justifyContent: 'center',
  },

  icon: {
    fontSize: 28,
  },

  statValue: {
    fontSize: 30,
    fontWeight: '800',
    marginTop: 8,
  },

  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
});

