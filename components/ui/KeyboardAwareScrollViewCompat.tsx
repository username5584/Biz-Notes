import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps,
} from 'react-native-keyboard-controller';
import { Platform, ScrollView, ScrollViewProps } from 'react-native';


type Props = KeyboardAwareScrollViewProps;

export function KeyboardAwareScrollViewCompat({
  children,
  keyboardShouldPersistTaps = 'handled',
  ...props
}: Props) {
  if (Platform.OS === 'web') {
    
    const scrollProps: ScrollViewProps = props as unknown as ScrollViewProps;
    return (
      <ScrollView keyboardShouldPersistTaps={keyboardShouldPersistTaps} {...scrollProps}>
        {children}
      </ScrollView>
    );
  }
  return (
    <KeyboardAwareScrollView
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      {...props}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
