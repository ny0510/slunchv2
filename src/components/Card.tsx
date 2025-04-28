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
  children?: React.ReactNode;
}

const Card = ({title, titleStyle, subtitle, subtitleStyle, style, arrow, titleIcon, children, notificationDot, ...rest}: Props & {[key: string]: any}) => {
  const {theme, typography} = useTheme();

  return (
    <View style={{backgroundColor: theme.card, borderRadius: 12, paddingHorizontal: 22, paddingVertical: 18, width: '100%', borderColor: theme.border, borderWidth: 1, gap: 8, ...style}} {...rest}>
      {title && (
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <View style={{gap: 8, flexDirection: 'row', alignItems: 'center'}}>
            {titleIcon}
            <Text style={[typography.baseTextStyle, {color: theme.primaryText, fontWeight: '700', fontSize: 20}, titleStyle]}>{title}</Text>
            {subtitle && <Text style={[typography.caption, {color: theme.secondaryText}, subtitleStyle]}>{subtitle}</Text>}
          </View>
          <View style={{gap: 8, flexDirection: 'row', alignItems: 'center'}}>
            {notificationDot && <View style={{width: 12, height: 12, borderRadius: 12 / 2, backgroundColor: theme.highlight}} />}
            {arrow && <FontAwesome6 name="angle-right" iconStyle="solid" size={16} color={theme.secondaryText} />}
          </View>
        </View>
      )}
      {children}
    </View>
  );
};

export default Card;
