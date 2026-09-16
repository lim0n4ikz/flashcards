import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type FilterMode = 'all' | 'new' | 'needsReview' | 'remembered';

export default function WordsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [focusedGroupId, setFocusedGroupId] = useState<string | null>(null);

  const {
    theme,
    activeProfile,
    activeProfileWords,
    activeProfileWordGroups,
    createWordGroup,
    editWordGroup,
    deleteWordGroup,
    deleteWordsByGroup,
    deleteWordsWithoutGroup,
    moveWordsToGroup,
    deleteWord,
    addWord,
  } = useApp();

  const counts = useMemo(
    () => ({
      all: activeProfileWords.length,
      new: activeProfileWords.filter((word) => word.status === 'new').length,
      needsReview: activeProfileWords.filter(
        (word) => word.status === 'needsReview'
      ).length,
      remembered: activeProfileWords.filter(
        (word) => word.status === 'remembered'
      ).length,
    }),
    [activeProfileWords]
  );

  const filteredWords = useMemo(
    () =>
      activeProfileWords.filter((word) => {
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          word.english.toLowerCase().includes(query) ||
          word.russian.toLowerCase().includes(query);
        const matchesFilter = filter === 'all' || word.status === filter;
        const matchesGroup =
          focusedGroupId === null || word.groupId === focusedGroupId;

        return matchesSearch && matchesFilter && matchesGroup;
      }),
    [activeProfileWords, filter, focusedGroupId, search]
  );

  const focusedGroup = activeProfileWordGroups.find(
    (group) => group.id === focusedGroupId
  );

  const ungroupedWordsCount = activeProfileWords.filter(
    (word) => word.groupId === null
  ).length;

  const toggleWordSelection = (wordId: string) => {
    setSelectedWordIds((current) =>
      current.includes(wordId)
        ? current.filter((id) => id !== wordId)
        : [...current, wordId]
    );
  };

  if (!activeProfile) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Сначала создай профиль
          </Text>
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
            Слова будут привязаны к выбранному профилю.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('Profiles')}
          >
            <Text style={[styles.buttonText, { color: theme.primaryText }]}>
              Открыть профили
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Слова</Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
              {activeProfile.name} · {activeProfileWords.length}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('WordForm')}
          >
            <Text style={[styles.addButtonText, { color: theme.primaryText }]}>
              + Добавить
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.groupCreator}>
          <TextInput
            value={newGroupName}
            onChangeText={setNewGroupName}
            placeholder="Новая группа слов"
            placeholderTextColor={theme.secondaryText}
            style={[
              styles.groupInput,
              {
                color: theme.text,
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          />

          <TouchableOpacity
            style={[
              styles.groupCreateButton,
              {
                backgroundColor: newGroupName.trim() ? theme.primary : theme.border,
              },
            ]}
            disabled={!newGroupName.trim()}
            onPress={async () => {
              if (!newGroupName.trim()) {
                return;
              }

              await createWordGroup(newGroupName);
              setNewGroupName('');
            }}
          >
            <Text
              style={[
                styles.groupCreateButtonText,
                {
                  color: newGroupName.trim() ? theme.primaryText : theme.secondaryText,
                },
              ]}
            >
              Создать
            </Text>
          </TouchableOpacity>
        </View>

        {activeProfileWordGroups.length > 0 && (
          <View style={styles.groupList}>
            {activeProfileWordGroups.map((group) => {
              const groupWordsCount = activeProfileWords.filter(
                (word) => word.groupId === group.id
              ).length;
              const isEditing = editingGroupId === group.id;

              return (
                <View
                  key={group.id}
                  style={[
                    styles.groupItem,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  {isEditing ? (
                    <>
                      <TextInput
                        value={editingGroupName}
                        onChangeText={setEditingGroupName}
                        placeholder="Название группы"
                        placeholderTextColor={theme.secondaryText}
                        style={[
                          styles.groupInputInline,
                          {
                            color: theme.text,
                            backgroundColor: theme.background,
                            borderColor: theme.border,
                          },
                        ]}
                      />

                      <View style={styles.groupActionsInline}>
                        <TouchableOpacity
                          onPress={async () => {
                            if (!editingGroupName.trim()) {
                              return;
                            }

                            await editWordGroup(group.id, editingGroupName);
                            setEditingGroupId(null);
                            setEditingGroupName('');
                          }}
                        >
                          <Text style={[styles.inlineAction, { color: theme.primary }]}>
                            Сохранить
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            setEditingGroupId(null);
                            setEditingGroupName('');
                          }}
                        >
                          <Text style={[styles.inlineAction, { color: theme.secondaryText }]}>
                            Отмена
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.groupInfo}
                        onPress={() => {
                          setFocusedGroupId(group.id);
                          setSelectedWordIds([]);
                        }}
                      >
                        <Text style={[styles.groupName, { color: theme.text }]}>
                          {group.name}
                        </Text>
                        <Text style={[styles.groupMeta, { color: theme.secondaryText }]}>
                          {groupWordsCount} слов · нажмите для редактирования
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.groupActionsInline}>
                        <TouchableOpacity
                          onPress={() => {
                            setEditingGroupId(group.id);
                            setEditingGroupName(group.name);
                          }}
                        >
                          <Text style={[styles.inlineAction, { color: theme.primary }]}>
                            Переименовать
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            Alert.alert(
                              'Удалить группу?',
                              `Группа «${group.name}» и все слова в ней будут удалены.`,
                              [
                                { text: 'Отмена', style: 'cancel' },
                                {
                                  text: 'Удалить',
                                  style: 'destructive',
                                  onPress: () => deleteWordGroup(group.id),
                                },
                              ]
                            );
                          }}
                        >
                          <Text style={[styles.inlineAction, { color: theme.danger }]}>
                            Удалить
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            if (groupWordsCount === 0) {
                              return;
                            }

                            Alert.alert(
                              'Удалить слова группы?',
                              `Будут удалены все слова из группы «${group.name}». Сама группа останется.`,
                              [
                                {
                                  text: 'Отмена',
                                  style: 'cancel',
                                },
                                {
                                  text: 'Удалить слова',
                                  style: 'destructive',
                                  onPress: async () => {
                                    await deleteWordsByGroup(group.id);
                                    setSelectedWordIds((current) =>
                                      current.filter(
                                        (wordId) =>
                                          !activeProfileWords.some(
                                            (word) =>
                                              word.id === wordId &&
                                              word.groupId === group.id
                                          )
                                      )
                                    );
                                  },
                                },
                              ]
                            );
                          }}
                        >
                          <Text style={[styles.inlineAction, { color: theme.danger }]}>
                            Очистить слова
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View
          style={[
            styles.ungroupedActions,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.groupInfo}>
            <Text style={[styles.groupName, { color: theme.text }]}>
              Без группы
            </Text>
            <Text style={[styles.groupMeta, { color: theme.secondaryText }]}>
              {ungroupedWordsCount} слов
            </Text>
          </View>

          <TouchableOpacity
            disabled={ungroupedWordsCount === 0}
            onPress={() => {
              Alert.alert(
                'Удалить слова без группы?',
                'Будут удалены все слова, которые не входят ни в одну группу.',
                [
                  {
                    text: 'Отмена',
                    style: 'cancel',
                  },
                  {
                    text: 'Удалить слова',
                    style: 'destructive',
                    onPress: async () => {
                      await deleteWordsWithoutGroup();
                      setSelectedWordIds((current) =>
                        current.filter((wordId) =>
                          activeProfileWords.some(
                            (word) =>
                              word.id === wordId &&
                              word.groupId !== null
                          )
                        )
                      );
                    },
                  },
                ]
              );
            }}
          >
            <Text
              style={[
                styles.inlineAction,
                {
                  color:
                    ungroupedWordsCount === 0
                      ? theme.secondaryText
                      : theme.danger,
                },
              ]}
            >
              Удалить слова
            </Text>
          </TouchableOpacity>
        </View>

        {selectedWordIds.length > 0 && (
          <View style={styles.movePanel}>
            <Text style={[styles.moveTitle, { color: theme.text }]}>
              Переместить выделенные: {selectedWordIds.length}
            </Text>

            <TouchableOpacity
              style={[styles.deleteSelectedButton, { borderColor: theme.danger }]}
              onPress={() => {
                Alert.alert(
                  'Удалить выделенные слова?',
                  `Будут удалены слова: ${selectedWordIds.length}.`,
                  [
                    { text: 'Отмена', style: 'cancel' },
                    {
                      text: 'Удалить',
                      style: 'destructive',
                      onPress: async () => {
                        await Promise.all(
                          selectedWordIds.map((wordId) =>
                            deleteWord(wordId)
                          )
                        );
                        setSelectedWordIds([]);
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={[styles.deleteSelectedText, { color: theme.danger }]}>
                Удалить выделенные
              </Text>
            </TouchableOpacity>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.groupChoice,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
                onPress={async () => {
                  await moveWordsToGroup(selectedWordIds, null);
                  setSelectedWordIds([]);
                }}
              >
                <Text style={[styles.groupChoiceText, { color: theme.text }]}>Без группы</Text>
              </TouchableOpacity>

              {activeProfileWordGroups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={[
                    styles.groupChoice,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                  onPress={async () => {
                    await moveWordsToGroup(selectedWordIds, group.id);
                    setSelectedWordIds([]);
                  }}
                >
                  <Text style={[styles.groupChoiceText, { color: theme.text }]}>
                    {group.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {focusedGroupId !== null && (
          <View style={styles.focusedGroupBar}>
            <Text style={[styles.moveTitle, { color: theme.text }]}>
              Слова группы: {focusedGroup?.name ?? '...'}
            </Text>
            <View style={styles.focusedGroupActions}>
              <TouchableOpacity
                onPress={() => navigation.navigate('WordForm', { groupId: focusedGroupId })}
              >
                <Text style={[styles.inlineAction, { color: theme.primary }]}>Добавить слово</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFocusedGroupId(null)}>
                <Text style={[styles.inlineAction, { color: theme.secondaryText }]}>Показать все</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.searchContainer}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Поиск по словам"
            placeholderTextColor={theme.secondaryText}
            style={[
              styles.searchInput,
              {
                color: theme.text,
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          />
        </View>

        <View style={styles.filterRow}>
          {(['all', 'new', 'needsReview', 'remembered'] as FilterMode[]).map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === item ? theme.primary : theme.card,
                  borderColor: filter === item ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setFilter(item)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === item ? theme.primaryText : theme.text },
                ]}
              >
                {item === 'all'
                  ? 'Все'
                  : item === 'new'
                    ? 'Новые'
                    : item === 'needsReview'
                      ? 'Повторить'
                      : 'Запомнено'}
                {' '}({counts[item]})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredWords.length === 0 ? (
          <View style={styles.emptyWordsBox}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Слов не найдено
            </Text>
          </View>
        ) : (
          filteredWords.map((item) => (
            <View
              key={item.id}
              style={[
                styles.wordCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.selectionBadge,
                  {
                    backgroundColor: selectedWordIds.includes(item.id)
                      ? theme.primary
                      : theme.background,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => toggleWordSelection(item.id)}
              >
                <Text
                  style={[
                    styles.selectionBadgeText,
                    {
                      color: selectedWordIds.includes(item.id)
                        ? theme.primaryText
                        : theme.text,
                    },
                  ]}
                >
                  {selectedWordIds.includes(item.id) ? '✓' : ''}
                </Text>
              </TouchableOpacity>

              <View style={styles.wordInfo}>
                <Text style={[styles.english, { color: theme.text }]}>
                  {item.english}
                </Text>
                <Text style={[styles.russian, { color: theme.secondaryText }]}>
                  {item.russian}
                </Text>
                <Text style={[styles.groupHint, { color: theme.secondaryText }]}>
                  {item.groupId
                    ? `Группа: ${activeProfileWordGroups.find((group) => group.id === item.groupId)?.name ?? '...'}`
                    : 'Без группы'}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      item.status === 'remembered'
                        ? `${theme.success}20`
                        : item.status === 'needsReview'
                          ? `${theme.danger}20`
                          : `${theme.secondaryText}20`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.status,
                    {
                      color:
                        item.status === 'remembered'
                          ? theme.success
                          : item.status === 'needsReview'
                            ? theme.danger
                            : theme.secondaryText,
                    },
                  ]}
                >
                  {item.status === 'remembered'
                    ? 'Запомнено'
                    : item.status === 'needsReview'
                      ? 'Повторить'
                      : 'Новое'}
                </Text>
              </View>

              <View style={styles.wordActions}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('WordForm', { wordId: item.id })}
                >
                  <Text style={[styles.editWord, { color: theme.primary }]}>Изменить</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      'Удалить слово?',
                      `Слово «${item.english}» будет удалено.`,
                      [
                        { text: 'Отмена', style: 'cancel' },
                        {
                          text: 'Удалить',
                          style: 'destructive',
                          onPress: () => deleteWord(item.id),
                        },
                      ]
                    );
                  }}
                >
                  <Text style={[styles.delete, { color: theme.danger }]}>Удалить</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 36,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  addButton: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  groupCreator: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  groupInput: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  groupCreateButton: {
    minWidth: 96,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  groupCreateButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  bulkWrap: {
    marginBottom: 16,
  },
  bulkTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  bulkInput: {
    minHeight: 96,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  bulkActions: {
    marginTop: 10,
    gap: 10,
  },
  bulkAddButton: {
    minHeight: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulkAddButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  groupList: {
    gap: 10,
    marginBottom: 16,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  ungroupedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
  },
  groupMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  groupInputInline: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  groupActionsInline: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  inlineAction: {
    fontSize: 12,
    fontWeight: '700',
  },
  movePanel: {
    marginBottom: 16,
    gap: 10,
  },

  deleteSelectedButton: {
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 10,
  },

  deleteSelectedText: {
    fontSize: 13,
    fontWeight: '700',
  },

  focusedGroupBar: {
    borderBottomWidth: 1,
    paddingBottom: 12,
    marginBottom: 12,
    gap: 8,
  },

  focusedGroupActions: {
    flexDirection: 'row',
    gap: 14,
  },
  moveTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  groupChoice: {
    borderWidth: 1,
    borderRadius: 999,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  groupChoiceText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyWordsBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    marginTop: 10,
    textAlign: 'center',
  },
  button: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  wordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  selectionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  selectionBadgeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  wordInfo: {
    flex: 1,
  },

  wordActions: {
    alignItems: 'flex-end',
    gap: 8,
    marginLeft: 8,
  },

  editWord: {
    fontSize: 12,
    fontWeight: '700',
  },
  english: {
    fontSize: 16,
    fontWeight: '700',
  },
  russian: {
    fontSize: 15,
    marginTop: 3,
  },
  groupHint: {
    fontSize: 12,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginLeft: 8,
  },
  status: {
    fontSize: 11,
    fontWeight: '700',
  },
  delete: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 10,
  },
});
