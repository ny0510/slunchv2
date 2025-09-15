import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';

import {useTheme} from '@/contexts/ThemeContext';
import {Timetable} from '@/types/api';

import {styles as s} from '../styles';

interface TimetableRowProps {
  item: Timetable[];
  index: number;
  todayIndex: number;
  openBottomSheet: (params: {row: number; col: number}) => void;
}

const TimetableRow = ({item, index, todayIndex, openBottomSheet}: TimetableRowProps) => {
  const {theme, typography} = useTheme();

  return (
    <View style={s.timetableRow}>
      {item.map((subject, subIndex) => (
        <View key={`${subject.subject}-${index}-${subIndex}`} style={[s.timetableCell, {backgroundColor: subIndex === todayIndex ? theme.background : theme.card}]}>
          <TouchableOpacity onLongPress={() => openBottomSheet({row: index, col: subIndex})} delayPressIn={0} hitSlop={{top: 4, bottom: 4, left: 4, right: 4}}>
            <Text
              style={[
                typography.baseTextStyle,
                {
                  flexShrink: 1,
                  textAlign: 'center',
                  color: subject.userChanged ? theme.highlightSecondary : subject.changed ? theme.highlightLight : theme.primaryText,
                  fontWeight: '500',
                  fontSize: 16,
                },
              ]}>
              {subject.subject}
            </Text>
            <Text
              style={[
                typography.small,
                {
                  flexShrink: 1,
                  textAlign: 'center',
                  color: subject.userChanged ? theme.highlightSecondary : subject.changed ? theme.highlightLight : theme.secondaryText,
                  fontWeight: '300',
                  fontSize: 12,
                },
              ]}>
              {subject.teacher}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

export default TimetableRow;