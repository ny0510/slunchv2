import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {theme} from '@/styles/theme';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

interface Props {
  title?: string;
  arrow?: boolean;
  titleIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const Card = ({title, arrow, titleIcon, children}: Props) => {
  return (
    <View style={s.container}>
      {title && (
        <View style={s.titleRowContainer}>
          <View style={s.titleContainer}>
            {titleIcon}
            <Text style={s.title}>{title}</Text>
          </View>
          {arrow && <FontAwesome6 name="angle-right" iconStyle="solid" size={18} color={theme.colors.secondaryText} />}
        </View>
      )}
      {children}
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    padding: 16,
    width: '100%',
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  title: {
    color: theme.colors.primaryText,
    ...theme.typography.title,
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
});

export default Card;
