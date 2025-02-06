import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {theme} from '@/styles/theme';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

interface Props {
  title?: string;
  arrow?: boolean;
  notificationDot?: boolean;
  titleIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const Card = ({title, arrow, titleIcon, children, notificationDot}: Props) => {
  return (
    <View style={s.container}>
      {notificationDot && <View style={s.notificationDot} />}
      {title && (
        <View style={s.titleRowContainer}>
          <View style={s.titleContainer}>
            {titleIcon}
            <Text style={s.title}>{title}</Text>
          </View>
          {arrow && <FontAwesome6 name="angle-right" iconStyle="solid" size={16} color={theme.colors.secondaryText} />}
        </View>
      )}
      {children}
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    width: '100%',
    borderColor: theme.colors.border,
    borderWidth: 1,
    gap: 8,
    position: 'relative',
  },
  title: {
    color: theme.colors.primaryText,
    fontFamily: theme.fontWeights.semiBold,
    fontSize: 20,
  },
  titleContainer: {
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
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 12 / 2,
    top: -2,
    end: -2,
    backgroundColor: theme.colors.highlight,
  },
});

export default Card;
