import { useCallback, useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMeal } from '@/api';
import { clearCache } from '@/lib/cache';
import { showToast } from '@/lib/toast';
import { Meal as MealType } from '@/types/api';
import { useFocusEffect } from '@react-navigation/native';

export const useMealData = () => {
    const [meal, setMeal] = useState<MealType[]>([]);
    const [showAllergy, setShowAllergy] = useState<boolean>(false);
    const [prevShowAllergy, setPrevShowAllergy] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [currentMonth, setCurrentMonth] = useState<dayjs.Dayjs>(dayjs());

    const initialLoadDone = useRef<boolean>(false);
    const isAutoLoading = useRef<boolean>(false);

    const fetchData = useCallback(async (month?: dayjs.Dayjs, append: boolean = false) => {
        const settings = JSON.parse((await AsyncStorage.getItem('settings')) || '{}');
        const today = dayjs();
        const targetMonth = month || today;
        const currentShowAllergy = settings.showAllergy || false;

        // We need to update showAllergy state here to keep it in sync
        setShowAllergy(currentShowAllergy);
        setPrevShowAllergy(currentShowAllergy);

        try {
            const school = JSON.parse((await AsyncStorage.getItem('school')) || '{}');

            const mealResponse = await getMeal(
                school.neisCode,
                school.neisRegionCode,
                targetMonth.format('YYYY'),
                targetMonth.format('MM'),
                undefined,
                currentShowAllergy,
                true,
                true
            );

            const mealArray = Array.isArray(mealResponse) ? mealResponse : [];
            let filteredMeals = mealArray;

            if (!append) {
                filteredMeals = mealArray.filter(m => dayjs(m.date).isSame(today, 'day') || dayjs(m.date).isAfter(today, 'day'));
            }

            let newMealsCount = 0;
            if (append) {
                setMeal(prev => {
                    const existingKeys = new Set(prev.map(m => `${m.date}-${m.type}`));
                    const uniqueNewMeals = filteredMeals.filter(m => !existingKeys.has(`${m.date}-${m.type}`));
                    const newMeals = [...prev, ...uniqueNewMeals];
                    newMealsCount = newMeals.length;
                    return newMeals;
                });
            } else {
                setMeal(filteredMeals);
                newMealsCount = filteredMeals.length;
            }

            if (mealArray.length > 0) {
                setHasMore(true);
            }

            return newMealsCount;
        } catch (e) {
            console.error('Error fetching data:', e);
            if (!append) {
                showToast('급식을 불러오는 중 오류가 발생했어요.');
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    const loadMore = useCallback(async (silent: boolean = false) => {
        if (loadingMore || !hasMore) return;

        const nextMonth = currentMonth.add(1, 'month');
        const limitDate = dayjs().add(1, 'year').month(1).endOf('month');

        if (nextMonth.isAfter(limitDate, 'month')) {
            setHasMore(false);
            if (!silent) {
                showToast('더 이상 급식 데이터가 없어요.');
            }
            return;
        }

        setLoadingMore(true);
        setCurrentMonth(nextMonth);
        await fetchData(nextMonth, true);
    }, [loadingMore, hasMore, currentMonth, fetchData]);

    const onRefresh = useCallback(async () => {
        initialLoadDone.current = false;
        setRefreshing(true);
        await clearCache('@cache/meal');
        setCurrentMonth(dayjs());
        setHasMore(true);
        await fetchData();
        setRefreshing(false);
        setTimeout(() => {
            initialLoadDone.current = true;
        }, 100);
    }, [fetchData]);

    useEffect(() => {
        if (!initialLoadDone.current) {
            fetchData().then(() => {
                initialLoadDone.current = true;
            });
        }
    }, [fetchData]);

    useEffect(() => {
        if (initialLoadDone.current && !loading && !loadingMore && !refreshing && meal.length < 10 && hasMore && !isAutoLoading.current) {
            isAutoLoading.current = true;
            loadMore(true).finally(() => {
                isAutoLoading.current = false;
            });
        }
    }, [loading, loadingMore, refreshing, meal.length, hasMore, loadMore]);

    useFocusEffect(
        useCallback(() => {
            const checkAllergySettingChange = async () => {
                const settings = JSON.parse((await AsyncStorage.getItem('settings')) || '{}');
                const currentShowAllergy = settings.showAllergy || false;

                if (prevShowAllergy !== currentShowAllergy) {
                    setRefreshing(true);
                    await clearCache('@cache/meal_');
                    setCurrentMonth(dayjs());
                    setHasMore(true);
                    await fetchData();
                    setRefreshing(false);
                }
            };

            checkAllergySettingChange();
        }, [prevShowAllergy, fetchData])
    );

    return {
        meal,
        showAllergy,
        loading,
        refreshing,
        loadingMore,
        hasMore,
        onRefresh,
        loadMore,
    };
};
