import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { useColors } from '@/hooks';
import { useModalPortal } from '../ModalPortal';
import { Icon, type IconName } from '../ui/Icon';

interface Props {
  value: Date;
  mode: 'date' | 'time';
  onChange: (date: Date) => void;
  icon: IconName;
  displayValue: string;
  placeholder: string;
}

export const DatePickerField = memo(function DatePickerField({
  value,
  mode,
  onChange,
  icon,
  displayValue,
  placeholder,
}: Props) {
  const colors = useColors();
  const { openModal } = useModalPortal();

  const handlePress = useCallback(() => {
    openModal({
      type: mode,
      value,
      onConfirm: onChange,
      onDismiss: () => {},
    });
  }, [mode, value, onChange, openModal]);

  const displayText = useMemo(() => displayValue || placeholder, [displayValue, placeholder]);
  const hasValue = !!displayValue;

  return (
    <TouchableOpacity style={styles.field} onPress={handlePress} activeOpacity={0.7}>
      <Icon name={icon} size={14} color={colors.mutedForeground} style={styles.icon} />
      <Text
        style={[
          styles.text,
          { color: hasValue ? colors.foreground : colors.mutedForeground },
        ]}
      >
        {displayText}
      </Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  icon: { marginRight: 8 },
  text: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
});
