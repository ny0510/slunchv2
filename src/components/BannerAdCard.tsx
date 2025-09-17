import React from 'react';
import {useRef} from 'react';
import {Platform, View} from 'react-native';
import {BannerAd, BannerAdSize, TestIds, useForeground} from 'react-native-google-mobile-ads';

import {useTheme} from '@/contexts/ThemeContext';

const BannerAdCard = ({adUnitId}: {adUnitId: string}) => {
  const {theme} = useTheme();
  const bannerRef = useRef<BannerAd>(null);

  if (__DEV__) {
    adUnitId = TestIds.BANNER;
  }

  useForeground(() => {
    Platform.OS === 'ios' && bannerRef.current?.load();
  });

  return (
    <View style={{backgroundColor: theme.card, borderRadius: 12, padding: 6, borderColor: theme.border, borderWidth: 1}}>
      <View style={{borderRadius: 6, overflow: 'hidden', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', minHeight: 60}}>
        <BannerAd ref={bannerRef} unitId={adUnitId} size={BannerAdSize.FULL_BANNER} />
      </View>
    </View>
  );
};

export default BannerAdCard;
