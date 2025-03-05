import {StyleSheet} from 'react-native';

import {theme} from '@/styles/theme';

export const style = StyleSheet.create({
  centerView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  introContainer: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    paddingTop: 120,
    flex: 1,
    // justifyContent: 'flex-end',
  },
  onboardingImageContainer: {
    flex: 1,
    position: 'absolute',
    width: '100%',
    // justifyContent: 'center',
    // alignItems: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  onboardingImage: {
    flex: 1,
    transform: [{rotate: '-25deg'}, {scale: 1.2}],
  },
  introTitle: {
    color: theme.colors.primaryText,
    fontFamily: theme.fontWeights.bold,
    fontSize: 34,
  },
  title: {
    lineHeight: 40,
    ...theme.typography.title,
  },
  subtitle: {
    ...theme.typography.subtitle,
  },
  introContent: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 20,
    // gap: 70,
  },
  nextButton: {
    // backgroundColor: theme.colors.highlight,
    // borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
  },
  nextButtonText: {
    ...theme.typography.subtitle,
    color: theme.colors.primaryText,
    fontFamily: theme.fontWeights.bold,
  },
  inputContent: {
    flex: 1,
    gap: 20,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    flex: 1,
    justifyContent: 'space-between',
  },
  inputContentTop: {
    gap: 50,
    flex: 1,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: theme.colors.secondaryText,
    height: 50,
    gap: 10,
    paddingHorizontal: 5,
  },
  textInput: {
    ...theme.typography.subtitle,
    flex: 1,
  },
  schoolFlatList: {
    marginBottom: 30,
  },
  schoolFlatListItem: {
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: theme.colors.secondaryText,
  },
  schoolFlatListNameText: {
    ...theme.typography.subtitle,
  },
  schoolFlatListAddrText: {
    ...theme.typography.body,
  },
  scrollPickerContainer: {
    flex: 1,
    flexDirection: 'row',
  },
});
