import React from 'react';
import {Text, View} from 'react-native';
import Share, {ShareSingleOptions, Social} from 'react-native-share';
import TouchableScale from 'react-native-touchable-scale';
import ViewShot from 'react-native-view-shot';

import Logo from '@/assets/images/logo.svg';
import Container from '@/components/Container';
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

  const shareToImage = async () => {
    analytics().logEvent('share_to_image');
    const capturedImage = await viewShotRef.current?.capture?.();

    if (!capturedImage) {
      console.log('Failed to capture image');
      return showToast('이미지 캡처에 실패했어요.');
    }

    try {
      await Share.open({
        title: `${data.school} ${data.date} 급식`,
        url: `data:image/png;base64,${capturedImage}`,
        type: 'image/png',
        failOnCancel: false,
      });
    } catch (e) {
      const err = e as Error;
      showToast('공유에 실패했어요.');
      console.error('Error sharing', err);
    }
  };

  return (
    <Container style={{flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20}}>
      {/* Header with back button indication */}
      <View style={{alignSelf: 'flex-start', paddingTop: 8}}>
        <Text style={[typography.caption, {color: theme.secondaryText}]}>급식 이미지로 공유</Text>
      </View>

      {/* Enhanced preview card */}
      <View style={{flex: 1, justifyContent: 'center', paddingVertical: 20}}>
        <TouchableScale activeScale={0.98} tension={40} friction={3}>
          <ViewShot options={{format: 'png', result: 'base64'}} ref={viewShotRef} style={{alignItems: 'center'}}>
            <View
              style={{
                width: '100%',
                aspectRatio: 1 / 1,
                justifyContent: 'space-between',
                borderRadius: 16,
                padding: 24,
                backgroundColor: theme.card,
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 5,
              }}>
              {/* Date and school header */}
              <View style={{gap: 4}}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                  <FontAwesome6 name="calendar" size={14} color={theme.secondaryText} iconStyle="regular" />
                  <Text style={[typography.caption, {color: theme.secondaryText}]}>{data.date}</Text>
                </View>
                <Text style={[typography.subtitle, {color: theme.primaryText, fontWeight: '600'}]}>{data.school} 급식</Text>
              </View>
              
              {/* Meal items with improved layout */}
              <View style={{flex: 1, justifyContent: 'center', gap: 2}}>
                {data.meal.split('\n').map((meal, index) => (
                  <View key={index} style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                    <View style={{width: 4, height: 4, borderRadius: 2, backgroundColor: theme.highlight}} />
                    <Text style={[typography.body, {fontWeight: '600', color: theme.primaryText, fontSize: 17}]} numberOfLines={1} adjustsFontSizeToFit>
                      {meal}
                    </Text>
                  </View>
                ))}
              </View>
              
              {/* Watermark with improved positioning */}
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                  <Logo width={16} height={16} />
                  <Text style={[typography.body, {color: theme.secondaryText, fontWeight: '500'}]}>NYL</Text>
                </View>
                <FontAwesome6 name="utensils" size={14} color={theme.secondaryText} iconStyle="solid" />
              </View>
            </View>
          </ViewShot>
        </TouchableScale>
        
        {/* Preview hint */}
        <Text style={[typography.caption, {color: theme.secondaryText, textAlign: 'center', marginTop: 12}]}>미리보기</Text>
      </View>

      {/* Enhanced share buttons */}
      <View style={{width: '100%', gap: 12, paddingBottom: 8}}>
        <TouchableScale activeScale={0.98} tension={40} friction={3} onPress={shareToImage} delayPressIn={100}>
          <View style={{paddingVertical: 16, backgroundColor: theme.highlight, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8}}>
            <FontAwesome6 name="share-nodes" size={18} color="white" iconStyle="solid" />
            <Text style={[typography.subtitle, {color: 'white', fontWeight: '600'}]}>이미지로 공유하기</Text>
          </View>
        </TouchableScale>

        <TouchableScale activeScale={0.98} tension={40} friction={3} onPress={shareToInstagramStory} delayPressIn={100}>
          <View style={{paddingVertical: 16, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8}}>
            <FontAwesome6 name="instagram" size={18} color={theme.primaryText} iconStyle="brand" />
            <Text style={[typography.subtitle, {color: theme.primaryText}]}>인스타그램 스토리</Text>
          </View>
        </TouchableScale>
      </View>
    </Container>
  );
};

export default ShareScreen;
