import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {theme} from '@/styles/theme';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

interface Props {
  title?: string;
  subtitle?: string;
  arrow?: boolean;
  notificationDot?: boolean;
  titleIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const Card = ({title, subtitle, arrow, titleIcon, children, notificationDot}: Props) => {
  return (
    <View style={s.container}>
      {title && (
        <View style={s.titleRowContainer}>
          <View style={s.titleContentContainer}>
            {titleIcon}
            {/* <View style={{gap: 2}}> */}
            <Text style={s.title}>{title}</Text>
            {subtitle && <Text style={[theme.typography.caption, {color: theme.colors.secondaryText}]}>{subtitle}</Text>}
            {/* </View> */}
          </View>
          <View style={s.titleContentContainer}>
            {notificationDot && <View style={s.notificationDot} />}
            {arrow && <FontAwesome6 name="angle-right" iconStyle="solid" size={16} color={theme.colors.secondaryText} />}
          </View>
        </View>
      )}
      {children}
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 18,
    width: '100%',
    borderColor: theme.colors.border,
    borderWidth: 1,
    gap: 8,
  },
  title: {
    color: theme.colors.primaryText,
    fontFamily: theme.fontWeights.bold,
    fontSize: 20,
  },
  titleContentContainer: {
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationDot: {
    width: 12,
    height: 12,
    borderRadius: 12 / 2,
    backgroundColor: theme.colors.highlight,
  },
});

export default Card;
