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
            borderRadius: 16,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 8},
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
          },
        ]}>
        {/* Card gradient header */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 80,
            backgroundColor: theme.highlight + '10',
          }}
        />

        {/* Content */}
        <View style={{padding: 20, paddingBottom: 0, flex: 1}}>
          <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <View>
              <Text style={[typography.caption, {color: theme.secondaryText, fontWeight: '500'}]}>{schoolName}</Text>
              <Text style={[typography.caption, {color: theme.primaryText, fontWeight: '600', marginTop: 2}]}>모바일 학생증</Text>
            </View>
            <View style={{width: 40, height: 40, borderRadius: 20, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center'}}>
              <Text style={[typography.caption, {color: theme.highlight, fontWeight: '700'}]}>ID</Text>
            </View>
          </View>

          <View style={{gap: 12, flex: 1.5}}>
            <View style={{gap: 4}}>
              <Text style={[typography.title, {color: theme.primaryText, fontSize: 32, fontWeight: '700'}]}>{name}</Text>
              {generation && <Text style={[typography.body, {color: theme.secondaryText, fontWeight: '500'}]}>{`${generation}기`}</Text>}
            </View>
            <View style={{flexDirection: 'row', gap: 12}}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={[typography.body, {color: theme.secondaryText, fontWeight: '600'}]}>
                  {grade}학년 {classNum}반 {number ? `${number}번` : ''}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={handleBarcodePress} activeOpacity={0.8}>
          <View style={{justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background, paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.border}}>
            <Barcode value={barcodeValue} format={'CODE128'} fill={theme.primaryText} />
            <Text style={[typography.caption, {color: theme.secondaryText, marginTop: 4, fontWeight: '500'}]}>{barcodeValue}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
};

export default IDCard;
