import React from 'react';
import {Text, View, ViewStyle} from 'react-native';

import {useTheme} from '@/contexts/ThemeContext';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}

const EmptyState = ({icon, title, subtitle, style}: EmptyStateProps) => {
  const {theme, typography} = useTheme();

  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          gap: 8,
        },
        style,
      ]}>
      {icon && (
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: theme.background,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <FontAwesome6 name={icon as any} size={20} color={theme.secondaryText} iconStyle="regular" />
        </View>
      )}
      <View style={{alignItems: 'center', gap: 4}}>
        <Text style={[typography.body, {color: theme.primaryText, fontWeight: '500'}]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[typography.caption, {color: theme.secondaryText, textAlign: 'center'}]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
};

export default EmptyState;