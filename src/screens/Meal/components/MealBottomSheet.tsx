import React, { forwardRef, useCallback, useEffect, useState } from 'react';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAnalytics, logEvent } from '@react-native-firebase/analytics';
import Clipboard from '@react-native-clipboard/clipboard';
import Share from 'react-native-share';
import { NavigationProp, useNavigation } from '@react-navigation/native';

import Content from '../../Tab/Settings/components/Content';
import { useTheme } from '@/contexts/ThemeContext';
import { showToast } from '@/lib/toast';
import { RootStackParamList } from '@/navigation/RootStacks';

interface MealBottomSheetProps {
    selectedMeal: string;
    selectedMealDate: string;
    onClose: () => void;
}

const MealBottomSheet = forwardRef<BottomSheet, MealBottomSheetProps>(({ selectedMeal, selectedMealDate, onClose }, ref) => {
    const { theme } = useTheme();
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [schoolName, setSchoolName] = useState<string>('알 수 없음');

    useEffect(() => {
        (async () => {
            const school = JSON.parse((await AsyncStorage.getItem('school')) || '{}');
            setSchoolName(school.schoolName);
        })();
    }, []);

    const renderBackdrop = useCallback((props: any) => (
        <BottomSheetBackdrop {...props} pressBehavior="close" disappearsOnIndex={-1} />
    ), []);

    const handleCopy = () => {
        logEvent(getAnalytics(), 'meal_copy');
        Clipboard.setString(`🍴${schoolName} ${selectedMealDate} 급식\n\n- ${selectedMeal.split('\n').join('\n- ')}`);
        showToast('클립보드에 복사되었어요.');
        onClose();
    };

    const handleTextShare = () => {
        logEvent(getAnalytics(), 'meal_share');
        Share.open({
            title: `${schoolName} ${selectedMealDate} 급식`,
            message: `🍴${schoolName} ${selectedMealDate} 급식\n\n- ${selectedMeal.split('\n').join('\n- ')}`,
            type: 'text/plain',
        })
            .then(res => console.log(res))
            .catch(err => console.log(err));
        onClose();
    };

    const handleImageShare = () => {
        logEvent(getAnalytics(), 'meal_instagram_share');
        navigation.navigate('Share', { data: { meal: selectedMeal, date: selectedMealDate, school: schoolName } });
        onClose();
    };

    return (
        <BottomSheet
            backdropComponent={renderBackdrop}
            ref={ref}
            index={-1}
            enablePanDownToClose
            onClose={onClose}
            backgroundStyle={{ backgroundColor: theme.card, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
            handleIndicatorStyle={{ backgroundColor: theme.secondaryText }}
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
        >
            <BottomSheetView style={{ paddingHorizontal: 18, paddingBottom: 12, gap: 16, backgroundColor: theme.card, justifyContent: 'center' }}>
                <Content title="복사하기" arrow onPress={handleCopy} />
                <Content title="텍스트로 공유하기" arrow onPress={handleTextShare} />
                <Content title="이미지로 공유하기" arrow onPress={handleImageShare} />
            </BottomSheetView>
        </BottomSheet>
    );
});

export default MealBottomSheet;
