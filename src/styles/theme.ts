import {Colors, FontWeights, Theme, Typography} from '@/types/theme';

const colors: Colors = {
  white: '#FEFCFF',
  background: '#181818',
  highlight: '#7956FC',
  highlightLight: '#BAA6FF',
  card: '#252525',
  primaryText: '#FEFCFF',
  secondaryText: '#B0B0B0',
  border: '#333333',
};

const fontWeights: FontWeights = {
  thin: 'Pretendard-Thin',
  extraLight: 'Pretendard-ExtraLight',
  light: 'Pretendard-Light',
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semiBold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
  extraBold: 'Pretendard-ExtraBold',
  black: 'Pretendard-Black',
};

const typography: Typography = {
  title: {fontSize: 24, fontFamily: fontWeights.semiBold, color: colors.primaryText},
  subtitle: {fontSize: 18, fontFamily: fontWeights.medium, color: colors.primaryText},
  body: {fontSize: 16, fontFamily: fontWeights.medium, color: colors.primaryText},
  caption: {fontSize: 14, fontFamily: fontWeights.regular, color: colors.primaryText},
  small: {fontSize: 12, fontFamily: fontWeights.regular, color: colors.primaryText},
};

export const theme: Theme = {
  colors,
  typography,
  fontWeights,
};
