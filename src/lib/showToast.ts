import Toast from 'react-native-toast-message';

export const showToast = (message: string) => {
  Toast.show({
    type: 'customToast',
    text1: message,
    visibilityTime: 2000,
  });
};
