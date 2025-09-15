import React from 'react';
import {Text, View, ViewProps, TextStyle, ViewStyle} from 'react-native';

import {useTheme} from '@/contexts/ThemeContext';
import {BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, PADDING, SIZES, SPACING} from '@/theme/constants';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

interface CardProps extends Omit<ViewProps, 'style'> {
  /** 카드 제목 */
  title?: string;
  /** 제목 스타일 */
  titleStyle?: TextStyle;
  /** 카드 부제목 */
  subtitle?: string;
  /** 부제목 스타일 */
  subtitleStyle?: TextStyle;
  /** 오른쪽 화살표 표시 여부 */
  arrow?: boolean;
  /** 알림 점 표시 여부 */
  notificationDot?: boolean;
  /** 카드 스타일 */
  style?: ViewStyle;
  /** 제목 옆 아이콘 */
  titleIcon?: React.ReactNode;
  /** 제목 오른쪽 컴포넌트 */
  titleRight?: React.ReactNode;
  /** 자식 컴포넌트 */
  children?: React.ReactNode;
}

const Card = ({
  title,
  titleStyle,
  subtitle,
  subtitleStyle,
  style,
  arrow,
  titleIcon,
  titleRight,
  children,
  notificationDot,
  ...rest
}: CardProps) => {
  const {theme, typography} = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: theme.card,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: PADDING.card.horizontal,
    paddingVertical: PADDING.card.vertical,
    width: '100%',
    borderColor: theme.border,
    borderWidth: 1,
    gap: SPACING.sm,
    ...style,
  };

  const headerStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const titleContainerStyle: ViewStyle = {
    gap: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  };

  const rightContainerStyle: ViewStyle = {
    gap: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  };

  const titleTextStyle: TextStyle = {
    ...typography.baseTextStyle,
    color: theme.primaryText,
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.xxl,
    ...titleStyle,
  };

  const subtitleTextStyle: TextStyle = {
    ...typography.caption,
    color: theme.secondaryText,
    ...subtitleStyle,
  };

  const notificationDotStyle: ViewStyle = {
    width: SIZES.notification_dot.width,
    height: SIZES.notification_dot.height,
    borderRadius: SIZES.notification_dot.width / 2,
    backgroundColor: theme.highlight,
  };

  return (
    <View style={cardStyle} {...rest}>
      {title && (
        <View style={headerStyle}>
          <View style={titleContainerStyle}>
            {titleIcon}
            <Text style={titleTextStyle}>{title}</Text>
            {subtitle && <Text style={subtitleTextStyle}>{subtitle}</Text>}
          </View>
          <View style={rightContainerStyle}>
            {titleRight}
            {notificationDot && <View style={notificationDotStyle} />}
            {arrow && (
              <FontAwesome6
                name="angle-right"
                iconStyle="solid"
                size={SIZES.icon.medium}
                color={theme.secondaryText}
              />
            )}
          </View>
        </View>
      )}
      {children}
    </View>
  );
};

export default Card;
