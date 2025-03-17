import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';

import {theme} from '@/styles/theme';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

const Content = ({title, content, arrow, arrowText, onPress, disabled}: {title: string; content?: string; arrow?: boolean; arrowText?: string; onPress?: () => void; disabled?: boolean}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1} disabled={disabled}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <Text style={[theme.typography.body, {color: disabled ? theme.colors.secondaryText : theme.colors.primaryText}]}>{title}</Text>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8}}>
          <Text style={[theme.typography.body, {color: theme.colors.secondaryText}]}>{arrowText}</Text>
          {arrow ? <FontAwesome6 name="angle-right" iconStyle="solid" size={16} color={theme.colors.secondaryText} /> : <Text style={[theme.typography.body, {color: theme.colors.secondaryText}]}>{content}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default Content;
