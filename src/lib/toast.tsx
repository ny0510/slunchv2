import React from 'react';
import {Dimensions, Text, View} from 'react-native';
import Toast, {ToastConfig} from 'react-native-toast-message';

import Palette from '@/theme/types/Palette';
import TextStyles from '@/theme/types/TextStyles';

export const getToastConfig = (theme: Palette, typography: TextStyles): ToastConfig => ({
  customToast: ({text1}: {text1?: string}) => (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
        width: Dimensions.get('window').width - 30,
        backgroundColor: theme.card,
        borderColor: theme.border,
        borderWidth: 1,
        padding: 14,
        borderRadius: 18,
      }}>
      <Text style={[typography.body, {color: theme.primaryText}]}>{text1}</Text>
    </View>
  ),
});

export const showToast = (message: string, time: number = 2000) => {
  Toast.show({
    type: 'customToast',
    text1: message,
    visibilityTime: time,
  });
};
