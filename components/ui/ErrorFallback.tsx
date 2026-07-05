import { reloadAppAsync } from 'expo';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks';
import { Icon } from './Icon';

const MONO_FONT = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [detailsVisible, setDetailsVisible] = useState(false);

  const handleRestart = async () => {
    try {
      await reloadAppAsync();
    } catch {
      resetError();
    }
  };

  const errorDetails = `Error: ${error.message}${error.stack ? `\n\nStack Trace:\n${error.stack}` : ''}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {__DEV__ ? (
        <Pressable
          onPress={() => setDetailsVisible(true)}
          accessibilityLabel="View error details"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.topButton,
            { top: insets.top + 16, backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Icon name="info" size={20} color={colors.foreground} />
        </Pressable>
      ) : null}

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>Что-то пошло не так</Text>
        <Text style={[styles.message, { color: colors.mutedForeground }]}>
          Перезагрузите приложение, чтобы продолжить.
        </Text>
        <Pressable
          onPress={handleRestart}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
            Перезагрузить
          </Text>
        </Pressable>
      </View>

      {__DEV__ ? (
        <Modal
          visible={detailsVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setDetailsVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  Детали ошибки
                </Text>
                <Pressable
                  onPress={() => setDetailsVisible(false)}
                  accessibilityLabel="Close error details"
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.closeButton, { opacity: pressed ? 0.6 : 1 }]}
                >
                  <Icon name="x" size={24} color={colors.foreground} />
                </Pressable>
              </View>
              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={[
                  styles.modalScrollContent,
                  { paddingBottom: insets.bottom + 16 },
                ]}
                showsVerticalScrollIndicator
              >
                <View style={[styles.errorContainer, { backgroundColor: colors.card }]}>
                  <Text
                    style={[styles.errorText, { color: colors.foreground, fontFamily: MONO_FONT }]}
                    selectable
                  >
                    {errorDetails}
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
    maxWidth: 600,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    lineHeight: 34,
  },
  message: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  topButton: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    paddingHorizontal: 32,
    minWidth: 200,
    elevation: 3,
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
    height: '90%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
  closeButton: { padding: 4 },
  modalScrollView: { flex: 1 },
  modalScrollContent: { padding: 16 },
  errorContainer: { borderRadius: 12, padding: 16 },
  errorText: { fontSize: 12, lineHeight: 20 },
});
