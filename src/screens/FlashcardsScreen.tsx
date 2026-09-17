import React, { useEffect, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';

type FlashcardsRouteProp = RouteProp<
  RootStackParamList,
  'Flashcards'
>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApp } from '../context/AppContext';
import FlipCard from '../components/FlipCard';

export default function FlashcardsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<FlashcardsRouteProp>();
  const mode = route.params?.mode ?? 'all';
  const groupId = route.params?.groupId ?? null;

  const {
    theme,
    activeProfileWords,
    activeProfileWordGroups,
    markWordRemembered,
    markWordNeedsReview,
  } = useApp();

  const [deckWords, setDeckWords] = useState<typeof activeProfileWords>([]);
  const [learningDirection, setLearningDirection] = useState<
    'english' | 'russian'
  >('english');

  const groupName =
    groupId === null
      ? 'Все слова'
      : activeProfileWordGroups.find((group) => group.id === groupId)?.name ?? 'Группа';

  const sourceWords = useMemo(() => {
    const filteredByGroup =
      groupId === null
        ? activeProfileWords
        : activeProfileWords.filter(
            (word) => word.groupId === groupId
          );

    if (mode === 'needsReview') {
      return filteredByGroup.filter(
        (word) => word.status === 'needsReview'
      );
    }

    if (mode === 'new') {
      return filteredByGroup.filter((word) => word.status === 'new');
    }

    if (mode === 'remembered') {
      return filteredByGroup.filter(
        (word) => word.status === 'remembered'
      );
    }

    return filteredByGroup;
  }, [activeProfileWords, groupId, mode]);

  const filteredWords =
    groupId === null
      ? activeProfileWords
      : activeProfileWords.filter((word) => word.groupId === groupId);
  const allWordsRemembered =
    mode === 'needsReview' &&
    filteredWords.length > 0 &&
    filteredWords.every((word) => word.status === 'remembered');

  useEffect(() => {
    setDeckWords(sourceWords);
    setCurrentIndex((index) =>
      sourceWords.length === 0
        ? 0
        : Math.min(index, sourceWords.length - 1)
    );
  }, [sourceWords]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const learningWords = deckWords;
  const currentWord = learningWords[currentIndex];

  const nextCard = () => {
    if (learningWords.length <= 1) {
      return;
    }

    setCurrentIndex((index) => {
      if (index >= learningWords.length - 1) {
        return 0;
      }

      return index + 1;
    });
  };

  const prevCard = () => {
    if (learningWords.length <= 1) {
      return;
    }

    setCurrentIndex((index) => {
      if (index <= 0) {
        return learningWords.length - 1;
      }

      return index - 1;
    });
  };

  const shuffleCards = () => {
    if (learningWords.length <= 1) {
      return;
    }

    const next = [...learningWords];

    for (let i = next.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }

    setDeckWords(next);
    setCurrentIndex(0);
  };

  const handleRemembered = async () => {
    if (!currentWord) {
      return;
    }

    const wordId = currentWord.id;
    nextCard();
    await markWordRemembered(wordId);
  };

  const handleNeedsReview = async () => {
    if (!currentWord) {
      return;
    }

    const wordId = currentWord.id;
    nextCard();
    await markWordNeedsReview(wordId);
  };

  if (allWordsRemembered) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: theme.success }]}>
            Все слова запомнены
          </Text>

          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
            В этой группе больше нет незапомненных слов.
          </Text>

          <View style={styles.emptyActions}>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: theme.primary }]}
              onPress={() =>
                navigation.navigate('MainTabs', { screen: 'Learn' })
              }
            >
              <Text style={[styles.emptyButtonText, { color: theme.primaryText }]}>
                Вернуться к разделу обучение
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.emptyButton, { borderColor: theme.border }]}
              onPress={() =>
                navigation.replace('Flashcards', {
                  mode: 'remembered',
                  groupId,
                })
              }
            >
              <Text style={[styles.emptyButtonText, { color: theme.text }]}>
                Повторить запомненные слова
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (activeProfileWords.length === 0 || sourceWords.length === 0) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.background },
        ]}
      >
        <View style={styles.empty}>
          <Text
            style={[
              styles.emptyTitle,
              { color: theme.text },
            ]}
          >
            {groupId === null
              ? 'В этом профиле пока нет слов'
              : `В группе “${groupName}” пока нет слов`}
          </Text>

          <Text
            style={[
              styles.emptyText,
              { color: theme.secondaryText },
            ]}
          >
            Сначала добавь слова в эту группу или выбери другую.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentWord) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.background },
        ]}
      >
        <View style={styles.empty}>
          <Text
            style={[
              styles.emptyTitle,
              { color: theme.success },
            ]}
          >
            🎉 Все слова в этой подборке запомнены!
          </Text>

          <Text
            style={[
              styles.emptyText,
              { color: theme.secondaryText },
            ]}
          >
            Отличная работа. Можно вернуться и выбрать другую группу.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: theme.text },
          ]}
        >
          {groupName}
        </Text>

        <View style={styles.modeToggle}>
          {(['english', 'russian'] as const).map((direction) => (
            <TouchableOpacity
              key={direction}
              style={[
                styles.modeButton,
                {
                  backgroundColor:
                    learningDirection === direction
                      ? theme.primary
                      : theme.card,
                  borderColor:
                    learningDirection === direction
                      ? theme.primary
                      : theme.border,
                },
              ]}
              onPress={() => setLearningDirection(direction)}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  {
                    color:
                      learningDirection === direction
                        ? theme.primaryText
                        : theme.text,
                  },
                ]}
              >
                {direction === 'english' ? 'EN → RU' : 'RU → EN'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text
          style={[
            styles.counter,
            { color: theme.secondaryText },
          ]}
        >
          {currentIndex + 1} / {learningWords.length}
        </Text>

        <View style={styles.cardContainer}>
          <FlipCard
            key={`${currentWord.id}-${learningDirection}`}
            english={currentWord.english}
            russian={currentWord.russian}
            frontLanguage={learningDirection}
          />
        </View>

        <View style={styles.deckControls}>
          <TouchableOpacity
            style={[
              styles.arrowButton,
              { borderColor: theme.border, backgroundColor: theme.card },
            ]}
            onPress={prevCard}
          >
            <Text style={[styles.arrowText, { color: theme.text }]}>←</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.shuffleButton,
              { backgroundColor: theme.primary },
            ]}
            onPress={shuffleCards}
          >
            <Text style={[styles.shuffleText, { color: theme.primaryText }]}>Перемешать</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.arrowButton,
              { borderColor: theme.border, backgroundColor: theme.card },
            ]}
            onPress={nextCard}
          >
            <Text style={[styles.arrowText, { color: theme.text }]}>→</Text>
          </TouchableOpacity>
        </View>

        <Text
          style={[
            styles.instruction,
            { color: theme.secondaryText },
          ]}
        >
          {learningDirection === 'english'
            ? 'Сначала попробуй вспомнить перевод'
            : 'Сначала попробуй вспомнить слово'}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.reviewButton,
              { borderColor: theme.danger },
            ]}
            onPress={handleNeedsReview}
          >
            <Text
              style={[
                styles.actionText,
                { color: theme.danger },
              ]}
            >
              ↻ Не запомнил
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.success },
            ]}
            onPress={handleRemembered}
          >
            <Text
              style={[
                styles.actionText,
                { color: '#FFFFFF' },
              ]}
            >
              ✓ Запомнил
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
    flex: 1,
    padding: 20,
    paddingTop: 36,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    marginTop: 8,
  },

  modeToggle: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },

  modeButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modeButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },

  counter: {
    fontSize: 15,
    marginTop: 6,
  },

  deckControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },

  arrowButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrowText: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 26,
  },

  shuffleButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  shuffleText: {
    fontSize: 15,
    fontWeight: '700',
  },

  cardContainer: {
    marginTop: 22,
  },

  instruction: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 18,
  },

  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },

  actionButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  reviewButton: {
    borderWidth: 1,
  },

  actionText: {
    fontSize: 15,
    fontWeight: '700',
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  emptyTitle: {
    fontSize: 23,
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 12,
  },

  emptyActions: {
    width: '100%',
    gap: 12,
    marginTop: 24,
  },

  emptyButton: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  emptyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});