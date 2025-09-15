import dayjs from 'dayjs';
import React, {useEffect, useState} from 'react';
import {RefreshControl, RefreshControlProps} from 'react-native';

import {useTheme} from '@/contexts/ThemeContext';
import {StorageHelper, STORAGE_KEYS} from '@/lib/storage';

interface CustomRefreshControlProps extends RefreshControlProps {
  onRefresh: () => void | Promise<void>;
}

const CustomRefreshControl = ({onRefresh, ...props}: CustomRefreshControlProps) => {
  const {theme} = useTheme();
  const [lastRefreshTime, setLastRefreshTime] = useState<string | null>(null);

  useEffect(() => {
    // 마지막 새로고침 시간 불러오기
    StorageHelper.getItem(STORAGE_KEYS.LAST_REFRESH_TIME, null).then(time => {
      if (time) {
        setLastRefreshTime(time);
      }
    });
  }, []);

  const handleRefresh = async () => {
    const now = dayjs().format('HH:mm');
    await StorageHelper.setItem(STORAGE_KEYS.LAST_REFRESH_TIME, now);
    setLastRefreshTime(now);
    
    if (onRefresh) {
      await onRefresh();
    }
  };

  return (
    <RefreshControl
      {...props}
      onRefresh={handleRefresh}
      tintColor={theme.secondaryText}
      colors={[theme.secondaryText]} // Android
      title={lastRefreshTime ? `마지막 업데이트: ${lastRefreshTime}` : '당겨서 새로고침'} // iOS
      titleColor={theme.secondaryText} // iOS
    />
  );
};

export default CustomRefreshControl;