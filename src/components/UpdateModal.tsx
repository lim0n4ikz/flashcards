import React from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { AppTheme } from '../theme/theme';
import type { UpdateInfo } from '../services/updateService';

interface UpdateModalProps {
  theme: AppTheme;
  update: UpdateInfo | null;
  onLater: () => void;
}

export default function UpdateModal({
  theme,
  update,
  onLater,
}: UpdateModalProps) {
  if (!update) {
    return null;
  }

  const handleUpdate = async () => {
    try {
      await Linking.openURL(update.url);
    } catch {
      return;
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onLater}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onLater} />

        <View
          style={[
            styles.modal,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.title, { color: theme.text }]}>
            Доступно обновление
          </Text>

          <Text style={[styles.version, { color: theme.primary }]}>
            Версия {update.version}
          </Text>

          <Text style={[styles.changesTitle, { color: theme.text }]}>
            Что изменилось:
          </Text>

          <ScrollView
            style={styles.changes}
            contentContainerStyle={styles.changesContent}
            showsVerticalScrollIndicator={false}
          >
            {update.changes.map((change, index) => (
              <Text
                key={`${change}-${index}`}
                style={[styles.change, { color: theme.secondaryText }]}
              >
                {'• '}{change}
              </Text>
            ))}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.laterButton, { borderColor: theme.border }]}
              onPress={onLater}
            >
              <Text style={[styles.laterText, { color: theme.text }]}>
                Позже
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.updateButton, { backgroundColor: theme.primary }]}
              onPress={handleUpdate}
            >
              <Text style={[styles.updateText, { color: theme.primaryText }]}>
                Обновить
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'transparent',
  },

  modal: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    borderWidth: 1,
    borderRadius: 22,
    padding: 24,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
  },

  version: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 10,
  },

  changesTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 24,
  },

  changes: {
    maxHeight: 150,
    marginTop: 10,
  },

  changesContent: {
    gap: 8,
  },

  change: {
    fontSize: 15,
    lineHeight: 21,
  },

  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },

  laterButton: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  updateButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  laterText: {
    fontSize: 15,
    fontWeight: '700',
  },

  updateText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
