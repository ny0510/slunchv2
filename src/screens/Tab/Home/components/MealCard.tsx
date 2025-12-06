import dayjs from 'dayjs';
import React, { useCallback, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { FlatList, Text, View } from 'react-native';
import TouchableScale from 'react-native-touchable-scale';

import { getMeal } from '@/api';
import Loading from '@/components/Loading';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { showToast } from '@/lib/toast';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Meal } from '@/types/api';
import { MealItem } from '@/types/meal';
import 'dayjs/locale/ko';

export interface MealCardRef {
  refresh: () => Promise<void>;
}

interface MealCardProps {
  onPress: () => void;
  onLongPress?: () => void;
}

const MealCard = forwardRef<MealCardRef, MealCardProps>(({ onPress, onLongPress }, ref) => {
  const [meal, setMeal] = useState<Meal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mealDayOffset, setMealDayOffset] = useState<number>(0);
  const [showAllergy, setShowAllergy] = useState<boolean>(true);

  const { theme, typography } = useTheme();
  const { schoolInfo } = useUser();

  const getSettings = useCallback(async () => {
    const settings = JSON.parse((await AsyncStorage.getItem('settings')) || '{}');
    const newShowAllergy = settings.showAllergy || false;
    setShowAllergy(newShowAllergy);
    return newShowAllergy;
  }, []);

  const fetchMeal = useCallback(async () => {
    if (!schoolInfo.neisCode || !schoolInfo.neisRegionCode) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const currentShowAllergy = await getSettings();

    try {
      const today = dayjs();
      let mealResponse = await getMeal(schoolInfo.neisCode, schoolInfo.neisRegionCode, today.format('YYYY'), today.format('MM'), today.format('DD'), currentShowAllergy, true, true);
      const isPastNoon = today.hour() > 14;
      setMealDayOffset(0);

      if (mealResponse.length === 0 || isPastNoon) {
        const nextDayPromises = [1, 2, 3].map(async i => {
          const nextDay = today.add(i, 'day');
          try {
            const data = await getMeal(schoolInfo.neisCode, schoolInfo.neisRegionCode, nextDay.format('YYYY'), nextDay.format('MM'), nextDay.format('DD'), currentShowAllergy, true, true);
            return { data, offset: i };
          } catch {
            return { data: [], offset: i };
          }
        });

        const nextDayResults = await Promise.all(nextDayPromises);
        const validResult = nextDayResults.find(result => result.data.length > 0);

        if (validResult) {
          mealResponse = validResult.data;
          setMealDayOffset(validResult.offset);
        }
      }
      setMeal(mealResponse);
    } catch (e) {
      console.error('Error fetching meal:', e);
      showToast('급식을 불러오는 중 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  }, [schoolInfo.neisCode, schoolInfo.neisRegionCode, getSettings]);

  useEffect(() => {
    fetchMeal();
  }, [fetchMeal]);

  useImperativeHandle(ref, () => ({
    refresh: fetchMeal,
  }));

  const renderMealItem = (mealItem: string | MealItem, index: number) => {
    if (typeof mealItem === 'string') {
      return (
        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.secondaryText }} />
          <Text style={[typography.body, { color: theme.primaryText, fontWeight: '300', flex: 1 }]}>{mealItem}</Text>
        </View>
      );
    }

    const allergyInfo = showAllergy && mealItem.allergy && mealItem.allergy.length > 0 ? ` ${mealItem.allergy.map(allergy => allergy.code).join(', ')}` : '';

    return (
      <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.secondaryText }} />
        <Text style={[typography.body, { color: theme.primaryText, fontWeight: '300', flex: 1 }]}>
          {mealItem.food}
          <Text style={{ fontSize: 12, color: theme.secondaryText }}>{allergyInfo}</Text>
        </Text>
      </View>
    );
  };

  return (
    <TouchableScale onLongPress={onLongPress} onPress={onPress} activeScale={0.98} tension={100} friction={10}>
      <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 20, gap: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <FontAwesome6 name="utensils" size={16} color={theme.primaryText} iconStyle="solid" />
            <Text style={[typography.baseTextStyle, { color: theme.primaryText, fontWeight: '600', fontSize: 18 }]}>급식</Text>
          </View>
          <FontAwesome6 name="chevron-right" iconStyle="solid" size={14} color={theme.secondaryText} />
        </View>

        {loading ? (
          <LoadingView height={100} />
        ) : meal.length === 0 ? (
          <Text style={[typography.body, { color: theme.secondaryText }]}>급식 정보가 없어요.</Text>
        ) : (
          <View style={{ gap: 4 }}>
            <FlatList
              data={meal}
              renderItem={({ item }) => <View style={{ gap: 2 }}>{item.meal.map(renderMealItem)}</View>}
              scrollEnabled={false}
            />
            {mealDayOffset > 0 && (
              <Text style={[typography.caption, { color: theme.secondaryText, marginTop: 4 }]}>
                {mealDayOffset}일 뒤, {dayjs().add(mealDayOffset, 'day').format('dddd')} 급식이에요.
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableScale>
  );
});

MealCard.displayName = 'MealCard';

const LoadingView = ({ height }: { height: number }) => (
  <View style={{ justifyContent: 'center', alignItems: 'center', height }}>
    <Loading />
  </View>
);

export default MealCard;
