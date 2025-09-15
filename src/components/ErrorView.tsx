import React from 'react';
import {Text, TouchableOpacity, View, ViewStyle} from 'react-native';

import {useTheme} from '@/contexts/ThemeContext';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

interface ErrorViewProps {
  message?: string;
  onRetry?: () => void;
  isOffline?: boolean;
  style?: ViewStyle;
}

const ErrorView = ({
  message = '문제가 발생했습니다',
  onRetry,
  isOffline = false,
  style,
}: ErrorViewProps) => {
  const {theme, typography} = useTheme();

  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          gap: 16,
        },
        style,
      ]}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: theme.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <FontAwesome6 
          name={isOffline ? 'wifi' : 'exclamation-triangle'} 
          size={28} 
          color={theme.highlight} 
          iconStyle="solid" 
        />
      </View>
      
      <View style={{alignItems: 'center', gap: 8}}>
        <Text style={[typography.body, {color: theme.primaryText, fontWeight: '600'}]}>
          {isOffline ? '오프라인 상태입니다' : message}
        </Text>
        <Text style={[typography.caption, {color: theme.secondaryText, textAlign: 'center'}]}>
          {isOffline 
            ? '인터넷 연결을 확인해주세요' 
            : '잠시 후 다시 시도해주세요'}
        </Text>
      </View>

      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 20,
            backgroundColor: theme.highlight,
            borderRadius: 8,
          }}
          accessibilityLabel="다시 시도">
          <Text style={[typography.body, {color: 'white', fontWeight: '600'}]}>
            다시 시도
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export const OfflineBanner = () => {
  const {theme, typography} = useTheme();
  
  return (
    <View
      style={{
        backgroundColor: theme.highlight,
        paddingVertical: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}>
      <FontAwesome6 name="wifi" size={14} color="white" iconStyle="solid" />
      <Text style={[typography.caption, {color: 'white', fontWeight: '600'}]}>
        오프라인 모드 - 캐시된 데이터를 표시합니다
      </Text>
    </View>
  );
};

export default ErrorView;