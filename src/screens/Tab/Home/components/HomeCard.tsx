import React, {ReactNode} from 'react';

import Card from '@/components/Card';
import TouchableScale from '@/components/TouchableScale';

interface HomeCardProps {
  title?: string;
  titleIcon?: ReactNode;
  arrow?: boolean;
  onPress?: () => void;
  notificationDot?: boolean;
  children?: ReactNode;
}

const HomeCard = ({title, titleIcon, arrow, onPress, notificationDot, children, ...rest}: HomeCardProps) => (
  <TouchableScale onPress={onPress} scaleTo={0.98} {...rest}>
    <Card title={title} titleIcon={titleIcon} arrow={arrow} notificationDot={notificationDot}>
      {children}
    </Card>
  </TouchableScale>
);

export default HomeCard;