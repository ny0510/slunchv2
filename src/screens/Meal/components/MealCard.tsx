import React, { useEffect, useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { trigger } from 'react-native-haptic-feedback';
import TouchableScale from 'react-native-touchable-scale';
import dayjs from 'dayjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

import { useTheme } from '@/contexts/ThemeContext';
import { RootStackParamList } from '@/navigation/RootStacks';
import { Meal as MealType } from '@/types/api';
import { MealItem } from '@/types/meal';

interface MealCardProps {
    date: dayjs.Dayjs;
    isToday: boolean;
    meal: MealType;
    mealType?: string;
    showAllergy: boolean;
    onLongPress: () => void;
}

const MealCard = ({ date, isToday, meal, mealType, showAllergy, onLongPress }: MealCardProps) => {
    const { theme, typography } = useTheme();
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const schoolName = useRef<string>('알 수 없음');

    useEffect(() => {
        (async () => {
            const school = JSON.parse((await AsyncStorage.getItem('school')) || '{}');
            schoolName.current = school.schoolName;
        })();
    }, []);

    const getMealTypeColor = (type?: string) => {
        if (!type) return theme.primaryText;
        if (type.includes('조식')) return '#FF9500';
        if (type.includes('중식')) return theme.highlight;
        if (type.includes('석식')) return theme.highlightSecondary;
        return theme.primaryText;
    };

    const renderMealItem = (mealItem: string | MealItem, index: number) => {
        if (typeof mealItem === 'string') {
            return (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.secondaryText }} />
                    <Text style={[typography.body, { color: theme.primaryText, fontWeight: '300', flex: 1 }]}>{mealItem}</Text>
                </View>
            );
        }

        const allergyInfo = showAllergy && mealItem.allergy && mealItem.allergy.length > 0
            ? ` ${mealItem.allergy.map(allergy => allergy.code).join(', ')}`
            : '';

        return (
            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.secondaryText }} />
                <Text style={[typography.body, { color: theme.primaryText, fontWeight: '300', flex: 1 }]}>
                    {mealItem.food}
                    <Text style={[typography.small, { color: theme.secondaryText }]}>{allergyInfo}</Text>
                </Text>
            </View>
        );
    };

    const mealData = meal.meal.filter(mealItem => typeof mealItem === 'string' || (mealItem as MealItem).food !== '');
    const mealText = mealData.map(mealItem => (typeof mealItem === 'string' ? mealItem : (mealItem as MealItem).food)).join('\n');

    const handleShare = () => {
        trigger('impactLight');
        navigation.navigate('Share', {
            data: {
                meal: mealText,
                date: date.format('M월 D일 ddd요일'),
                school: schoolName.current
            }
        });
    };

    return (
        <TouchableScale onLongPress={onLongPress} activeScale={0.98} tension={100} friction={10} style={{ marginBottom: 4 }}>
            <View
                style={{
                    backgroundColor: isToday ? `${theme.highlight}10` : theme.card,
                    borderRadius: 16,
                    padding: 20,
                    borderWidth: isToday ? 1 : 0,
                    borderColor: isToday ? `${theme.highlight}80` : 'transparent',
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                        <Text style={[typography.subtitle, { color: theme.primaryText, fontWeight: '600' }]}>
                            {date.format('M월 D일 (ddd)')}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {mealType && <Text style={[typography.caption, { color: getMealTypeColor(mealType), fontWeight: '600' }]}>{mealType}</Text>}
                    </View>
                </View>

                <View style={{ gap: 2 }}>
                    {meal.meal.map((item, idx) => renderMealItem(item, idx))}
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.border }}>
                    {meal.calorie && <Text style={[typography.caption, { color: theme.secondaryText }]}>{meal.calorie} kcal</Text>}
                    <TouchableOpacity onPress={handleShare} style={{ padding: 4 }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <FontAwesome6 name="share-from-square" size={14} color={theme.secondaryText} iconStyle="solid" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableScale>
    );
};

export default MealCard;
