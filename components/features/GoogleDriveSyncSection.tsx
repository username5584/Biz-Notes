import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

import { Icon } from '@/components/ui/Icon';
import { useGoogleDriveSync } from '@/context/GoogleDriveSyncContext';
import { useColors } from '@/hooks';
import { SETTINGS_CARD_SHADOW } from '@/utils/styles';
import { PRESS_TIMING_IN, PRESS_TIMING_OUT, EASE_IN, EASE_OUT } from '@/constants';


const CARD_SHADOW = SETTINGS_CARD_SHADOW;


export const GoogleDriveSyncSection = React.memo(function GoogleDriveSyncSection() {
  const colors = useColors();
  const drive = useGoogleDriveSync();

  const statusColor =
    drive.status === 'success' ? '#16A34A'
    : drive.status === 'error' ? colors.destructive
    : colors.mutedForeground;

  const lastSyncStr = drive.lastSyncTime
    ? new Date(drive.lastSyncTime).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const clientIdSet = !!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

  return (
    <View style={styles.syncSection}>
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
        СИНХРОНИЗАЦИЯ С GOOGLE DRIVE
      </Text>

      {!clientIdSet && (
        <View style={[styles.helpCard, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
          <Text style={[styles.helpText, { color: '#92400E' }]}>
            Для настройки нужен Google Client ID.
            {'\n'}Установите переменную окружения EXPO_PUBLIC_GOOGLE_CLIENT_ID
          </Text>
        </View>
      )}

      {clientIdSet && !drive.userEmail && (
        <GoogleSignInButton
          signIn={drive.signIn}
          signingIn={drive.signingIn}
          colors={colors}
        />
      )}

      {drive.userEmail && (
        <GoogleDriveSyncedView
          drive={drive}
          lastSyncStr={lastSyncStr}
          statusColor={statusColor}
          colors={colors}
        />
      )}
    </View>
  );
});

const GoogleSignInButton = React.memo(function GoogleSignInButton({
  signIn,
  signingIn,
  colors,
}: {
  signIn: () => void;
  signingIn: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (!signingIn) {
      cancelAnimation(scale);
      scale.value = withTiming(0.97, { duration: PRESS_TIMING_IN, easing: EASE_IN });
    }
  }, [signingIn]);

  const handlePressOut = useCallback(() => {
    cancelAnimation(scale);
    scale.value = withTiming(1, { duration: PRESS_TIMING_OUT, easing: EASE_OUT });
  }, []);

  return (
    <Pressable
      onPress={signIn}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={signingIn}
    >
      <Animated.View
        style={[
          animStyle,
          styles.googleBtn,
          { backgroundColor: colors.card, opacity: signingIn ? 0.6 : 1 },
          CARD_SHADOW,
        ]}
      >
        {signingIn ? (
          <ActivityIndicator size="small" color={colors.mutedForeground} />
        ) : (
          <View style={styles.googleLogo}>
            <Text style={styles.googleLogoText}>G</Text>
          </View>
        )}
        <Text style={[styles.googleBtnText, { color: colors.foreground }]}>
          {signingIn ? 'Открываю Google...' : 'Войти через Google'}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

const GoogleDriveSyncedView = React.memo(function GoogleDriveSyncedView({
  drive,
  lastSyncStr,
  statusColor,
  colors,
}: {
  drive: ReturnType<typeof useGoogleDriveSync>;
  lastSyncStr: string | null;
  statusColor: string;
  colors: ReturnType<typeof useColors>;
}) {
  if (!drive.userEmail) return null;

  return (
    <>
      <View style={[styles.accountCard, { backgroundColor: colors.card }, CARD_SHADOW]}>
        <View style={[styles.avatarCircle, { backgroundColor: colors.muted }]}>
          <Text style={[styles.avatarLetter, { color: colors.foreground }]}>
            {drive.userEmail[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.accountInfo}>
          <Text style={[styles.accountEmail, { color: colors.foreground }]} numberOfLines={1}>
            {drive.userEmail}
          </Text>
          {lastSyncStr && (
            <Text style={[styles.lastSync, { color: colors.mutedForeground }]}>
              Синхронизировано {lastSyncStr}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={drive.signOut} hitSlop={8}>
          <Icon name="x" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.syncMainBtn,
          { backgroundColor: colors.primary, opacity: drive.status === 'syncing' ? 0.6 : 1 },
        ]}
        onPress={drive.sync}
        disabled={drive.status === 'syncing'}
        activeOpacity={0.85}
      >
        {drive.status === 'syncing' ? (
          <ActivityIndicator size="small" color={colors.primaryForeground} />
        ) : (
          <Icon name="refresh-cw" size={18} color={colors.primaryForeground} />
        )}
        <Text style={[styles.syncMainBtnText, { color: colors.primaryForeground }]}>
          {drive.status === 'syncing' ? drive.statusMessage : 'Синхронизировать'}
        </Text>
      </TouchableOpacity>

      {drive.status !== 'syncing' && drive.statusMessage !== '' && (
        <View style={styles.statusRow}>
          <Icon
            name={drive.status === 'success' ? 'check' : 'alert-circle'}
            size={14}
            color={statusColor}
          />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {drive.statusMessage}
          </Text>
        </View>
      )}
    </>
  );
});

const styles = StyleSheet.create({
  syncSection: { marginTop: 8, gap: 12 },
  helpCard: { padding: 16, borderRadius: 14, borderWidth: 1 },
  helpText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingLeft: 2 },
  statusText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  lastSync: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
  },
  googleLogo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogoText: { color: '#fff', fontSize: 17, fontFamily: 'Inter_700Bold' },
  googleBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.1 },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 18,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  accountInfo: { flex: 1 },
  accountEmail: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  syncMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  syncMainBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    marginBottom: 4,
    marginLeft: 2,
  },
});
