/**
 * 테마 상수 정의
 * 앱 전체에서 일관된 디자인 시스템을 위한 상수들
 */

// 간격 상수
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// 테두리 반지름 상수
export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

// 폰트 크기 상수
export const FONT_SIZE = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  huge: 32,
} as const;

// 폰트 두께 상수
export const FONT_WEIGHT = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

// 패딩 상수 (자주 사용되는 조합)
export const PADDING = {
  button: {
    horizontal: SPACING.xl,
    vertical: SPACING.lg,
  },
  card: {
    horizontal: SPACING.xl,
    vertical: SPACING.lg,
  },
  screen: {
    horizontal: SPACING.xl,
    vertical: SPACING.lg,
  },
  input: {
    horizontal: SPACING.lg,
    vertical: SPACING.md,
  },
} as const;

// 그림자 상수
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

// 애니메이션 지속시간 상수
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 250,
  slow: 350,
  very_slow: 500,
} as const;

// 투명도 상수
export const OPACITY = {
  disabled: 0.3,
  light: 0.5,
  medium: 0.7,
  heavy: 0.9,
} as const;

// 알려진 크기 상수
export const SIZES = {
  notification_dot: {
    width: 12,
    height: 12,
  },
  icon: {
    small: 16,
    medium: 20,
    large: 24,
    xlarge: 32,
  },
  input_height: 48,
  button_height: 48,
  card_min_height: 80,
} as const;

// 색상 상수 (테마와 독립적인 고정 색상)
export const FIXED_COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  primary: '#7956FC',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
} as const;

// 타입 정의
export type SpacingKey = keyof typeof SPACING;
export type BorderRadiusKey = keyof typeof BORDER_RADIUS;
export type FontSizeKey = keyof typeof FONT_SIZE;
export type FontWeightKey = keyof typeof FONT_WEIGHT;
export type ShadowKey = keyof typeof SHADOWS;
export type AnimationDurationKey = keyof typeof ANIMATION_DURATION;
export type OpacityKey = keyof typeof OPACITY;
export type FixedColorKey = keyof typeof FIXED_COLORS;