import dayjs from 'dayjs';
import React, {useState} from 'react';
import {Easing, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

import Card from '@/components/Card';
import Container from '@/components/Container';
import TouchableScale from '@/components/TouchableScale';
import {theme} from '@/styles/theme';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

const noti = [
  {
    title: '테스트',
    date: '2025-01-11',
    content: '테스트 공지 내용입니다.\n테스트 공지 내용입니다.\n테스트 공지 내용입니다.',
  },
];

const Notifications = () => {
  const [expandedIndices, setExpandedIndices] = useState<number[]>([]);

  const handlePress = (index: number) => {
    setExpandedIndices(prevIndices => (prevIndices.includes(index) ? prevIndices.filter(i => i !== index) : [...prevIndices, index]));
  };

  return (
    <Container scrollView>
      <View style={{gap: 16, width: '100%'}}>
        {noti.map((item, index) => {
          const date = dayjs(item.date).format('MM월 DD일');
          const isNew = dayjs().diff(dayjs(item.date), 'day') < 7;
          const icon = <FontAwesome6 name="bullhorn" size={16} color={theme.colors.primaryText} iconStyle="solid" />;

          return (
            <TouchableScale key={index} pressInEasing={Easing.elastic(0.5)} pressOutEasing={Easing.elastic(0.5)} pressInDuration={200} pressOutDuration={200} scaleTo={0.98} onPress={() => handlePress(index)}>
              <TouchableOpacity>
                <Card title={item.title} titleIcon={icon} subtitle={date} arrow notificationDot={isNew}>
                  {expandedIndices.includes(index) && <Text style={s.content}>{item.content}</Text>}
                </Card>
              </TouchableOpacity>
            </TouchableScale>
          );
        })}
      </View>
    </Container>
  );
};

const s = StyleSheet.create({
  content: {
    color: theme.colors.primaryText,
    fontFamily: theme.fontWeights.regular,
    fontSize: 16,
    lineHeight: 24,
  },
});

export default Notifications;
