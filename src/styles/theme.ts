import {Colors, FontWeights, Theme, Typography} from '@/types/theme';

const colors: Colors = {
  white: '#FEFCFF',
  background: '#181818',
  highlight: '#7956FC',
  card: '#252525',
  primaryText: '#FEFCFF',
  secondaryText: '#B0B0B0',
  border: '#333333',
};

const typography: Typography = {
  title: {fontSize: 24, fontFamily: 'Pretendard-SemiBold'},
  subtitle: {fontSize: 18, fontFamily: 'Pretendard-Medium'},
  body: {fontSize: 16, fontFamily: 'Pretendard-Medium'},
  caption: {fontSize: 14, fontFamily: 'Pretendard-Regular'},
  small: {fontSize: 12, fontFamily: 'Pretendard-Regular'},
};

const fontWeights: FontWeights = {
  thin: 'Pretendard-Thin',
  light: 'Pretendard-Light',
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semiBold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
  extraBold: 'Pretendard-ExtraBold',
};

export const theme: Theme = {
  colors,
  typography,
  fontWeights,
};
