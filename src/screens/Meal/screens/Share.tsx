import React from 'react';
import {Text, View} from 'react-native';
import {Easing} from 'react-native-reanimated';
import Share, {ShareSingleOptions, Social} from 'react-native-share';
import ViewShot from 'react-native-view-shot';

import Logo from '@/assets/images/logo.svg';
import Container from '@/components/Container';
import TouchableScale from '@/components/TouchableScale';
import {useTheme} from '@/contexts/ThemeContext';
import {showToast} from '@/lib/toast';
import {RootStackParamList} from '@/navigation/RootStacks';
import analytics from '@react-native-firebase/analytics';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {StackScreenProps} from '@react-navigation/stack';

const ShareScreen = ({route}: StackScreenProps<RootStackParamList, 'Share'>) => {
  const {data} = route.params;
  const viewShotRef = React.useRef<ViewShot>(null);

  const {theme, typography} = useTheme();

  const shareToInstagramStory = async () => {
    analytics().logEvent('share_to_instagram_story');
    const capturedImage = await viewShotRef.current?.capture?.();

    if (!capturedImage) {
      console.log('Failed to capture image');
      return showToast('이미지 캡처에 실패했어요.');
    }

    console.log('Captured image:', capturedImage);

    // const image = Platform.OS === 'android' ? capturedImage : `file://${capturedImage}`;
    const shareOptions: ShareSingleOptions = {
      title: `${data.school} ${data.date} 급식`,
      stickerImage: `data:image/png;base64,${capturedImage}`,
      social: Social.InstagramStories,
      appId: '219376304',
      backgroundBottomColor: theme.background,
      backgroundTopColor: theme.card,
    };

    try {
      const share = await Share.shareSingle(shareOptions);
      if (!share.success) {
        throw new Error(`Share failed: ${share.message}`);
      }
    } catch (e) {
      const err = e as Error;
      showToast('공유에 실패했어요.');
      console.error('Error sharing', err);
    }
  };

  return (
    <Container style={{flex: 1, justifyContent: 'space-around', alignItems: 'center'}}>
      <View />
      <TouchableScale scaleTo={0.98}>
        <ViewShot options={{format: 'png', result: 'base64'}} ref={viewShotRef} style={{alignItems: 'center'}}>
          <View
            style={{
              width: '95%',
              aspectRatio: 1 / 1,
              justifyContent: 'space-between',
              borderColor: theme.highlightLight,
              borderWidth: 6,
              padding: 22,
              backgroundColor: theme.background,
            }}>
            <View>
              <Text style={[typography.body, {color: theme.primaryText}]}>{data.date}</Text>
              <Text style={[typography.body, {color: theme.primaryText}]}>{data.school} 급식</Text>
            </View>
            <View>
              {data.meal.split('\n').map((meal, index) => (
                <Text key={index} style={[typography.body, {fontWeight: '700', color: theme.primaryText, fontSize: 20}]} numberOfLines={1} adjustsFontSizeToFit>
                  {meal}
                </Text>
              ))}
            </View>
            <View style={{position: 'absolute', top: 22, right: 22, flexDirection: 'row', alignItems: 'center', gap: 4, opacity: 0.8}}>
              <Logo width={14} height={14} />
              <Text style={[typography.caption, {color: theme.primaryText, fontWeight: '400'}]}>NYL</Text>
            </View>
          </View>
        </ViewShot>
      </TouchableScale>

      <TouchableScale pressInEasing={Easing.elastic(1.5)} pressOutEasing={Easing.elastic(1.5)} pressInDuration={150} pressOutDuration={150} scaleTo={0.97} style={{width: '95%'}} onPress={shareToInstagramStory}>
        <View style={{paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center', gap: 5, backgroundColor: theme.card, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignContent: 'center'}}>
          <FontAwesome6 name="instagram" size={20} color={theme.primaryText} iconStyle="brand" />
          <Text style={[typography.subtitle, {color: theme.primaryText}]}>공유하기</Text>
        </View>
      </TouchableScale>
    </Container>
  );
};

export default ShareScreen;
