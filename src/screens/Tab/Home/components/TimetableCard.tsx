import dayjs from 'dayjs';
import React, { useCallback, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { getTimetable } from '@/api';
import Card from '@/components/Card';
import Loading from '@/components/Loading';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { showToast } from '@/lib/toast';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Timetable } from '@/types/api';

export interface TimetableCardRef {
  refresh: () => Promise<void>;
  getTimetable: () => Timetable[][];
  setTimetable: (timetable: Timetable[][]) => void;
  getIsNextWeek: () => boolean;
}

interface TimetableCardProps {
  onLongPress?: () => void;
  onSubjectLongPress: (params: { row: number; col: number; subject: Timetable }) => void;
}

const TimetableCard = forwardRef<TimetableCardRef, TimetableCardProps>(({ onLongPress, onSubjectLongPress }, ref) => {
  const [timetable, setTimetable] = useState<Timetable[][]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [todayIndex, setTodayIndex] = useState<number>(dayjs().day() - 1);
  const [isNextWeek, setIsNextWeek] = useState(false);

  const { theme, typography } = useTheme();
  const { schoolInfo, classInfo } = useUser();

  const transpose = useCallback((array: Timetable[][]) => {
    const maxColLength = Math.max(...array.map(row => row.length));
    return Array.from({ length: maxColLength }, (_, colIndex) =>
      array.map(row => {
        const entry = row[colIndex];
        if (!entry) {
          return { subject: '-', teacher: '-', changed: false };
        }
        return {
          ...entry,
          subject: entry.subject === '없음' ? '-' : entry.subject,
          teacher: entry.teacher === '없음' ? '-' : entry.teacher,
        };
      }),
    );
  }, []);

  const fetchTimetable = useCallback(async () => {
    if (!schoolInfo.comciganCode || !classInfo.grade || !classInfo.class) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const timetableResult = await getTimetable(schoolInfo.comciganCode, classInfo.grade, classInfo.class, isNextWeek);
      const newTimetable = transpose(timetableResult);

      const existingCustomTimetable = JSON.parse((await AsyncStorage.getItem('customTimetable')) || 'null');

      if (existingCustomTimetable) {
        const mergedTimetable = newTimetable.map((row, rowIndex) =>
          row.map((subject, colIndex) => {
            const existingSubject = existingCustomTimetable[rowIndex]?.[colIndex];
            if (existingSubject?.userChanged) {
              return existingSubject;
            }
            return subject;
          }),
        );
        setTimetable(mergedTimetable);
      } else {
        setTimetable(newTimetable);
      }
    } catch (e) {
      console.error('Error fetching timetable:', e);
      showToast('시간표를 불러오는 중 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  }, [schoolInfo.comciganCode, classInfo.grade, classInfo.class, isNextWeek, transpose]);

  useEffect(() => {
    setTodayIndex(dayjs().day() - 1);
    fetchTimetable();
  }, [fetchTimetable]);

  useEffect(() => {
    if (timetable.length > 0) {
      AsyncStorage.setItem('customTimetable', JSON.stringify(timetable));
    }
  }, [timetable]);

  useImperativeHandle(ref, () => ({
    refresh: fetchTimetable,
    getTimetable: () => timetable,
    setTimetable: (newTimetable: Timetable[][]) => setTimetable(newTimetable),
    getIsNextWeek: () => isNextWeek,
  }));

  const handleSubjectLongPress = useCallback(
    (row: number, col: number) => {
      const subject = timetable[row]?.[col];
      if (subject) {
        onSubjectLongPress({ row, col, subject });
      }
    },
    [timetable, onSubjectLongPress],
  );

  return (
    <TouchableOpacity onLongPress={onLongPress} activeOpacity={1}>
      <Card
        title="시간표"
        subtitle="길게 눌러 편집"
        titleIcon={<FontAwesome6 name="table" size={16} color={theme.primaryText} iconStyle="solid" />}
        rightComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <TouchableOpacity onPress={() => setIsNextWeek(prev => !prev)} style={{ padding: 4 }}>
              <Text
                style={[
                  typography.caption,
                  { color: isNextWeek ? theme.highlightLight : theme.secondaryText },
                  isNextWeek ? { fontWeight: '800' } : {},
                ]}>
                {isNextWeek ? '다음주' : '이번주'}
              </Text>
            </TouchableOpacity>
          </View>
        }>
        {loading ? (
          <LoadingView height={250} />
        ) : timetable.length === 0 ? (
          <Text style={[typography.caption, { color: theme.secondaryText }]}>이번주 시간표가 없어요.</Text>
        ) : (
          <FlatList
            data={timetable}
            contentContainerStyle={{ gap: 3 }}
            renderItem={({ item, index }) => (
              <TimetableRow item={item} index={index} todayIndex={todayIndex} onSubjectLongPress={handleSubjectLongPress} />
            )}
            keyExtractor={(item, index) => `timetable-row-${index}`}
            scrollEnabled={false}
          />
        )}
      </Card>
    </TouchableOpacity>
  );
});

TimetableCard.displayName = 'TimetableCard';

const LoadingView = ({ height }: { height: number }) => (
  <View style={styles.loadingView}>
    <Loading />
  </View>
);

interface TimetableRowProps {
  item: Timetable[];
  index: number;
  todayIndex: number;
  onSubjectLongPress: (row: number, col: number) => void;
}

const TimetableRow = ({ item, index, todayIndex, onSubjectLongPress }: TimetableRowProps) => {
  const { theme, typography } = useTheme();

  return (
    <View style={styles.timetableRow}>
      {item.map((subject, subIndex) => (
        <View
          key={`${subject.subject}-${index}-${subIndex}`}
          style={[styles.timetableCell, { backgroundColor: subIndex === todayIndex ? theme.background : theme.card }]}>
          <TouchableOpacity
            onLongPress={() => onSubjectLongPress(index, subIndex)}
            delayPressIn={0}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
            <Text
              style={[
                typography.baseTextStyle,
                {
                  flexShrink: 1,
                  textAlign: 'center',
                  color: subject.userChanged
                    ? theme.highlightSecondary
                    : subject.changed
                      ? theme.highlightLight
                      : theme.primaryText,
                  fontWeight: '500',
                  fontSize: 16,
                },
              ]}>
              {subject.subject}
            </Text>
            <Text
              style={[
                typography.caption,
                {
                  textAlign: 'center',
                  color: subject.userChanged
                    ? theme.highlightSecondary
                    : subject.changed
                      ? theme.highlightLight
                      : theme.secondaryText,
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

const styles = StyleSheet.create({
  loadingView: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 250,
  },
  timetableRow: {
    flexDirection: 'row',
    gap: 3,
  },
  timetableCell: {
    flex: 1,
    paddingHorizontal: 2,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TimetableCard;
