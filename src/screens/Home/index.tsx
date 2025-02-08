import dayjs from 'dayjs';
import React, {ReactNode, useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Alert, Easing, FlatList, Text, TouchableOpacity, View} from 'react-native';
import Midnight from 'react-native-midnight';

import {getMeal, getSchedules, getTimetable} from '@/api/api';
import Card from '@/components/Card';
import Container from '@/components/Container';
import TouchableScale from '@/components/TouchableScale';
import {theme} from '@/styles/theme';
import {Meal, Schedule, Timetable} from '@/types/api';
import {MealItem} from '@/types/meal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

const Home = () => {
  const [timetable, setTimetable] = useState<Timetable[][]>([]);
  const [meal, setMeal] = useState<Meal[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showAllergy, setShowAllergy] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [todayIndex, setTodayIndex] = useState<number>(dayjs().day() - 1);
  const [midnightTrigger, setMidnightTrigger] = useState<boolean>(false);

  const getSettings = async () => {
    const settings = JSON.parse((await AsyncStorage.getItem('settings')) || '{}');
    setShowAllergy(settings.showAllergy);
  };

  const fetchData = useCallback(async () => {
    getSettings();

    try {
      const today = dayjs();
      const school = JSON.parse((await AsyncStorage.getItem('school')) || '{}');
      const classData: {grade: number; class: number} = JSON.parse((await AsyncStorage.getItem('class')) || '{}');

      const timetableResponse = await getTimetable(school.comciganCode, classData.grade, classData.class);
      const mealResponse = await getMeal(school.neisCode, school.neisRegionCode, today.format('YYYY'), today.format('MM'), today.format('DD'), showAllergy, true, true);
      const scheduleResponse = await getSchedules(school.neisCode, school.neisRegionCode, today.format('YYYY'), today.format('MM'));

      setTimetable(transpose(timetableResponse));
      setMeal(mealResponse);
      setSchedules(scheduleResponse);
    } catch (e) {
      const err = e as Error;

      Alert.alert('데이터를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.', '오류 메시지: ' + err.message);
      console.error('Error fetching data:', err);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [showAllergy]);

  // 매일 자정마다 데이터를 갱신
  useEffect(() => {
    const listener = Midnight.addListener(() => setMidnightTrigger(prev => !prev));
    return () => listener.remove();
  }, []);

  useEffect(() => {
    setTodayIndex(dayjs().day() - 1);
    fetchData();
  }, [fetchData, midnightTrigger]);

  const renderMealItem = (mealItem: string | MealItem, index: number) => {
    if (typeof mealItem === 'string') {
      return <Text key={index}>- {mealItem}</Text>;
    }

    const allergyInfo = showAllergy && mealItem.allergy && mealItem.allergy.length > 0 ? ` (${mealItem.allergy.map(allergy => allergy.code).join(', ')})` : '';

    return (
      <Text key={index}>
        - {mealItem.food}
        <Text style={theme.typography.small}>{allergyInfo}</Text>
      </Text>
    );
  };

  const transpose = (array: Timetable[][]) => {
    const maxColLength = Math.max(...array.map(row => row.length));
    return Array.from({length: maxColLength}, (_, colIndex) =>
      array.map(row => {
        const entry = row[colIndex];
        if (!entry) {
          return {subject: '-', teacher: '-', changed: false};
        }
        return {
          ...entry,
          subject: entry.subject === '없음' ? '-' : entry.subject,
          teacher: entry.teacher === '없음' ? '-' : entry.teacher,
        };
      }),
    );
  };

  return (
    <Container scrollView>
      <View style={{gap: 16, width: '100%'}}>
        <HomeCard title="공지사항" titleIcon={<FontAwesome6 name="bullhorn" size={16} color={theme.colors.primaryText} iconStyle="solid" />} arrow notificationDot onPress={() => {}} />
        <HomeCard title="학사일정" titleIcon={<FontAwesome6 name="calendar" size={16} color={theme.colors.primaryText} iconStyle="solid" />} arrow onPress={() => {}}>
          {loading ? <LoadingView height={100} /> : schedules.length === 0 ? <Text style={{color: theme.colors.secondaryText}}>학사일정이 없어요.</Text> : <FlatList data={schedules} renderItem={({item}) => <ScheduleItem item={item} />} scrollEnabled={false} />}
        </HomeCard>
        <HomeCard title="급식" titleIcon={<FontAwesome6 name="utensils" size={16} color={theme.colors.primaryText} iconStyle="solid" />} arrow onPress={() => {}}>
          {loading ? <LoadingView height={100} /> : meal.length === 0 ? <Text style={{color: theme.colors.secondaryText}}>급식 정보가 없어요.</Text> : <FlatList data={meal} renderItem={({item}) => <View>{item.meal.map(renderMealItem)}</View>} scrollEnabled={false} />}
        </HomeCard>
        <HomeCard title="시간표" titleIcon={<FontAwesome6 name="table" size={16} color={theme.colors.primaryText} iconStyle="solid" />} arrow onPress={() => {}}>
          {loading ? (
            <LoadingView height={250} />
          ) : timetable.length === 0 ? (
            <Text style={{color: theme.colors.secondaryText}}>이번주 시간표가 없어요.</Text>
          ) : (
            <FlatList data={timetable} contentContainerStyle={{gap: 3}} renderItem={({item, index}) => <TimetableRow item={item} index={index} todayIndex={todayIndex} />} scrollEnabled={false} />
          )}
        </HomeCard>
      </View>
    </Container>
  );
};

const HomeCard = ({title, titleIcon, arrow, onPress, notificationDot, children}: {title?: string; titleIcon: ReactNode; arrow?: boolean; onPress?: () => void; notificationDot?: boolean; children?: ReactNode}) => (
  <TouchableScale pressInEasing={Easing.elastic(0.5)} pressOutEasing={Easing.elastic(0.5)} pressInDuration={100} pressOutDuration={100} scaleTo={0.98} onTouchEnd={onPress}>
    <TouchableOpacity>
      <Card title={title} titleIcon={titleIcon} arrow={arrow} notificationDot={notificationDot}>
        {children}
      </Card>
    </TouchableOpacity>
  </TouchableScale>
);

const LoadingView = ({height}: {height: number}) => (
  <View style={{height, justifyContent: 'center', alignItems: 'center'}}>
    <ActivityIndicator size="large" color={theme.colors.primaryText} />
  </View>
);

const ScheduleItem = ({item}: {item: Schedule}) => {
  const startDate = dayjs(item.date.start);
  const endDate = dayjs(item.date.end || item.date.start);
  const isSameDay = startDate.isSame(endDate, 'day');

  return (
    <View style={{flexDirection: 'row', alignItems: 'flex-end', gap: 4}}>
      <Text style={{color: theme.colors.primaryText, fontFamily: theme.fontWeights.medium, fontSize: 16}}>
        {startDate.format('M/D')}
        {!isSameDay && ` ~ ${endDate.format('M/D')}`}
      </Text>
      <Text style={{color: theme.colors.primaryText, fontFamily: theme.fontWeights.light, fontSize: 16}}>{item.schedule}</Text>
      <Text style={[theme.typography.caption, {color: theme.colors.secondaryText}]}>{endDate.diff(startDate, 'day') > 0 && `(${endDate.diff(startDate, 'day') + 1}일)`}</Text>
    </View>
  );
};

const TimetableRow = ({item, index, todayIndex}: {item: Timetable[]; index: number; todayIndex: number}) => (
  <View style={{flexDirection: 'row', gap: 3}}>
    {item.map((subject, subIndex) => (
      <View
        key={`${subject.subject}-${index}-${subIndex}`}
        style={{
          flex: 1,
          backgroundColor: subIndex === todayIndex ? theme.colors.background : theme.colors.card,
          paddingHorizontal: 2,
          paddingVertical: 8,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text
          style={{
            color: subject.changed ? theme.colors.highlightLight : theme.colors.primaryText,
            fontFamily: theme.fontWeights.medium,
            fontSize: 16,
          }}>
          {subject.subject}
        </Text>
        <Text
          style={[
            theme.typography.caption,
            {
              color: subject.changed ? theme.colors.highlightLight : theme.colors.secondaryText,
            },
          ]}>
          {subject.teacher}
        </Text>
      </View>
    ))}
  </View>
);

export default Home;
