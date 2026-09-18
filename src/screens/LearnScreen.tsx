import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApp } from '../context/AppContext';

export default function LearnScreen() {
  const navigation = useNavigation<NavigationProp>();

  const {
    theme,
    activeProfileWords,
    activeProfileWordGroups,
  } = useApp();

  const totalWords = activeProfileWords.length;

  const newWords = activeProfileWords.filter(
    (word) => word.status === 'new'
  ).length;

  const needsReview = activeProfileWords.filter(
    (word) => word.status === 'needsReview'
  ).length;

  const remembered = activeProfileWords.filter(
    (word) => word.status === 'remembered'
  ).length;

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.text }]}>
          Обучение
        </Text>

        <Text
          style={[
            styles.subtitle,
            { color: theme.secondaryText },
          ]}
        >
          Выбери, что хочешь повторить
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('Flashcards', { mode: 'all' })}
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={styles.icon}>📚</Text>

          <View style={styles.cardContent}>
            <Text
              style={[
                styles.cardTitle,
                { color: theme.text },
              ]}
            >
              Все слова
            </Text>

            <Text
              style={[
                styles.cardDescription,
                { color: theme.secondaryText },
              ]}
            >
              Все слова твоего профиля
            </Text>
          </View>

          <Text
            style={[
              styles.count,
              { color: theme.primary },
            ]}
          >
            {totalWords}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate('Flashcards', { mode: 'needsReview' })
          }
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={styles.icon}>🔄</Text>

          <View style={styles.cardContent}>
            <Text
              style={[
                styles.cardTitle,
                { color: theme.text },
              ]}
            >
              Повторить незапомненные
            </Text>

            <Text
              style={[
                styles.cardDescription,
                { color: theme.secondaryText },
              ]}
            >
              Слова, которые требуют повторения
            </Text>
          </View>

          <Text
            style={[
              styles.count,
              { color: theme.primary },
            ]}
          >
            {needsReview}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate('Flashcards', {
              mode: 'new',
            })
          }
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={styles.icon}>🆕</Text>

          <View style={styles.cardContent}>
            <Text
              style={[
                styles.cardTitle,
                { color: theme.text },
              ]}
            >
              Новые слова
            </Text>

            <Text
              style={[
                styles.cardDescription,
                { color: theme.secondaryText },
              ]}
            >
              Слова, которые ещё не изучались
            </Text>
          </View>

          <Text
            style={[
              styles.count,
              { color: theme.primary },
            ]}
          >
            {newWords}
          </Text>
        </TouchableOpacity>

        {activeProfileWordGroups.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Группы слов
            </Text>

            {activeProfileWordGroups.map((group) => {
              const groupWords = activeProfileWords.filter(
                (word) => word.groupId === group.id
              );
              const groupNeedsReview = groupWords.filter(
                (word) => word.status === 'needsReview'
              ).length;

              return (
                <View
                  key={group.id}
                  style={[
                    styles.groupCard,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('Flashcards', {
                        mode: 'all',
                        groupId: group.id,
                      })
                    }
                    style={styles.groupMainAction}
                  >
                    <Text style={styles.icon}>🗂️</Text>

                    <View style={styles.cardContent}>
                      <Text
                        style={[
                          styles.cardTitle,
                          { color: theme.text },
                        ]}
                      >
                        {group.name}
                      </Text>

                      <Text
                        style={[
                          styles.cardDescription,
                          { color: theme.secondaryText },
                        ]}
                      >
                        {groupWords.filter((word) => word.status === 'new').length} новых ·{' '}
                        {groupNeedsReview} на повторение
                      </Text>
                    </View>

                    <View style={styles.groupMetaBox}>
                      <Text
                        style={[
                          styles.count,
                          { color: theme.primary },
                        ]}
                      >
                        {groupWords.length}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.groupActions}>
                    <TouchableOpacity
                      style={[
                        styles.groupActionButton,
                        { backgroundColor: theme.background, borderColor: theme.border },
                      ]}
                      onPress={() =>
                        navigation.navigate('Flashcards', {
                          mode: 'all',
                          groupId: group.id,
                        })
                      }
                    >
                      <Text style={[styles.groupActionText, { color: theme.text }]}>Повторить все</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.groupActionButton,
                        { backgroundColor: theme.background, borderColor: theme.border },
                      ]}
                      onPress={() =>
                        navigation.navigate('Flashcards', {
                          mode: 'needsReview',
                          groupId: group.id,
                        })
                      }
                    >
                      <Text style={[styles.groupActionText, { color: theme.primary }]}>Повторить незапомненные</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View
          style={[
            styles.stats,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text
            style={[
              styles.statsTitle,
              { color: theme.text },
            ]}
          >
            Текущий прогресс
          </Text>

          <Text
            style={[
              styles.statsText,
              { color: theme.secondaryText },
            ]}
          >
            🟢 Запомнено: {remembered}
          </Text>

          <Text
            style={[
              styles.statsText,
              { color: theme.secondaryText },
            ]}
          >
            🔄 На повторение: {needsReview}
          </Text>

          <Text
            style={[
              styles.statsText,
              { color: theme.secondaryText },
            ]}
          >
            🆕 Новых: {newWords}
          </Text>
        </View>
      </ScrollView>
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
    fontSize: 16,
    marginBottom: 24,
  },

  sectionBlock: {
    marginTop: 8,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },

  groupCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
  },

  groupMainAction: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
  },

  groupActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },

  groupActionButton: {
    flex: 1,
    minHeight: 38,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  groupActionText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },

  groupMetaBox: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  card: {
    minHeight: 86,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  icon: {
    fontSize: 30,
    marginRight: 14,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 5,
  },

  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
  },

  count: {
    fontSize: 24,
    fontWeight: '800',
    marginLeft: 10,
  },

  stats: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },

  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },

  statsText: {
    fontSize: 15,
    marginBottom: 7,
  },
});