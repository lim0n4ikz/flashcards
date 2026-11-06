import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  KeyboardAvoidingView,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type ScrollViewInstance,
  type TextInputInstance,
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
  const scrollViewRef = useRef<ScrollViewInstance>(null);
  const russianInputRef = useRef<TextInputInstance>(null);
  const bulkEditorOpenRef = useRef(false);
  const [isBulkEditorVisible, setIsBulkEditorVisible] = useState(false);
  const scrollToInput = useCallback(() => {
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      if (!bulkEditorOpenRef.current) {
        setTimeout(() => {
          scrollToInput();
        }, 100);
      }
    });

    return () => {
      showSubscription.remove();
    };
  }, [scrollToInput]);

  const {
    theme,
    activeProfile,
    activeProfileWords,
    activeProfileWordGroups,
    createWordGroup,
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
  const [addMode, setAddMode] = useState<AddMode>('single');
  const [groupSearch, setGroupSearch] = useState('');
  const [newGroupName, setNewGroupName] = useState('');

  const visibleGroups = useMemo(() => {
    const query = groupSearch.trim().toLowerCase();

    return activeProfileWordGroups.filter((group) =>
      !query || group.name.toLowerCase().includes(query)
    );
  }, [activeProfileWordGroups, groupSearch]);

  const groupOptions = useMemo(
    () => [
      { id: null, label: 'Без группы' },
      ...visibleGroups.map((group) => ({
        id: group.id,
        label: group.name,
      })),
    ],
    [visibleGroups]
  );

  const handleCreateGroup = async () => {
    const trimmedName = newGroupName.trim();

    if (!trimmedName) {
      return;
    }

    const groupId = await createWordGroup(trimmedName);

    if (groupId) {
      setSelectedGroupId(groupId);
      setBulkGroupId(groupId);
    }

    setGroupSearch('');
    setNewGroupName('');
  };

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
            english: match[2].trim(),
            russian: match[1].trim(),
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

  const openBulkEditor = () => {
    bulkEditorOpenRef.current = true;
    setIsBulkEditorVisible(true);
  };

  const closeBulkEditor = () => {
    bulkEditorOpenRef.current = false;
    setIsBulkEditorVisible(false);
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

  const isSingleFormMode = Boolean(editingWord) || addMode === 'single';

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
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        ref={scrollViewRef}
        style={styles.formScroll}
        contentContainerStyle={[
          styles.content,
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
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

        {isSingleFormMode && (
          <>
        <Text
          style={[
            styles.label,
            { color: theme.text },
          ]}
        >
          Группа
        </Text>

        <View style={styles.groupTools}>
          <TextInput
            value={groupSearch}
            onChangeText={setGroupSearch}
            onFocus={scrollToInput}
            placeholder="Поиск групп"
            placeholderTextColor={theme.secondaryText}
            style={[
              styles.groupSearchInput,
              {
                color: theme.text,
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          />
          <View style={styles.createGroupRow}>
            <TextInput
              value={newGroupName}
              onChangeText={setNewGroupName}
              onFocus={scrollToInput}
              placeholder="Новая группа"
              placeholderTextColor={theme.secondaryText}
              style={[
                styles.groupSearchInput,
                styles.createGroupInput,
                {
                  color: theme.text,
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            />
            <TouchableOpacity
              style={[
                styles.createGroupButton,
                {
                  backgroundColor: newGroupName.trim()
                    ? theme.primary
                    : theme.border,
                },
              ]}
              disabled={!newGroupName.trim()}
              onPress={handleCreateGroup}
            >
              <Text
                style={{
                  color: newGroupName.trim()
                    ? theme.primaryText
                    : theme.secondaryText,
                  fontWeight: '700',
                }}
              >
                Создать
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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

        {visibleGroups.length === 0 && (
          <Text style={[styles.groupEmptyText, { color: theme.secondaryText }]}>Группы не найдены</Text>
        )}
          </>
        )}

        {isSingleFormMode && (
          <>
            <Text style={[styles.label, { color: theme.text }]}>
              Слово, термин или вопрос
            </Text>
            <TextInput
              value={english}
              onChangeText={setEnglish}
              placeholder="Например, термин или вопрос"
              placeholderTextColor={theme.secondaryText}
              autoCapitalize="none"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => russianInputRef.current?.focus()}
              onFocus={scrollToInput}
              style={[
                styles.input,
                {
                  backgroundColor: theme.input,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
            />
            <Text style={[styles.label, { color: theme.text }]}>
              Перевод, ответ или определение
            </Text>
            <TextInput
              ref={russianInputRef}
              value={russian}
              onChangeText={setRussian}
              placeholder="Например, перевод или ответ"
              placeholderTextColor={theme.secondaryText}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
              onFocus={scrollToInput}
              style={[
                styles.input,
                {
                  backgroundColor: theme.input,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
            />
            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: canAdd ? theme.primary : theme.border },
              ]}
              disabled={!canAdd}
              onPress={handleAdd}
            >
              <Text
                style={[
                  styles.addButtonText,
                  { color: canAdd ? theme.primaryText : theme.secondaryText },
                ]}
              >
                {editingWord ? 'Сохранить изменения' : 'Добавить слово'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {!editingWord && addMode === 'bulk' && (
          <View style={styles.bulkWrap}>
            <Text style={[styles.bulkLabel, { color: theme.text }]}>Добавить в группу</Text>
            <View style={styles.groupTools}>
              <TextInput
                value={groupSearch}
                onChangeText={setGroupSearch}
                onFocus={scrollToInput}
                placeholder="Поиск групп"
                placeholderTextColor={theme.secondaryText}
                style={[
                  styles.groupSearchInput,
                  {
                    color: theme.text,
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
              />
              <View style={styles.createGroupRow}>
                <TextInput
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                  onFocus={scrollToInput}
                  placeholder="Новая группа"
                  placeholderTextColor={theme.secondaryText}
                  style={[
                    styles.groupSearchInput,
                    styles.createGroupInput,
                    {
                      color: theme.text,
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                  />
                <TouchableOpacity
                  style={[
                    styles.createGroupButton,
                    {
                      backgroundColor: newGroupName.trim()
                        ? theme.primary
                        : theme.border,
                    },
                  ]}
                  disabled={!newGroupName.trim()}
                  onPress={handleCreateGroup}
                >
                  <Text
                    style={{
                      color: newGroupName.trim()
                        ? theme.primaryText
                        : theme.secondaryText,
                      fontWeight: '700',
                    }}
                  >
                    Создать
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.groupWrap}>
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
            </View>

            <View style={styles.inputHeader}>
              <Text style={[styles.bulkHint, { color: theme.secondaryText }]}>Одна пара на строку</Text>
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
            <Text style={[styles.bulkHintExample, { color: theme.secondaryText }]}>
              Пример: вопрос {bulkDelimiter} ответ
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={openBulkEditor}
              style={[
                styles.bulkInputPreview,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text
                numberOfLines={5}
                style={[
                  styles.bulkInputPreviewText,
                  {
                    color: bulkWordsText.trim()
                      ? theme.text
                      : theme.secondaryText,
                  },
                ]}
              >
                {bulkWordsText.trim() ||
                  `Вопрос ${bulkDelimiter} ответ\nТермин ${bulkDelimiter} определение`}
              </Text>
              <Text style={[styles.bulkInputEditHint, { color: theme.primary }]}>
                Нажмите, чтобы открыть редактор
              </Text>
            </TouchableOpacity>
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
      </KeyboardAvoidingView>
      <Modal
        visible={isBulkEditorVisible}
        animationType="slide"
        onRequestClose={closeBulkEditor}
      >
        <SafeAreaView
          style={[
            styles.bulkEditorContainer,
            { backgroundColor: theme.background },
          ]}
        >
          <KeyboardAvoidingView
            style={styles.bulkEditorKeyboardAvoiding}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.bulkEditorHeader}>
              <Text style={[styles.bulkEditorTitle, { color: theme.text }]}>
                Список слов
              </Text>
              <TouchableOpacity
                onPress={closeBulkEditor}
                style={[
                  styles.bulkEditorDoneButton,
                  { backgroundColor: theme.primary },
                ]}
              >
                <Text
                  style={[
                    styles.bulkEditorDoneText,
                    { color: theme.primaryText },
                  ]}
                >
                  Готово
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              autoFocus
              value={bulkWordsText}
              onChangeText={setBulkWordsText}
              placeholder={`Вопрос ${bulkDelimiter} ответ\nТермин ${bulkDelimiter} определение`}
              placeholderTextColor={theme.secondaryText}
              multiline
              scrollEnabled
              textAlignVertical="top"
              style={[
                styles.bulkEditorInput,
                {
                  color: theme.text,
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  formScroll: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 12,
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

  groupTools: {
    gap: 8,
    marginBottom: 10,
  },

  groupSearchInput: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
  },

  createGroupRow: {
    flexDirection: 'row',
    gap: 8,
  },

  createGroupInput: {
    flex: 1,
  },

  createGroupButton: {
    minWidth: 92,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  groupEmptyText: {
    fontSize: 13,
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
    marginTop: 0,
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

  bulkInputPreview: {
    minHeight: 110,
    maxHeight: 180,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },

  bulkInputPreviewText: {
    fontSize: 15,
    lineHeight: 22,
  },

  bulkInputEditHint: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },

  bulkEditorContainer: {
    flex: 1,
  },

  bulkEditorKeyboardAvoiding: {
    flex: 1,
    padding: 16,
  },

  bulkEditorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  bulkEditorTitle: {
    fontSize: 22,
    fontWeight: '800',
  },

  bulkEditorDoneButton: {
    minHeight: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  bulkEditorDoneText: {
    fontSize: 14,
    fontWeight: '700',
  },

  bulkEditorInput: {
    flex: 1,
    minHeight: 0,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    lineHeight: 22,
  },

  bulkLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },

  input: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 17,
    marginBottom: 8,
  },

  addButton: {
    minHeight: 48,
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