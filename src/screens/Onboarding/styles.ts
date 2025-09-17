import {StyleSheet} from 'react-native';

import Palette from '@/theme/types/Palette';
import TextStyles from '@/theme/types/TextStyles';

export const createStyles = (theme: Palette, typography: TextStyles) =>
  StyleSheet.create({
    centerView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Intro Screen Styles
    introContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    introGradientTop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 150,
      zIndex: 10,
    },
    introGradientBottom: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 300,
      zIndex: 10,
    },
    introImageContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    introBackgroundImage: {
      flex: 1,
      transform: [{rotate: '-15deg'}, {scale: 1.3}],
    },
    introContentWrapper: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 30,
      justifyContent: 'space-between',
      zIndex: 20,
    },
    introTopContent: {
      gap: 30,
    },
    introSlotMachine: {
      fontSize: 32,
      fontWeight: '800',
      color: theme.primaryText,
      textAlign: 'center',
    },
    introFeatureGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'space-between',
    },
    introFeatureRow: {
      flexDirection: 'row',
      gap: 12,
    },
    introFeatureCard: {
      width: '47%',
      padding: 16,
      borderRadius: 16,
      gap: 12,
      borderWidth: 1,
      borderColor: `${theme.highlight}10`,
      backgroundColor: theme.card,
    },
    introFeatureIconWrapper: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.highlight,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    introFeatureContent: {
      gap: 2,
    },
    introFeatureTitle: {
      ...typography.subtitle,
      color: theme.primaryText,
      fontWeight: '700',
      fontSize: 15,
    },
    introFeatureDesc: {
      ...typography.caption,
      color: theme.secondaryText,
      fontSize: 12,
    },
    introFeatureText: {
      ...typography.caption,
      color: theme.primaryText,
      fontWeight: '600',
      flex: 1,
    },
    introBottomContent: {
      gap: 24,
    },
    introTextSection: {
      gap: 8,
      alignItems: 'center',
    },
    introMainTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.primaryText,
    },
    introSubText: {
      ...typography.body,
      color: theme.secondaryText,
    },
    introStartButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.highlight,
      borderRadius: 12,
      paddingVertical: 16,
    },
    introStartButtonText: {
      ...typography.subtitle,
      color: theme.white,
      fontWeight: '700',
    },
    // School Search Screen Styles
    searchContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    searchHeader: {
      backgroundColor: theme.card,
      padding: 24,
      paddingTop: 40,
      gap: 16,
      alignItems: 'center',
    },
    searchHeaderText: {
      alignItems: 'center',
      gap: 8,
    },
    searchTitle: {
      ...typography.title,
      color: theme.primaryText,
      fontWeight: '700',
    },
    searchSubtitle: {
      ...typography.body,
      color: theme.secondaryText,
      textAlign: 'center',
      lineHeight: 20,
    },
    searchInputWrapper: {
      padding: 20,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderRadius: 12,
      paddingHorizontal: 16,
      height: 52,
      gap: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    searchInput: {
      flex: 1,
      ...typography.subtitle,
      color: theme.primaryText,
    },
    searchResultContainer: {
      flex: 1,
      paddingHorizontal: 20,
    },
    searchResultList: {
      flex: 1,
    },
    searchResultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    searchResultContent: {
      flex: 1,
      gap: 4,
    },
    searchResultName: {
      ...typography.subtitle,
      color: theme.primaryText,
      fontWeight: '600',
    },
    searchResultAddress: {
      ...typography.body,
      color: theme.secondaryText,
    },
    // Legacy styles for compatibility
    subtitle: {
      color: theme.secondaryText,
      ...typography.subtitle,
    },
    // Class Select Screen Styles
    classSelectContainer: {
      flex: 1,
      backgroundColor: theme.background,
      justifyContent: 'space-between',
    },
    classSelectContent: {
      flex: 1,
    },
    classSelectHeader: {
      backgroundColor: theme.card,
      padding: 24,
      paddingTop: 40,
      gap: 16,
      alignItems: 'center',
    },
    classSelectHeaderText: {
      alignItems: 'center',
      gap: 8,
    },
    classSelectTitle: {
      ...typography.title,
      color: theme.primaryText,
      fontWeight: '700',
    },
    classSelectSubtitle: {
      ...typography.body,
      color: theme.secondaryText,
    },
    classSelectPickerWrapper: {
      flex: 1,
      padding: 20,
      justifyContent: 'space-between',
    },
    classSelectPickerContainer: {
      flexDirection: 'row',
      gap: 16,
      height: 250,
    },
    classSelectPickerSection: {
      flex: 1,
      gap: 12,
    },
    classSelectPickerLabel: {
      ...typography.caption,
      color: theme.secondaryText,
      fontWeight: '600',
      paddingHorizontal: 8,
    },
    classSelectPicker: {
      height: 200,
      backgroundColor: theme.card,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.border,
    },
    classSelectPickerItem: {
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 4,
    },
    classSelectPickerText: {
      fontSize: 24,
      color: theme.secondaryText,
      fontWeight: '600',
    },
    classSelectPickerTextActive: {
      color: theme.highlight,
    },
    classSelectPickerUnit: {
      fontSize: 16,
      color: theme.secondaryText,
      fontWeight: '500',
    },
    classSelectInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: `${theme.highlight}08`,
      padding: 12,
      borderRadius: 8,
      marginTop: 20,
    },
    classSelectInfoText: {
      ...typography.caption,
      color: theme.secondaryText,
      flex: 1,
    },
    classSelectButton: {
      backgroundColor: theme.highlight,
      borderRadius: 12,
      paddingVertical: 16,
      marginHorizontal: 20,
      marginBottom: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    classSelectButtonDisabled: {
      opacity: 0.5,
    },
    classSelectButtonText: {
      ...typography.subtitle,
      color: theme.white,
      fontWeight: '700',
    },
    // Legacy styles kept for compatibility
    nextButton: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 5,
    },
    nextButtonText: {
      ...typography.subtitle,
      color: theme.primaryText,
      fontWeight: '700',
    },
    title: {
      lineHeight: 40,
      color: theme.primaryText,
      ...typography.title,
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
      borderColor: theme.secondaryText,
      height: 50,
      gap: 10,
      paddingHorizontal: 5,
    },
    textInput: {
      flex: 1,
      color: theme.primaryText,
      ...typography.subtitle,
    },
    schoolFlatList: {
      marginBottom: 30,
    },
    schoolFlatListItem: {
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderColor: theme.secondaryText,
    },
    schoolFlatListNameText: {
      color: theme.primaryText,
      ...typography.subtitle,
    },
    schoolFlatListAddrText: {
      color: theme.secondaryText,
      ...typography.body,
    },
    scrollPickerContainer: {
      flex: 1,
      flexDirection: 'row',
    },
    onboardingImageContainer: {
      flex: 1,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    onboardingImage: {
      flex: 1,
      transform: [{rotate: '-25deg'}, {scale: 1.2}],
    },
    introContent: {
      flex: 1,
      justifyContent: 'space-between',
      zIndex: 20,
    },
  });
