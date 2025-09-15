import dayjs from 'dayjs';
import React from 'react';
import {Text, View} from 'react-native';

import {useTheme} from '@/contexts/ThemeContext';
import {Schedule} from '@/types/api';

interface ScheduleItemProps {
  item: Schedule;
}

const ScheduleItem = ({item}: ScheduleItemProps) => {
  const {theme, typography} = useTheme();
  const startDate = dayjs(item.date.start);
  const endDate = dayjs(item.date.end || item.date.start);
  const isSameDay = startDate.isSame(endDate, 'day');

  return (
    <View style={{gap: 2}}>
      <Text style={[typography.baseTextStyle, {color: theme.primaryText, fontWeight: 500, fontSize: 16}]}>
        {startDate.format('M/D')}
        {!isSameDay && ` ~ ${endDate.format('M/D')}`}
      </Text>
      <Text style={[typography.baseTextStyle, {color: theme.primaryText, fontWeight: 300, fontSize: 16}]}>{item.schedule}</Text>
      <Text style={[typography.caption, {color: theme.secondaryText}]}>{endDate.diff(startDate, 'day') > 0 && `(${endDate.diff(startDate, 'day') + 1}일)`}</Text>
    </View>
  );
};

export default ScheduleItem;