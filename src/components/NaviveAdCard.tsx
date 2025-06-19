import React, {useEffect, useState} from 'react';
import {Image, Text, View} from 'react-native';
import {NativeAd, NativeAdChoicesPlacement, NativeAdView, NativeAsset, NativeAssetType, NativeMediaAspectRatio, TestIds} from 'react-native-google-mobile-ads';

import Loading from './Loading';
import Card from '@/components/Card';
import {useTheme} from '@/contexts/ThemeContext';

const NativeAdCard = ({adUnitId}: {adUnitId: string}) => {
  const {theme, typography} = useTheme();
  const [nativeAd, setNativeAd] = useState<NativeAd>();

  if (__DEV__) {
    adUnitId = TestIds.NATIVE;
  }

  useEffect(() => {
    NativeAd.createForAdRequest(adUnitId, {adChoicesPlacement: NativeAdChoicesPlacement.BOTTOM_RIGHT, aspectRatio: NativeMediaAspectRatio.SQUARE}).then(setNativeAd).catch(console.error);
  }, [adUnitId]);

  useEffect(() => {
    if (!nativeAd) {
      return;
    }
    return () => nativeAd.destroy();
  }, [nativeAd]);

  if (!nativeAd) {
    return (
      <Card style={{height: 100}}>
        <Loading color={theme.secondaryText} />
      </Card>
    );
  }

  return (
    <Card
      style={{
        borderWidth: 1,
        borderColor: theme.secondaryText + '40',
        backgroundColor: theme.background + 'F0',
      }}>
      <NativeAdView nativeAd={nativeAd} style={{flexDirection: 'row', gap: 16}}>
        <View style={{flexDirection: 'column', gap: 8, alignItems: 'center'}}>
          <NativeAsset assetType={NativeAssetType.ADVERTISER}>
            <View
              style={{
                backgroundColor: '#FFD700',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 3,
                zIndex: 1,
                borderWidth: 1,
                borderColor: '#FFA500',
                alignSelf: 'flex-start',
              }}>
              <Text style={{color: '#000000', fontSize: 12, fontWeight: '500'}}>AD · 광고</Text>
            </View>
          </NativeAsset>
          {nativeAd.icon && (
            <NativeAsset assetType={NativeAssetType.ICON}>
              <Image source={{uri: nativeAd.icon.url}} width={55} height={55} style={{borderRadius: 55 / 2}} />
            </NativeAsset>
          )}
        </View>
        <View style={{flexShrink: 1}}>
          <NativeAsset assetType={NativeAssetType.HEADLINE}>
            <Text style={[typography.title, {color: theme.primaryText, fontWeight: '700', fontSize: 20}]}>{nativeAd.headline}</Text>
          </NativeAsset>
          <NativeAsset assetType={NativeAssetType.BODY}>
            <Text style={[typography.body, {color: theme.primaryText, fontWeight: '300'}]} numberOfLines={2}>
              {nativeAd.body}
            </Text>
          </NativeAsset>
          {nativeAd.callToAction && (
            <View style={{backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, alignSelf: 'flex-start', marginTop: 8}}>
              <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: '600',
                  }}>
                  {nativeAd.callToAction}
                </Text>
              </NativeAsset>
            </View>
          )}
        </View>
      </NativeAdView>
    </Card>
  );
};

export default NativeAdCard;
