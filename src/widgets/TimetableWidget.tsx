import React from 'react';
import {StyleSheet} from 'react-native';
import {ColorProp, FlexWidget, TextWidget} from 'react-native-android-widget';

import {theme} from '@/styles/theme';

export const TimetableSingleWidget = () => {
  return (
    <FlexWidget
      style={{
        flexDirection: 'column',
        padding: 16,
        backgroundColor: theme.colors.background as ColorProp,
        borderRadius: 8,
        flex: 1,
        height: 'match_parent',
        width: 'match_parent',
      }}>
      <FlexWidget style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between', flexGap: 4, width: 'match_parent', height: 'match_parent'}}>
        <FlexWidget style={{backgroundColor: theme.colors.card as ColorProp, padding: 4, borderRadius: 8, height: 'match_parent', flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <TextWidget text="과목" style={{color: theme.colors.primaryText as ColorProp}} />
          <TextWidget text="선생*" style={{color: theme.colors.primaryText as ColorProp}} />
        </FlexWidget>
        <FlexWidget style={{backgroundColor: theme.colors.card as ColorProp, padding: 4, borderRadius: 8, height: 'match_parent', flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <TextWidget text="과목" style={{color: theme.colors.primaryText as ColorProp}} />
          <TextWidget text="선생*" style={{color: theme.colors.primaryText as ColorProp}} />
        </FlexWidget>
        <FlexWidget style={{backgroundColor: theme.colors.card as ColorProp, padding: 4, borderRadius: 8, height: 'match_parent', flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <TextWidget text="과목" style={{color: theme.colors.primaryText as ColorProp}} />
          <TextWidget text="선생*" style={{color: theme.colors.primaryText as ColorProp}} />
        </FlexWidget>
        <FlexWidget style={{backgroundColor: theme.colors.card as ColorProp, padding: 4, borderRadius: 8, height: 'match_parent', flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <TextWidget text="과목" style={{color: theme.colors.primaryText as ColorProp}} />
          <TextWidget text="선생*" style={{color: theme.colors.primaryText as ColorProp}} />
        </FlexWidget>
        <FlexWidget style={{backgroundColor: theme.colors.card as ColorProp, padding: 4, borderRadius: 8, height: 'match_parent', flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <TextWidget text="과목" style={{color: theme.colors.primaryText as ColorProp}} />
          <TextWidget text="선생*" style={{color: theme.colors.primaryText as ColorProp}} />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
};
