import React, {ReactNode} from 'react';

import Card from '@/components/Card';
import TouchableScale from 'react-native-touchable-scale';

interface HomeCardProps {
  title?: string;
  titleIcon?: ReactNode;
  arrow?: boolean;
  onPress?: () => void;
  notificationDot?: boolean;
  children?: ReactNode;
}

const HomeCard = ({title, titleIcon, arrow, onPress, notificationDot, children, ...rest}: HomeCardProps) => (
  <TouchableScale 
    onPress={onPress} 
    activeScale={0.98}
    tension={40}
    friction={3}
    useNativeDriver
    delayPressIn={100}  // 스크롤 시작 시 터치 무시
    {...rest}
  >
    <Card title={title} titleIcon={titleIcon} arrow={arrow} notificationDot={notificationDot}>
      {children}
    </Card>
  </TouchableScale>
);

export default HomeCard;