import React, { useState } from 'react';
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

export default function ProfilesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [search, setSearch] = useState('');

  const {
    theme,
    data,
    activeProfile,
    selectProfile,
    deleteProfile,
  } = useApp();

  const filteredProfiles = data.profiles.filter((profile) =>
    profile.name.toLowerCase().includes(search.trim().toLowerCase())
  );

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
          Профили
        </Text>

        <Text
          style={[
            styles.subtitle,
            { color: theme.secondaryText },
          ]}
        >
          Выбери профиль для обучения
        </Text>

        <TouchableOpacity
          style={[
            styles.createButton,
            { backgroundColor: theme.primary },
          ]}
          onPress={() => navigation.navigate('ProfileForm')}
        >
          <Text
            style={[
              styles.createButtonText,
              { color: theme.primaryText },
            ]}
          >
            + Создать профиль
          </Text>
        </TouchableOpacity>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Поиск профиля"
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

        {filteredProfiles.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
            Профили не найдены
          </Text>
        ) : (
          filteredProfiles.map((profile) => {
          const isActive = profile.id === activeProfile?.id;

          return (
            <View
              key={profile.id}
              style={[
                styles.profile,
                {
                  backgroundColor: theme.card,
                  borderColor: isActive
                    ? theme.primary
                    : theme.border,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => selectProfile(profile.id)}
              >
                <View style={styles.profileInfo}>
                  <Text
                    style={[
                      styles.profileName,
                      { color: theme.text },
                    ]}
                  >
                    {profile.name}
                  </Text>

                  {isActive && (
                    <Text
                      style={[
                        styles.activeText,
                        { color: theme.primary },
                      ]}
                    >
                      Активный профиль
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Удалить профиль?',
                    `Профиль «${profile.name}» и все его слова будут удалены.`,
                    [
                      { text: 'Отмена', style: 'cancel' },
                      {
                        text: 'Удалить',
                        style: 'destructive',
                        onPress: () => deleteProfile(profile.id),
                      },
                    ]
                  );
                }}
              >
                <Text
                  style={[
                    styles.deleteText,
                    { color: theme.danger },
                  ]}
                >
                  Удалить
                </Text>
              </TouchableOpacity>
            </View>
          );
          })
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
    padding: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
  },

  subtitle: {
    fontSize: 16,
    marginTop: 8,
    marginBottom: 24,
  },

  profile: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  profileButton: {
    flex: 1,
  },

  profileInfo: {
    flex: 1,
  },

  profileName: {
    fontSize: 18,
    fontWeight: '700',
  },

  activeText: {
    fontSize: 13,
    marginTop: 5,
  },

  deleteText: {
    fontSize: 14,
    fontWeight: '600',
    padding: 8,
  },

  createButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 16,
  },

  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },

  searchInput: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    marginBottom: 16,
  },

  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    marginTop: 16,
  },
});