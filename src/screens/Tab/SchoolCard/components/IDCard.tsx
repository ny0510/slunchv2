import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {interpolate, useAnimatedStyle, useSharedValue, withSpring} from 'react-native-reanimated';

import Barcode from './Barcode';
import {useTheme} from '@/contexts/ThemeContext';

interface Props {
  name: string;
  schoolName: string;
  generation: string;
  grade: string;
  classNum: string;
  number: string;
  barcodeValue: string;
  handleBarcodePress: () => void;
}

const IDCard: React.FC<Props> = ({name, schoolName, generation, grade, classNum, number, barcodeValue, handleBarcodePress}) => {
  const {theme, typography} = useTheme();

  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onUpdate(event => {
      rotateX.value = interpolate(event.translationY, [-80, 80], [-10, 10]);
      rotateY.value = interpolate(event.translationX, [-80, 80], [10, -10]);
    })
    .onEnd(() => {
      rotateX.value = withSpring(0);
      rotateY.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{perspective: 1000}, {rotateX: `${rotateX.value}deg`}, {rotateY: `${rotateY.value}deg`}],
    borderWidth: 1,
    borderColor: theme.border,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          animatedStyle,
          {
            justifyContent: 'space-between',
            aspectRatio: 3 / 3.7,
            backgroundColor: theme.card,
            width: '85%',
            borderRadius: 12,
            padding: 16,
            paddingTop: 26,
            paddingBottom: 0,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.3,
            shadowRadius: 6,
          },
        ]}>
        <View>
          <Text style={[typography.caption, {color: theme.primaryText}]}>{schoolName} 모바일 학생증</Text>
        </View>
        <View style={{gap: 8}}>
          <View style={{flexDirection: 'row', gap: 4, alignItems: 'flex-end'}}>
            <Text style={[typography.title, {color: theme.primaryText, fontSize: 32, fontWeight: '700'}]}>{name}</Text>
            {generation && <Text style={[typography.caption, {color: theme.secondaryText}]}>{`${generation}기`}</Text>}
          </View>
          <View>
            <Text style={[typography.subtitle, {color: theme.secondaryText}]}>{`${grade}학년 ${classNum}반 ${number ? `${number}번` : ''}`}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleBarcodePress}>
          <View style={{justifyContent: 'center', alignItems: 'center', backgroundColor: theme.border, height: 100, marginHorizontal: -16, borderBottomRightRadius: 12, borderBottomLeftRadius: 12, marginTop: 16, gap: 4}}>
            <Barcode value={barcodeValue} format={'CODE128'} fill={theme.primaryText} />
            <Text style={[typography.caption, {color: theme.secondaryText}]}>{barcodeValue}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
};

export default IDCard;
