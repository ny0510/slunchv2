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
    flex: 1,
    justifyContent: 'flex-end',
  },
  onboardingImageContainer: {
    position: 'absolute',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  onboardingImage: {
    transform: [{rotate: '-25deg'}, {scale: 0.7}],
    filter: [{brightness: 0.6}],
  },
  introTitle: {
    color: theme.colors.primaryText,
    fontFamily: theme.typography.title.fontFamily,
    fontSize: 34,
  },
  title: {
    color: theme.colors.primaryText,
    lineHeight: 40,
    ...theme.typography.title,
  },
  subtitle: {
    color: theme.colors.secondaryText,
    ...theme.typography.subtitle,
  },
  introContent: {
    gap: 60,
  },
  nextButton: {
    backgroundColor: theme.colors.highlight,
    borderColor: theme.colors.highlight,
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextButtonText: {
    color: theme.colors.primaryText,
    ...theme.typography.subtitle,
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
    gap: 60,
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
    color: theme.colors.primaryText,
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
    color: theme.colors.primaryText,
    ...theme.typography.subtitle,
  },
  schoolFlatListAddrText: {
    color: theme.colors.secondaryText,
    ...theme.typography.body,
  },
  scrollPickerContainer: {
    flex: 1,
    flexDirection: 'row',
  },
});
