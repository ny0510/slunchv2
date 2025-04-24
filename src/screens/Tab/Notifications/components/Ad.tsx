import React from 'react';
import {useEffect, useState} from 'react';
import {Text, View} from 'react-native';
import {NativeAd, NativeAdChoicesPlacement, NativeAdView, NativeAsset, NativeAssetType, NativeMediaAspectRatio, NativeMediaView, TestIds} from 'react-native-google-mobile-ads';
import LinearGradient from 'react-native-linear-gradient';

import Loading from '@/components/Loading';
import {theme} from '@/styles/theme';

const Ad = ({adUnitId}: {adUnitId: string}) => {
  const [nativeAd, setNativeAd] = useState<NativeAd>();

  if (__DEV__) {
    adUnitId = TestIds.NATIVE_VIDEO;
  }

  useEffect(() => {
    NativeAd.createForAdRequest(adUnitId, {adChoicesPlacement: NativeAdChoicesPlacement.BOTTOM_RIGHT, aspectRatio: NativeMediaAspectRatio.LANDSCAPE}).then(setNativeAd).catch(console.error);
  }, [adUnitId]);

  useEffect(() => {
    if (!nativeAd) {
      return;
    }
    return () => nativeAd.destroy();
  }, [nativeAd]);

  if (!nativeAd) {
    return (
      <View style={{width: '100%', height: 200, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, marginBottom: 16, backgroundColor: theme.colors.card, justifyContent: 'center', alignItems: 'center'}}>
        <Loading color={theme.colors.secondaryText} />
      </View>
    );
  }

  return (
    <View style={{borderBottomLeftRadius: 8, borderBottomRightRadius: 8, marginBottom: 16, backgroundColor: theme.colors.card, overflow: 'hidden'}}>
      <LinearGradient colors={[theme.colors.background, 'transparent']} style={{position: 'absolute', top: 0, left: 0, right: 0, height: 15, zIndex: 10}} />
      <NativeAdView nativeAd={nativeAd}>
        <NativeMediaView resizeMode="cover" style={{width: '100%', aspectRatio: 16 / 9}} />
        <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between', alignItems: 'flex-end', flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16}}>
          <View style={{backgroundColor: `${theme.colors.card}90`, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8}}>
            <NativeAsset assetType={NativeAssetType.HEADLINE}>
              <Text style={{color: theme.colors.primaryText, fontFamily: theme.fontWeights.medium, fontSize: 12}}>{nativeAd.headline}</Text>
            </NativeAsset>
          </View>
          <View style={{backgroundColor: `${theme.colors.card}90`, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8}}>
            <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
              <Text style={{color: theme.colors.primaryText, fontFamily: theme.fontWeights.medium, fontSize: 12}}>{nativeAd.callToAction}</Text>
            </NativeAsset>
          </View>
        </View>
      </NativeAdView>
    </View>
  );
};

export default Ad;
