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
    <Card>
      <NativeAdView nativeAd={nativeAd} style={{flexDirection: 'row', gap: 16}}>
        {nativeAd.icon && (
          <View style={{flexShrink: 0, alignSelf: 'center'}}>
            <NativeAsset assetType={NativeAssetType.ICON}>
              <Image source={{uri: nativeAd.icon.url}} width={55} height={55} style={{borderRadius: 55 / 2}} />
            </NativeAsset>
          </View>
        )}
        <View style={{flexShrink: 1}}>
          <NativeAsset assetType={NativeAssetType.HEADLINE}>
            <Text style={[typography.title, {color: theme.primaryText, fontWeight: '700', fontSize: 20}]}>{nativeAd.headline}</Text>
          </NativeAsset>
          <NativeAsset assetType={NativeAssetType.BODY}>
            <Text style={[typography.body, {color: theme.primaryText, fontWeight: '300'}]}>{nativeAd.body}</Text>
          </NativeAsset>
        </View>
      </NativeAdView>
    </Card>
  );
};

export default NativeAdCard;
