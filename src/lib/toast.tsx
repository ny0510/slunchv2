import React from 'react';
import {Dimensions, Text, View} from 'react-native';
import Toast, {ToastConfig} from 'react-native-toast-message';

import {theme} from '../styles/theme';

export const toastConfig: ToastConfig = {
  customToast: ({text1}: {text1?: string}) => (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
        width: Dimensions.get('window').width - 30,
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.border,
        borderWidth: 1,
        padding: 14,
        borderRadius: 18,
      }}>
      <Text
        style={{
          color: theme.colors.primaryText,
          fontFamily: theme.fontWeights.medium,
          fontSize: theme.typography.body.fontSize,
        }}>
        {text1}
      </Text>
    </View>
  ),
};

export const showToast = (message: string, time: number = 2000) => {
  Toast.show({
    type: 'customToast',
    text1: message,
    visibilityTime: time,
  });
};
