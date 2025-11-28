import React from 'react';
import {Text, View} from 'react-native';

import {useTheme} from '@/contexts/ThemeContext';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

interface Props {
  title?: string;
  titleStyle?: object;
  subtitle?: string;
  subtitleStyle?: object;
  arrow?: boolean;
  notificationDot?: boolean;
  style?: object;
  titleIcon?: React.ReactNode;
  rightComponent?: React.ReactNode;
  children?: React.ReactNode;
}

const Card = ({title, titleStyle, subtitle, subtitleStyle, style, arrow, titleIcon, rightComponent, children, notificationDot, ...rest}: Props & {[key: string]: any}) => {
  const {theme, typography} = useTheme();

  return (
    <View style={{backgroundColor: theme.card, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 20, width: '100%', gap: 12, ...style}} {...rest}>
      {title && (
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <View style={{gap: 8, flexDirection: 'row', alignItems: 'center'}}>
            {titleIcon}
            <Text style={[typography.baseTextStyle, {color: theme.primaryText, fontWeight: '600', fontSize: 18}, titleStyle]}>{title}</Text>
            {subtitle && <Text style={[typography.caption, {color: theme.secondaryText}, subtitleStyle]}>{subtitle}</Text>}
          </View>
          <View style={{gap: 8, flexDirection: 'row', alignItems: 'center'}}>
            {rightComponent && rightComponent}
            {notificationDot && <View style={{width: 12, height: 12, borderRadius: 12 / 2, backgroundColor: theme.highlight}} />}
            {arrow && <FontAwesome6 name="chevron-right" iconStyle="solid" size={14} color={theme.secondaryText} />}
          </View>
        </View>
      )}
      {children}
    </View>
  );
};

export default Card;
