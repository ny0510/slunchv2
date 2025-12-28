import dayjs from 'dayjs';
import React, { useCallback, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity, ScrollView } from 'react-native-gesture-handler';
import DropDownPicker from 'react-native-dropdown-picker';

import { getGradeTimetable } from '@/api';
import Card from '@/components/Card';
import Loading from '@/components/Loading';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { showToast } from '@/lib/toast';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Timetable } from '@/types/api';

export interface GradeTimetableCardRef {
  refresh: () => Promise<void>;
  getTimetable: () => Timetable[][][];
  setTimetable: (timetable: Timetable[][][]) => void;
  getIsNextWeek: () => boolean;
}

interface GradeTimetableCardProps {
  onLongPress?: () => void;
}

const GradeTimetableCard = forwardRef<GradeTimetableCardRef, GradeTimetableCardProps>(({ onLongPress }, ref) => {
  const { theme, typography } = useTheme();
  const { schoolInfo, classInfo } = useUser();

  const [timetable, setTimetable] = useState<Timetable[][][]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [todayIndex, setTodayIndex] = useState<number>(dayjs().day() - 1);
  const [isNextWeek, setIsNextWeek] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<number>(Number(classInfo.grade) || 1);
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const day = dayjs().day() - 1;
    return day >= 0 && day <= 4 ? day : 0; // 월~금: 0-4, 토/일: 0
  });

  // Dropdown states
  const [gradeOpen, setGradeOpen] = useState(false);
  const [gradeValue, setGradeValue] = useState(Number(classInfo.grade) || 1);
  const [gradeItems, setGradeItems] = useState([
    { label: '1학년', value: 1 },
    { label: '2학년', value: 2 },
    { label: '3학년', value: 3 },
  ]);

  const [dayOpen, setDayOpen] = useState(false);
  const [dayValue, setDayValue] = useState(() => {
    const day = dayjs().day() - 1;
    return day >= 0 && day <= 4 ? day : 0;
  });
  const [dayItems, setDayItems] = useState([
    { label: '월', value: 0 },
    { label: '화', value: 1 },
    { label: '수', value: 2 },
    { label: '목', value: 3 },
    { label: '금', value: 4 },
  ]);

  const fetchTimetable = useCallback(async () => {
    if (!schoolInfo.comciganCode || !selectedGrade) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const timetableResult = await getGradeTimetable(schoolInfo.comciganCode, selectedGrade, isNextWeek);
      setTimetable(timetableResult);
    } catch (e) {
      console.error('Error fetching timetable:', e);
      showToast('시간표를 불러오는 중 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  }, [schoolInfo.comciganCode, selectedGrade, isNextWeek]);

  useEffect(() => {
    setTodayIndex(dayjs().day() - 1);
    fetchTimetable();
  }, [fetchTimetable]);

  useEffect(() => {
    setSelectedGrade(gradeValue);
  }, [gradeValue]);

  useEffect(() => {
    setSelectedDay(dayValue);
  }, [dayValue]);

  // Close other dropdowns when one opens
  useEffect(() => {
    if (gradeOpen) setDayOpen(false);
  }, [gradeOpen]);

  useEffect(() => {
    if (dayOpen) setGradeOpen(false);
  }, [dayOpen]);

  useEffect(() => {
    if (timetable.length > 0) {
      AsyncStorage.setItem('customTimetable', JSON.stringify(timetable));
    }
  }, [timetable]);

  useImperativeHandle(ref, () => ({
    refresh: fetchTimetable,
    getTimetable: () => timetable,
    setTimetable: (newTimetable: Timetable[][][]) => setTimetable(newTimetable),
    getIsNextWeek: () => isNextWeek,
  }));

  return (
    <TouchableOpacity onLongPress={onLongPress} activeOpacity={1}>
      <Card
        title="학년 시간표"
        titleIcon={<FontAwesome6 name="table" size={16} color={theme.primaryText} iconStyle="solid" />}
        rightComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* 학년 선택 */}
            <View style={{ zIndex: 3000 }}>
              <DropDownPicker
                open={gradeOpen}
                value={gradeValue}
                items={gradeItems}
                setOpen={setGradeOpen}
                setValue={setGradeValue}
                setItems={setGradeItems}
                style={{
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  borderRadius: 6,
                  minHeight: 30,
                  width: 75,
                }}
                dropDownContainerStyle={{
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  width: 75,
                }}
                textStyle={{
                  color: theme.primaryText,
                  fontSize: 12,
                }}
                labelStyle={{
                  color: theme.primaryText,
                  fontSize: 12,
                }}
                placeholder="학년"
                placeholderStyle={{
                  color: theme.secondaryText,
                  fontSize: 12,
                }}
                showArrowIcon={true}
                showTickIcon={false}
                ArrowDownIconComponent={() => <FontAwesome6 name="chevron-down" size={10} color={theme.secondaryText} iconStyle="solid" />}
                ArrowUpIconComponent={() => <FontAwesome6 name="chevron-up" size={10} color={theme.secondaryText} iconStyle="solid" />}
              />
            </View>

            {/* 요일 선택 */}
            <View style={{ zIndex: 2000 }}>
              <DropDownPicker
                open={dayOpen}
                value={dayValue}
                items={dayItems}
                setOpen={setDayOpen}
                setValue={setDayValue}
                setItems={setDayItems}
                style={{
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  borderRadius: 6,
                  minHeight: 30,
                  width: 60,
                }}
                dropDownContainerStyle={{
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  width: 60,
                }}
                textStyle={{
                  color: theme.primaryText,
                  fontSize: 12,
                }}
                labelStyle={{
                  color: theme.primaryText,
                  fontSize: 12,
                }}
                showArrowIcon={true}
                showTickIcon={false}
                ArrowDownIconComponent={() => <FontAwesome6 name="chevron-down" size={10} color={theme.secondaryText} iconStyle="solid" />}
                ArrowUpIconComponent={() => <FontAwesome6 name="chevron-up" size={10} color={theme.secondaryText} iconStyle="solid" />}
              />
            </View>
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
          <View>
            {/* 반별 시간표 표시 */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled={true}>
              <View style={{ flexDirection: 'row', gap: 8, paddingRight: 16 }}>
                {timetable.map((classTimetable, classIndex) => (
                  <View key={classIndex} style={{ width: 50 }}>
                    <Text style={[typography.caption, { color: theme.secondaryText, marginBottom: 4, textAlign: 'center' }]}>
                      {classIndex + 1}반
                    </Text>
                    <View style={{ flexDirection: 'column', gap: 3 }}>
                      {classTimetable[selectedDay]?.map((subject, subIndex) => (
                        <View
                          key={`${subject.subject}-${classIndex}-${selectedDay}-${subIndex}`}
                          style={[styles.timetableCell, { backgroundColor: theme.card }]}>
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
                                fontSize: 14,
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
                                fontSize: 12,
                              },
                            ]}>
                            {subject.teacher}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
});

GradeTimetableCard.displayName = 'GradeTimetableCard';

const LoadingView = ({ height }: { height: number }) => (
  <View style={styles.loadingView}>
    <Loading />
  </View>
);

const styles = StyleSheet.create({
  loadingView: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 250,
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

export default GradeTimetableCard;
