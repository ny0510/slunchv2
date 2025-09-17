import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';

import {useTheme} from '@/contexts/ThemeContext';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

const Content = ({title, content, arrow, arrowText, onPress, disabled}: {title: string; content?: string; arrow?: boolean; arrowText?: string; onPress?: () => void; disabled?: boolean}) => {
  const {theme, typography} = useTheme();

  return (
    <TouchableOpacity style={{paddingVertical: 2}} onPress={onPress} activeOpacity={0.7} disabled={disabled || !onPress} delayPressIn={0} delayPressOut={0} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        <Text style={[typography.body, {color: disabled ? theme.secondaryText : theme.primaryText}]}>{title}</Text>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8}}>
          <Text style={[typography.body, {color: theme.secondaryText}]}>{arrowText}</Text>
          {arrow ? <FontAwesome6 name="angle-right" iconStyle="solid" size={16} color={theme.secondaryText} /> : <Text style={[typography.body, {color: theme.secondaryText}]}>{content}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default Content;
