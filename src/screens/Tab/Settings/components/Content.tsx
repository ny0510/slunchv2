import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';

import {theme} from '@/styles/theme';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

const Content = ({title, content, arrow, onPress}: {title: string; content?: string; arrow?: boolean; onPress?: () => void}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <Text style={theme.typography.body}>{title}</Text>
        {arrow ? <FontAwesome6 name="angle-right" iconStyle="solid" size={16} color={theme.colors.secondaryText} /> : <Text style={[theme.typography.body, {color: theme.colors.secondaryText}]}>{content}</Text>}
      </View>
    </TouchableOpacity>
  );
};

export default Content;
