import dayjs from 'dayjs';
import React, { useCallback, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { FlatList, Text, View } from 'react-native';
import TouchableScale from 'react-native-touchable-scale';

import { getSchedules } from '@/api';
import Loading from '@/components/Loading';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { showToast } from '@/lib/toast';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { Schedule } from '@/types/api';

export interface ScheduleCardRef {
  refresh: () => Promise<void>;
}

interface ScheduleCardProps {
  onPress: () => void;
  onLongPress?: () => void;
}

const ScheduleCard = forwardRef<ScheduleCardRef, ScheduleCardProps>(({ onPress, onLongPress }, ref) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { theme, typography } = useTheme();
  const { schoolInfo } = useUser();

  const fetchSchedules = useCallback(async () => {
    if (!schoolInfo.neisCode || !schoolInfo.neisRegionCode) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const today = dayjs();
      const scheduleResult = await getSchedules(schoolInfo.neisCode, schoolInfo.neisRegionCode, today.format('YYYY'), today.format('MM'));
      const scheduleResponse =
        scheduleResult?.length > 0
          ? scheduleResult.filter(schedule => {
              const startDate = dayjs(schedule.date.start);
              const endDate = dayjs(schedule.date.end || schedule.date.start);
              return startDate.isSameOrAfter(today, 'day') || (startDate.isBefore(today, 'day') && endDate.isSameOrAfter(today, 'day'));
            })
          : [];
      setSchedules(scheduleResponse);
    } catch (e) {
      console.error('Error fetching schedules:', e);
      showToast('학사일정을 불러오는 중 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  }, [schoolInfo.neisCode, schoolInfo.neisRegionCode]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useImperativeHandle(ref, () => ({
    refresh: fetchSchedules,
  }));

  return (
    <TouchableScale onLongPress={onLongPress} onPress={onPress} activeScale={0.98} tension={100} friction={10}>
      <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 20, gap: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <FontAwesome6 name="calendar" size={16} color={theme.primaryText} iconStyle="solid" />
            <Text style={[typography.baseTextStyle, { color: theme.primaryText, fontWeight: '600', fontSize: 18 }]}>학사일정</Text>
          </View>
          <FontAwesome6 name="chevron-right" iconStyle="solid" size={14} color={theme.secondaryText} />
        </View>

        {loading ? (
          <LoadingView height={100} />
        ) : schedules.length === 0 ? (
          <Text style={[typography.body, { color: theme.secondaryText }]}>이번달에 남은 학사일정이 없어요.</Text>
        ) : (
          <FlatList
            contentContainerStyle={{ gap: 8 }}
            data={schedules.slice(0, 4)}
            renderItem={({ item }) => <ScheduleItem item={item} />}
            scrollEnabled={false}
          />
        )}
      </View>
    </TouchableScale>
  );
});

ScheduleCard.displayName = 'ScheduleCard';

const LoadingView = ({ height }: { height: number }) => (
  <View style={{ justifyContent: 'center', alignItems: 'center', height }}>
    <Loading />
  </View>
);

const ScheduleItem = ({ item }: { item: Schedule }) => {
  const startDate = dayjs(item.date.start);
  const endDate = dayjs(item.date.end || item.date.start);
  const isSameDay = startDate.isSame(endDate, 'day');

  const { theme, typography } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.secondaryText, marginTop: 7 }} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[typography.body, { color: theme.primaryText, fontWeight: '300', flex: 1 }]}>{item.schedule}</Text>
        <Text style={{ fontSize: 14, fontWeight: '400', color: theme.secondaryText }}>
          {startDate.format('M월 D일')}
          {!isSameDay && ` ~ ${endDate.format('M월 D일')}`}
          {endDate.diff(startDate, 'day') > 0 && ` (${endDate.diff(startDate, 'day') + 1}일간)`}
        </Text>
      </View>
    </View>
  );
};

export default ScheduleCard;
