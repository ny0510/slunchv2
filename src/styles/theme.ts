import {Colors, Theme, Typography} from '@/types/theme';

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
  title: {fontSize: 24, fontFamily: 'Pretendard-Bold'},
  subtitle: {fontSize: 18, fontFamily: 'Pretendard-Medium'},
  body: {fontSize: 16, fontFamily: 'Pretendard-Medium'},
  caption: {fontSize: 14, fontFamily: 'Pretendard-Regular'},
  small: {fontSize: 12, fontFamily: 'Pretendard-Regular'},
};

export const theme: Theme = {
  colors,
  typography,
};
