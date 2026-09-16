import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { useApp } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';

type WordFormRouteProp = RouteProp<
  RootStackParamList,
  'WordForm'
>;
type AddMode = 'single' | 'bulk';
type BulkDelimiter = '-' | '=' | ':' | '|';

export default function WordFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<WordFormRouteProp>();

  const {
    theme,
    activeProfile,
    activeProfileWords,
    activeProfileWordGroups,
    addWord,
    updateWord,
  } = useApp();

  const editingWord = route.params?.wordId
    ? activeProfileWords.find(
        (word) => word.id === route.params?.wordId
      )
    : undefined;

  const [english, setEnglish] = useState(
    editingWord?.english ?? ''
  );
  const [russian, setRussian] = useState(
    editingWord?.russian ?? ''
  );
  const [selectedGroupId, setSelectedGroupId] = useState<
    string | null
  >(editingWord?.groupId ?? route.params?.groupId ?? null);
  const [bulkWordsText, setBulkWordsText] = useState('');
  const [bulkGroupId, setBulkGroupId] = useState<string | null>(
    route.params?.groupId ?? null
  );
  const [bulkDelimiter, setBulkDelimiter] =
    useState<BulkDelimiter>('-');
  const [addMode, setAddMode] = useState<AddMode>('bulk');

  const groupOptions = useMemo(
    () => [
      { id: null, label: 'Без группы' },
      ...activeProfileWordGroups.map((group) => ({
        id: group.id,
        label: group.name,
      })),
    ],
    [activeProfileWordGroups]
  );

  const handleAdd = async () => {
    if (!english.trim() || !russian.trim()) {
      return;
    }

    if (editingWord) {
      await updateWord(
        editingWord.id,
        english,
        russian,
        selectedGroupId
      );
      navigation.goBack();
      return;
    }

    await addWord(english, russian, selectedGroupId);

    setEnglish('');
    setRussian('');
  };

  const parseBulkWords = (text: string) => {
    const escapedDelimiter = bulkDelimiter.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );

    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .flatMap((line) => {
        const match = line.match(
          new RegExp(`^(.*?)\\s*${escapedDelimiter}\\s*(.*)$`)
        );

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
  };

  const handleBulkAdd = async () => {
    const parsed = parseBulkWords(bulkWordsText);

    for (const item of parsed) {
      await addWord(item.english, item.russian, bulkGroupId);
    }

    if (parsed.length > 0) {
      setBulkWordsText('');
    }
  };

  if (!activeProfile) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.background },
        ]}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>
            Нет активного профиля
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const canAdd =
    english.trim().length > 0 &&
    russian.trim().length > 0;

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: theme.text }]}>
          {editingWord ? 'Сохранить изменения' : 'Добавить слово'}
        </Text>

        <Text
          style={[
            styles.profileText,
            { color: theme.secondaryText },
          ]}
        >
          Профиль: {activeProfile.name}
        </Text>

        {!editingWord && (
          <View style={styles.modeSwitch}>
            {(['single', 'bulk'] as const).map((mode) => {
              const isSelected = addMode === mode;

              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.modeOption,
                    {
                      backgroundColor: isSelected
                        ? theme.primary
                        : theme.card,
                      borderColor: isSelected
                        ? theme.primary
                        : theme.border,
                    },
                  ]}
                  onPress={() => setAddMode(mode)}
                >
                  <Text
                    style={[
                      styles.modeOptionText,
                      {
                        color: isSelected
                          ? theme.primaryText
                          : theme.text,
                      },
                    ]}
                  >
                    {mode === 'single' ? 'Одно слово' : 'Несколько слов'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {(editingWord || addMode === 'single') && (
          <>
        <Text
          style={[
            styles.label,
            { color: theme.text },
          ]}
        >
          Группа
        </Text>

        <View style={styles.groupWrap}>
          {groupOptions.map((group) => {
            const isSelected =
              selectedGroupId === group.id;

            return (
              <TouchableOpacity
                key={group.id ?? 'ungrouped'}
                style={[
                  styles.groupOption,
                  {
                    backgroundColor: isSelected
                      ? theme.primary
                      : theme.card,
                    borderColor: isSelected
                      ? theme.primary
                      : theme.border,
                  },
                ]}
                onPress={() => setSelectedGroupId(group.id)}
              >
                <Text
                  style={[
                    styles.groupOptionText,
                    {
                      color: isSelected
                        ? theme.primaryText
                        : theme.text,
                    },
                  ]}
                >
                  {group.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
          </>
        )}

        {(editingWord || addMode === 'single') && (
          <>
            <Text
              style={[
                styles.label,
                { color: theme.text },
              ]}
            >
              Английское слово
            </Text>

            <TextInput
              value={english}
              onChangeText={setEnglish}
              placeholder="apple"
              placeholderTextColor={theme.secondaryText}
              autoCapitalize="none"
              style={[
                styles.input,
                {
                  backgroundColor: theme.input,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
            />

            <Text
              style={[
                styles.label,
                { color: theme.text },
              ]}
            >
              Перевод
            </Text>

            <TextInput
              value={russian}
              onChangeText={setRussian}
              placeholder="яблоко"
              placeholderTextColor={theme.secondaryText}
              style={[
                styles.input,
                {
                  backgroundColor: theme.input,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              onSubmitEditing={handleAdd}
            />
          </>
        )}

        {!editingWord && addMode === 'bulk' && (
          <View style={styles.bulkWrap}>
            <Text style={[styles.bulkTitle, { color: theme.text }]}>Массовый ввод</Text>
            <Text style={[styles.bulkLabel, { color: theme.text }]}>Добавить в группу</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {groupOptions.map((group) => {
                const isSelected = bulkGroupId === group.id;

                return (
                  <TouchableOpacity
                    key={`bulk-${group.id ?? 'ungrouped'}`}
                    style={[
                      styles.groupOption,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.card,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => setBulkGroupId(group.id)}
                  >
                    <Text
                      style={[
                        styles.groupOptionText,
                        { color: isSelected ? theme.primaryText : theme.text },
                      ]}
                    >
                      {group.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.inputHeader}>
              <Text style={[styles.bulkHint, { color: theme.secondaryText }]}>Одно слово на строку</Text>
              <View style={styles.delimiterPicker}>
                <Text style={[styles.delimiterLabel, { color: theme.secondaryText }]}>Разделитель</Text>
                <View style={styles.delimiterWrap}>
                  {(['-', '=', ':', '|'] as const).map((delimiter) => {
                    const isSelected = bulkDelimiter === delimiter;

                    return (
                      <TouchableOpacity
                        key={delimiter}
                        style={[
                          styles.delimiterOption,
                          {
                            backgroundColor: isSelected ? theme.primary : theme.card,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                        onPress={() => setBulkDelimiter(delimiter)}
                      >
                        <Text
                          style={[
                            styles.delimiterText,
                            { color: isSelected ? theme.primaryText : theme.text },
                          ]}
                        >
                          {delimiter}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
            <Text style={[styles.bulkHintExample, { color: theme.secondaryText }]}>Пример: apple {bulkDelimiter} яблоко</Text>
            <TextInput
              value={bulkWordsText}
              onChangeText={setBulkWordsText}
              placeholder={`apple ${bulkDelimiter} яблоко\nbook ${bulkDelimiter} книга`}
              placeholderTextColor={theme.secondaryText}
              multiline
              style={[
                styles.bulkInput,
                {
                  color: theme.text,
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            />

            <TouchableOpacity
              style={[
                styles.addButton,
                {
                  backgroundColor: bulkWordsText.trim()
                    ? theme.primary
                    : theme.border,
                },
              ]}
              disabled={!bulkWordsText.trim()}
              onPress={handleBulkAdd}
            >
              <Text
                style={[
                  styles.addButtonText,
                  {
                    color: bulkWordsText.trim()
                      ? theme.primaryText
                      : theme.secondaryText,
                  },
                ]}
              >
                Добавить список
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {(editingWord || addMode === 'single') && <TouchableOpacity
          style={[
            styles.addButton,
            {
              backgroundColor: canAdd
                ? theme.primary
                : theme.border,
            },
          ]}
          disabled={!canAdd}
          onPress={handleAdd}
        >
          <Text
            style={[
              styles.addButtonText,
              {
                color: canAdd
                  ? theme.primaryText
                  : theme.secondaryText,
              },
            ]}
          >
            Добавить слово
          </Text>
        </TouchableOpacity>}

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.goBack()}
        >
          <Text
            style={[
              styles.doneText,
              { color: theme.primary },
            ]}
          >
            Готово
          </Text>
        </TouchableOpacity>
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
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
  },

  profileText: {
    fontSize: 15,
    marginTop: 6,
    marginBottom: 12,
  },

  modeSwitch: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },

  modeOption: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  modeOptionText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },

  groupWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },

  groupOption: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  groupOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },

  bulkWrap: {
    marginTop: 28,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
  },

  bulkTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  delimiterWrap: {
    flexDirection: 'row',
    gap: 8,
  },

  inputHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },

  delimiterPicker: {
    alignItems: 'flex-end',
  },

  delimiterLabel: {
    fontSize: 12,
    marginBottom: 5,
  },

  delimiterOption: {
    width: 44,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  delimiterText: {
    fontSize: 18,
    fontWeight: '700',
  },

  bulkHint: {
    fontSize: 13,
    flex: 1,
    marginBottom: 4,
  },

  bulkHintExample: {
    fontSize: 12,
    marginBottom: 8,
  },

  bulkInput: {
    minHeight: 110,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },

  bulkLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },

  input: {
    height: 54,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 17,
    marginBottom: 20,
  },

  addButton: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },

  doneButton: {
    alignItems: 'center',
    marginTop: 18,
    padding: 12,
  },

  doneText: {
    fontSize: 16,
    fontWeight: '600',
  },
});