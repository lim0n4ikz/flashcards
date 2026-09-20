import React, { useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';
import UpdateModal from '../components/UpdateModal';
import {
  createJsonBackup,
  createWordsCsv,
  parseImportedFile,
  saveTextFile,
  shareTextFile,
} from '../storage/backup';
import {
  checkForUpdate,
  getCurrentVersion,
  type UpdateInfo,
} from '../services/updateService';

type NavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();

  const {
    theme,
    data,
    activeProfile,
    updateProfile,
    setTheme,
    resetAllData,
    restoreAppData,
    restoreLastBackup,
    importWords,
  } = useApp();

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(
    activeProfile?.name ?? ''
  );
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isAllWordsModalVisible, setIsAllWordsModalVisible] = useState(false);

  const handleStartEditing = () => {
    setProfileName(activeProfile?.name ?? '');
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!activeProfile) {
      return;
    }

    const trimmedName = profileName.trim();

    if (!trimmedName) {
      Alert.alert(
        'Ошибка',
        'Имя профиля не может быть пустым.'
      );
      return;
    }

    await updateProfile(activeProfile.id, trimmedName);
    setEditingProfile(false);
  };

  const handleReset = () => {
    Alert.alert(
      'Сбросить все данные?',
      'Будут удалены все профили и все слова. Это действие нельзя отменить.',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Сбросить',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
          },
        },
      ]
    );
  };

  const handleRestoreLastBackup = () => {
    Alert.alert(
      'Восстановить последнюю копию?',
      'Текущие данные будут заменены предыдущей локальной версией.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Восстановить',
          style: 'destructive',
          onPress: async () => {
            const restored = await restoreLastBackup();
            Alert.alert(
              restored ? 'Готово' : 'Копия не найдена',
              restored
                ? 'Последняя локальная копия восстановлена.'
                : 'Автоматическая копия ещё не создана.'
            );
          },
        },
      ]
    );
  };

  const handleCheckUpdates = async () => {
    if (isCheckingUpdate) {
      return;
    }

    setIsCheckingUpdate(true);
    const update = await checkForUpdate();
    setIsCheckingUpdate(false);

    if (update) {
      setUpdateInfo(update);
      return;
    }

    Alert.alert('Обновлений нет', 'Установлена актуальная версия приложения.');
  };

  const getFileName = (extension: string) => {
    const date = new Date().toISOString().slice(0, 10);
    return `flashcards-${date}.${extension}`;
  };

  const handleSaveJson = async () => {
    try {
      await saveTextFile(
        createJsonBackup(data),
        getFileName('json'),
        'application/json'
      );

      Alert.alert(
        'Готово',
        'Файл сохранён в папку Downloads на устройстве.'
      );
    } catch (error) {
      Alert.alert(
        'Не удалось экспортировать данные',
        error instanceof Error ? error.message : 'Попробуйте ещё раз.'
      );
    }
  };

  const handleShareJson = async () => {
    try {
      await shareTextFile(
        createJsonBackup(data),
        getFileName('json'),
        'application/json'
      );
    } catch (error) {
      Alert.alert(
        'Не удалось отправить данные',
        error instanceof Error ? error.message : 'Попробуйте ещё раз.'
      );
    }
  };

  const handleSaveCsv = async () => {
    if (!activeProfile) {
      Alert.alert('Нужен профиль', 'Выберите профиль перед экспортом CSV.');
      return;
    }

    try {
      await saveTextFile(
        createWordsCsv(data, activeProfile.id),
        getFileName('csv'),
        'text/csv'
      );

      Alert.alert(
        'Готово',
        'Файл с словами сохранён в папку Downloads на устройстве.'
      );
    } catch (error) {
      Alert.alert(
        'Не удалось экспортировать слова',
        error instanceof Error ? error.message : 'Попробуйте ещё раз.'
      );
    }
  };

  const handleShareCsv = async () => {
    if (!activeProfile) {
      Alert.alert('Нужен профиль', 'Выберите профиль перед экспортом CSV.');
      return;
    }

    try {
      await shareTextFile(
        createWordsCsv(data, activeProfile.id),
        getFileName('csv'),
        'text/csv'
      );
    } catch (error) {
      Alert.alert(
        'Не удалось отправить слова',
        error instanceof Error ? error.message : 'Попробуйте ещё раз.'
      );
    }
  };

  const handleImportJson = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      const content = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const imported = parseImportedFile(content, asset.name);

      if (imported.type !== 'json') {
        throw new Error('Выберите JSON-файл резервной копии.');
      }

      Alert.alert(
        'Восстановить резервную копию?',
        'Текущие профили, слова и прогресс будут заменены данными из файла.',
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Восстановить',
            style: 'destructive',
            onPress: async () => {
              await restoreAppData(imported.data);
              Alert.alert('Готово', 'Резервная копия восстановлена.');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Не удалось импортировать резервную копию',
        error instanceof Error ? error.message : 'Проверьте формат файла.'
      );
    }
  };

  const handleImportCsv = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      if (!activeProfile) {
        Alert.alert(
          'Нужен профиль',
          'Выберите профиль перед импортом слов из CSV.'
        );
        return;
      }

      const asset = result.assets[0];
      const content = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const imported = parseImportedFile(content, asset.name);

      if (imported.type !== 'csv') {
        throw new Error('Выберите CSV-файл со словами.');
      }

      const importedCount = await importWords(imported.words);
      Alert.alert(
        'Импорт завершён',
        importedCount
          ? `Добавлено слов: ${importedCount}. Дубли пропущены.`
          : 'Новых слов не найдено. Дубли пропущены.'
      );
    } catch (error) {
      Alert.alert(
        'Не удалось импортировать слова',
        error instanceof Error ? error.message : 'Проверьте формат файла.'
      );
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            styles.title,
            {
              color: theme.text,
            },
          ]}
        >
          Настройки
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              color: theme.secondaryText,
            },
          ]}
        >
          Управление приложением
        </Text>

        {/* ПРОФИЛЬ */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.text,
            },
          ]}
        >
          Профиль
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          {activeProfile ? (
            <>
              {!editingProfile ? (
                <View style={styles.profileRow}>
                  <View style={styles.profileInfo}>
                    <Text
                      style={[
                        styles.profileName,
                        {
                          color: theme.text,
                        },
                      ]}
                    >
                      {activeProfile.name}
                    </Text>

                    <Text
                      style={[
                        styles.profileDescription,
                        {
                          color: theme.secondaryText,
                        },
                      ]}
                    >
                      {data.words.filter(
                        (word) =>
                          word.profileId === activeProfile.id
                      ).length}{' '}
                      слов
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.smallButton,
                      {
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={handleStartEditing}
                  >
                    <Text
                      style={[
                        styles.smallButtonText,
                        {
                          color: theme.text,
                        },
                      ]}
                    >
                      Изменить
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Text
                    style={[
                      styles.inputLabel,
                      {
                        color: theme.secondaryText,
                      },
                    ]}
                  >
                    Название профиля
                  </Text>

                  <TextInput
                    value={profileName}
                    onChangeText={setProfileName}
                    placeholder="Введите название"
                    placeholderTextColor={
                      theme.secondaryText
                    }
                    style={[
                      styles.input,
                      {
                        color: theme.text,
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                      },
                    ]}
                    autoFocus
                  />

                  <View style={styles.editButtons}>
                    <TouchableOpacity
                      style={[
                        styles.cancelButton,
                        {
                          borderColor: theme.border,
                        },
                      ]}
                      onPress={() =>
                        setEditingProfile(false)
                      }
                    >
                      <Text
                        style={[
                          styles.cancelButtonText,
                          {
                            color: theme.text,
                          },
                        ]}
                      >
                        Отмена
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.saveButton,
                        {
                          backgroundColor: theme.primary,
                        },
                      ]}
                      onPress={handleSaveProfile}
                    >
                      <Text
                        style={[
                          styles.saveButtonText,
                          {
                            color: theme.primaryText,
                          },
                        ]}
                      >
                        Сохранить
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.menuRow,
                  styles.topBorder,
                  {
                    borderColor: theme.border,
                  },
                ]}
                onPress={() =>
                  navigation.navigate('Profiles')
                }
              >
                <View style={styles.menuText}>
                  <Text
                    style={[
                      styles.menuTitle,
                      {
                        color: theme.text,
                      },
                    ]}
                  >
                    Все профили
                  </Text>

                  <Text
                    style={[
                      styles.menuDescription,
                      {
                        color: theme.secondaryText,
                      },
                    ]}
                  >
                    Создать или выбрать другой профиль
                  </Text>
                </View>

                <Text
                  style={[
                    styles.arrow,
                    {
                      color: theme.secondaryText,
                    },
                  ]}
                >
                  ›
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View>
              <Text
                style={[
                  styles.profileName,
                  {
                    color: theme.text,
                  },
                ]}
              >
                Профиль не выбран
              </Text>

              <Text
                style={[
                  styles.profileDescription,
                  {
                    color: theme.secondaryText,
                  },
                ]}
              >
                Создай профиль, чтобы начать обучение.
              </Text>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: theme.primary,
                  },
                ]}
                onPress={() =>
                  navigation.navigate('Profiles')
                }
              >
                <Text
                  style={[
                    styles.primaryButtonText,
                    {
                      color: theme.primaryText,
                    },
                  ]}
                >
                  Открыть профили
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ВНЕШНИЙ ВИД */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.text,
            },
          ]}
        >
          Внешний вид
        </Text>

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
              styles.menuTitle,
              {
                color: theme.text,
              },
            ]}
          >
            Тема приложения
          </Text>

          <Text
            style={[
              styles.menuDescription,
              {
                color: theme.secondaryText,
              },
            ]}
          >
            Выбери светлую или тёмную тему
          </Text>

          <View style={styles.themeButtons}>
            <TouchableOpacity
              style={[
                styles.themeButton,
                {
                  borderColor: theme.border,
                  backgroundColor:
                    data.settings.theme === 'light'
                      ? theme.primary
                      : theme.background,
                },
              ]}
              onPress={() => setTheme('light')}
            >
              <Text style={styles.themeIcon}>☀️</Text>

              <Text
                style={[
                  styles.themeButtonText,
                  {
                    color:
                      data.settings.theme === 'light'
                        ? theme.primaryText
                        : theme.text,
                  },
                ]}
              >
                Светлая
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeButton,
                {
                  borderColor: theme.border,
                  backgroundColor:
                    data.settings.theme === 'dark'
                      ? theme.primary
                      : theme.background,
                },
              ]}
              onPress={() => setTheme('dark')}
            >
              <Text style={styles.themeIcon}>🌙</Text>

              <Text
                style={[
                  styles.themeButtonText,
                  {
                    color:
                      data.settings.theme === 'dark'
                        ? theme.primaryText
                        : theme.text,
                  },
                ]}
              >
                Тёмная
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Экспорт и импорт CSV</Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.menuDescription, { color: theme.secondaryText }]}>Только слова выбранного профиля</Text>

          <TouchableOpacity
            style={[styles.dataAction, { borderColor: theme.border }]}
            onPress={handleSaveCsv}
          >
            <View style={styles.menuText}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>Экспорт CSV</Text>
              <Text style={[styles.menuDescription, { color: theme.secondaryText }]}>Слова и группы выбранного профиля</Text>
            </View>
            <Text style={[styles.actionLabel, { color: theme.primary }]}>Скачать</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dataAction, styles.topBorder, { borderColor: theme.border }]}
            onPress={handleShareCsv}
          >
            <View style={styles.menuText}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>Отправить CSV</Text>
              <Text style={[styles.menuDescription, { color: theme.secondaryText }]}>Поделиться файлом через систему</Text>
            </View>
            <Text style={[styles.actionLabel, { color: theme.primary }]}>Отправить</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dataAction, styles.topBorder, { borderColor: theme.border }]}
            onPress={handleImportCsv}
          >
            <View style={styles.menuText}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>Импорт CSV</Text>
              <Text style={[styles.menuDescription, { color: theme.secondaryText }]}>Добавить слова в выбранный профиль</Text>
            </View>
            <Text style={[styles.actionLabel, { color: theme.primary }]}>Выбрать</Text>
          </TouchableOpacity>
        </View>

        {/* ДАННЫЕ */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.text,
            },
          ]}
        >
          Данные
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.dataRow}
            onPress={() => navigation.navigate('Profiles')}
          >
            <View style={styles.dataInfo}>
              <Text
                style={[
                  styles.menuTitle,
                  {
                    color: theme.text,
                  },
                ]}
              >
                Профили
              </Text>

              <Text
                style={[
                  styles.menuDescription,
                  {
                    color: theme.secondaryText,
                  },
                ]}
              >
                {data.profiles.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dataRow,
              styles.topBorder,
              {
                borderColor: theme.border,
              },
            ]}
            onPress={() => setIsAllWordsModalVisible(true)}
          >
            <View style={styles.dataInfo}>
              <Text
                style={[
                  styles.menuTitle,
                  {
                    color: theme.text,
                  },
                ]}
              >
                Всего слов
              </Text>

              <Text
                style={[
                  styles.menuDescription,
                  {
                    color: theme.secondaryText,
                  },
                ]}
              >
                {data.words.length}
              </Text>
            </View>
          </TouchableOpacity>

        </View>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.text,
            },
          ]}
        >
          Обновления
        </Text>

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
            style={[styles.menuDescription, { color: theme.secondaryText }]}
          >
            Проверить наличие новой версии приложения
          </Text>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={handleCheckUpdates}
            disabled={isCheckingUpdate}
          >
            <Text style={[styles.primaryButtonText, { color: theme.primaryText }]}>
              {isCheckingUpdate ? 'Проверка...' : 'Проверить обновления'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.text,
            },
          ]}
        >
          Импорт и резервная копия
        </Text>

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
              styles.menuDescription,
              {
                color: theme.secondaryText,
              },
            ]}
          >
            JSON сохраняет профили, группы и прогресс. Восстановление локальной копии заменяет данные последней автоматической копией.
          </Text>

          <TouchableOpacity
            style={[styles.dataAction, { borderColor: theme.border }]}
            onPress={handleSaveJson}
          >
            <View style={styles.menuText}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>Экспорт JSON</Text>
              <Text style={[styles.menuDescription, { color: theme.secondaryText }]}>Полный резервный файл</Text>
            </View>
            <Text style={[styles.actionLabel, { color: theme.primary }]}>Скачать</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dataAction, styles.topBorder, { borderColor: theme.border }]}
            onPress={handleShareJson}
          >
            <View style={styles.menuText}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>Отправить JSON</Text>
              <Text style={[styles.menuDescription, { color: theme.secondaryText }]}>Поделиться резервной копией</Text>
            </View>
            <Text style={[styles.actionLabel, { color: theme.primary }]}>Отправить</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dataAction, styles.topBorder, { borderColor: theme.border }]}
            onPress={handleImportJson}
          >
            <View style={styles.menuText}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>Импорт JSON</Text>
              <Text style={[styles.menuDescription, { color: theme.secondaryText }]}>Восстановить данные из файла</Text>
            </View>
            <Text style={[styles.actionLabel, { color: theme.primary }]}>Выбрать</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dataAction, styles.topBorder, { borderColor: theme.border }]}
            onPress={handleRestoreLastBackup}
          >
            <View style={styles.menuText}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>Локальная копия</Text>
              <Text style={[styles.menuDescription, { color: theme.secondaryText }]}>Восстановить последнюю автоматическую копию</Text>
            </View>
            <Text style={[styles.actionLabel, { color: theme.primary }]}>Восстановить</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Сброс данных</Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.resetButton, { borderColor: theme.danger }]}
            onPress={handleReset}
          >
            <Text style={[styles.resetButtonText, { color: theme.danger }]}>Сбросить все данные</Text>
          </TouchableOpacity>
        </View>

        <Text
          style={[
            styles.version,
            {
              color: theme.secondaryText,
            },
          ]}
        >
          Мой английский
        </Text>

        <Text
          style={[
            styles.developer,
            {
              color: theme.secondaryText,
            },
          ]}
        >
          Разработчик: Lim0n4ikz
        </Text>
                <Text
          style={[
            styles.developer,
            {
              color: theme.secondaryText,
            },
          ]}
        >
          Компания: Lim0n4ikzGames
        </Text>
        
        <Text
          style={[
            styles.developer,
            {
              color: theme.secondaryText,
            },
          ]}
        >
          v {getCurrentVersion()}
        </Text>
      </ScrollView>
      <Modal
        visible={isAllWordsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAllWordsModalVisible(false)}
      >
        <View style={styles.wordsModalOverlay}>
          <View
            style={[
              styles.wordsModal,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.wordsModalHeader}>
              <View style={styles.menuText}>
                <Text style={[styles.wordsModalTitle, { color: theme.text }]}>Все слова</Text>
                <Text style={[styles.menuDescription, { color: theme.secondaryText }]}>Всего: {data.words.length}</Text>
              </View>
              <TouchableOpacity
                style={[styles.wordsModalClose, { borderColor: theme.border }]}
                onPress={() => setIsAllWordsModalVisible(false)}
              >
                <Text style={[styles.wordsModalCloseText, { color: theme.text }]}>Закрыть</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.allWordsList}
              showsVerticalScrollIndicator={false}
            >
              {data.words.length === 0 ? (
                <Text style={[styles.menuDescription, { color: theme.secondaryText }]}>Слов пока нет.</Text>
              ) : (
                data.words.map((word) => {
                  const profile = data.profiles.find((item) => item.id === word.profileId);
                  const group = data.wordGroups.find((item) => item.id === word.groupId);

                  return (
                    <View
                      key={word.id}
                      style={[styles.allWordItem, { borderColor: theme.border }]}
                    >
                      <Text style={[styles.allWordEnglish, { color: theme.text }]}>{word.english}</Text>
                      <Text style={[styles.allWordRussian, { color: theme.secondaryText }]}>{word.russian}</Text>
                      <Text style={[styles.allWordMeta, { color: theme.secondaryText }]}>Профиль: {profile?.name ?? 'Неизвестный профиль'}</Text>
                      <Text style={[styles.allWordMeta, { color: theme.secondaryText }]}>Группа: {group?.name ?? 'Без группы'}</Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <UpdateModal
        theme={theme}
        update={updateInfo}
        onLater={() => setUpdateInfo(null)}
      />
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
    paddingBottom: 40,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    marginTop: 8,
  },

  subtitle: {
    fontSize: 15,
    marginTop: 5,
    marginBottom: 26,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },

  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
  },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  profileInfo: {
    flex: 1,
    paddingRight: 12,
  },

  profileName: {
    fontSize: 18,
    fontWeight: '700',
  },

  profileDescription: {
    fontSize: 14,
    marginTop: 5,
  },

  smallButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  smallButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 7,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },

  editButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },

  cancelButton: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },

  saveButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },

  menuRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    marginTop: 14,
  },

  topBorder: {
    borderTopWidth: 1,
  },

  menuText: {
    flex: 1,
  },

  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
  },

  menuDescription: {
    fontSize: 13,
    marginTop: 4,
  },

  arrow: {
    fontSize: 28,
    marginLeft: 10,
  },

  primaryButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },

  themeButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },

  themeButton: {
    flex: 1,
    minHeight: 70,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  themeIcon: {
    fontSize: 22,
    marginBottom: 5,
  },

  themeButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },

  dataRow: {
    minHeight: 58,
    justifyContent: 'center',
  },

  dataAction: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },

  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 10,
  },

  dataInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  resetButton: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },

  resetButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },

  wordsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },

  wordsModal: {
    maxHeight: '85%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    padding: 20,
  },

  wordsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  wordsModalTitle: {
    fontSize: 22,
    fontWeight: '800',
  },

  wordsModalClose: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  wordsModalCloseText: {
    fontSize: 13,
    fontWeight: '700',
  },

  allWordsList: {
    marginBottom: 4,
  },

  allWordItem: {
    borderTopWidth: 1,
    paddingVertical: 12,
  },

  allWordEnglish: {
    fontSize: 17,
    fontWeight: '700',
  },

  allWordRussian: {
    fontSize: 15,
    marginTop: 3,
  },

  allWordMeta: {
    fontSize: 12,
    marginTop: 4,
  },

  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 4,
  },

  developer: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 6,
  },
});

