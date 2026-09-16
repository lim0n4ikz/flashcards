import React, { useState } from 'react';
import {
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

export default function ProfileFormScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme, createProfile } = useApp();

  const [name, setName] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      return;
    }

    await createProfile(name);

    navigation.goBack();
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>
          Новый профиль
        </Text>

        <Text
          style={[
            styles.label,
            { color: theme.text },
          ]}
        >
          Имя
        </Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Например, Алекс"
          placeholderTextColor={theme.secondaryText}
          style={[
            styles.input,
            {
              backgroundColor: theme.input,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleCreate}
        />

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: name.trim()
                ? theme.primary
                : theme.border,
            },
          ]}
          disabled={!name.trim()}
          onPress={handleCreate}
        >
          <Text
            style={[
              styles.buttonText,
              {
                color: name.trim()
                  ? theme.primaryText
                  : theme.secondaryText,
              },
            ]}
          >
            Создать профиль
          </Text>
        </TouchableOpacity>
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
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 32,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },

  input: {
    height: 54,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 17,
  },

  button: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});