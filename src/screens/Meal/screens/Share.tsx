import React from 'react';
import {PermissionsAndroid, Platform, Text, View} from 'react-native';
import Share, {ShareSingleOptions, Social} from 'react-native-share';
import TouchableScale from 'react-native-touchable-scale';
import ViewShot from 'react-native-view-shot';

import Logo from '@/assets/images/logo.svg';
import Container from '@/components/Container';
import {useTheme} from '@/contexts/ThemeContext';
import {showToast} from '@/lib/toast';
import {RootStackParamList} from '@/navigation/RootStacks';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import analytics from '@react-native-firebase/analytics';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {StackScreenProps} from '@react-navigation/stack';

const ShareScreen = ({route}: StackScreenProps<RootStackParamList, 'Share'>) => {
  const {data} = route.params;
  const viewShotRef = React.useRef<ViewShot>(null);

  const {theme, typography} = useTheme();

  const shareToInstagramStory = async () => {
    analytics().logEvent('share_to_instagram_story');
    const viewShot = viewShotRef.current;
    if (!viewShot) {
      return showToast('이미지 캡처에 실패했어요.');
    }

    // Capture as base64 for Instagram stories (change result temporarily)
    const capturedImage = await viewShot.capture?.();

    if (!capturedImage) {
      console.log('Failed to capture image');
      return showToast('이미지 캡처에 실패했어요.');
    }

    // For Instagram stories, we need to read the file and convert to base64
    const shareOptions: ShareSingleOptions = {
      title: `${data.school} ${data.date} 급식`,
      stickerImage: `file://${capturedImage}`,
      social: Social.InstagramStories,
      appId: '219376304',
      backgroundBottomColor: theme.highlightLight,
      backgroundTopColor: theme.highlightSecondary,
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
    const viewShot = viewShotRef.current;
    if (!viewShot) {
      return showToast('이미지 캡처에 실패했어요.');
    }

    const capturedImage = await viewShot.capture?.();

    if (!capturedImage) {
      console.log('Failed to capture image');
      return showToast('이미지 캡처에 실패했어요.');
    }

    try {
      await Share.open({
        title: `${data.school} ${data.date} 급식`,
        url: `file://${capturedImage}`,
        type: 'image/png',
        failOnCancel: false,
      });
    } catch (e) {
      const err = e as Error;
      showToast('공유에 실패했어요.');
      console.error('Error sharing', err);
    }
  };

  const hasAndroidPermission = async () => {
    const getCheckPermissionPromise = () => {
      const platformVersion = typeof Platform.Version === 'string' ? Number(Platform.Version) : Platform.Version;
      if (platformVersion >= 33) {
        return Promise.all([PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES), PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO)]).then(
          ([hasReadMediaImagesPermission, hasReadMediaVideoPermission]) => hasReadMediaImagesPermission && hasReadMediaVideoPermission,
        );
      } else {
        return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
      }
    };

    const hasPermission = await getCheckPermissionPromise();
    if (hasPermission) {
      return true;
    }
    const getRequestPermissionPromise = () => {
      const platformVersion = typeof Platform.Version === 'string' ? Number(Platform.Version) : Platform.Version;
      if (platformVersion >= 33) {
        return PermissionsAndroid.requestMultiple([PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES, PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO]).then(
          statuses => statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] === PermissionsAndroid.RESULTS.GRANTED && statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO] === PermissionsAndroid.RESULTS.GRANTED,
        );
      } else {
        return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE).then(status => status === PermissionsAndroid.RESULTS.GRANTED);
      }
    };

    return await getRequestPermissionPromise();
  };

  return (
    <Container style={{flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 28}}>
      <View />

      <View>
        <TouchableScale activeScale={0.98} tension={40} friction={3}>
          <ViewShot options={{format: 'png', result: 'tmpfile'}} ref={viewShotRef} style={{alignItems: 'center', margin: 2}}>
            <View
              style={{
                width: '100%',
                aspectRatio: 1 / 1,
                justifyContent: 'space-between',
                borderColor: theme.highlightLight,
                borderWidth: 3,
                borderRadius: 16,
                padding: 20,
                backgroundColor: theme.background,
              }}>
              {/* Header */}
              <View style={{gap: 4}}>
                <Text style={[typography.caption, {color: theme.secondaryText, fontWeight: '500'}]}>{data.date}</Text>
                <Text style={[typography.subtitle, {color: theme.primaryText, fontWeight: '700'}]}>{data.school} 급식</Text>
              </View>

              {/* Meal items */}
              <View style={{gap: 2, flex: 1, justifyContent: 'center', paddingVertical: 16}}>
                {data.meal.split('\n').map((meal, index) => (
                  <View key={index} style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                    <View style={{width: 4, height: 4, borderRadius: 2, backgroundColor: theme.highlight}} />
                    <Text style={[typography.body, {fontWeight: '600', color: theme.primaryText}]} numberOfLines={1} adjustsFontSizeToFit>
                      {meal}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Footer */}
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, opacity: 0.7}}>
                <Logo width={14} height={14} />
                <Text style={[typography.caption, {color: theme.secondaryText, fontWeight: '400'}]}>NYL</Text>
              </View>
            </View>
          </ViewShot>
        </TouchableScale>

        <Text style={[typography.caption, {color: theme.secondaryText, textAlign: 'center', marginTop: 12}]}>미리보기</Text>
      </View>

      {/* 공유 버튼들 */}
      <View style={{width: '100%', gap: 12}}>
        <View style={{flexDirection: 'row', gap: 12}}>
          <TouchableScale activeScale={0.98} tension={40} friction={3} onPress={shareToImage} style={{flex: 1}}>
            <View style={{paddingVertical: 14, alignItems: 'center', gap: 6, backgroundColor: theme.card, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignContent: 'center'}}>
              <FontAwesome6 name="share" size={18} color={theme.primaryText} iconStyle="solid" />
              <Text style={[typography.subtitle, {color: theme.primaryText, fontWeight: '600'}]}>공유하기</Text>
            </View>
          </TouchableScale>

          <TouchableScale
            activeScale={0.98}
            tension={40}
            friction={3}
            onPress={async () => {
              try {
                // Request permissions for Android
                if (Platform.OS === 'android') {
                  const hasPermission = await hasAndroidPermission();
                  if (!hasPermission) {
                    return showToast('저장 권한이 필요해요.');
                  }
                }

                // Capture the image as tmpfile
                const viewShot = viewShotRef.current;
                if (!viewShot) {
                  return showToast('이미지 캡처에 실패했어요.');
                }

                // Change ViewShot options to capture as tmpfile
                const capturedImageUri = await viewShot.capture?.();

                if (!capturedImageUri) {
                  return showToast('이미지 캡처에 실패했어요.');
                }

                // Save to gallery using CameraRoll.saveAsset
                await CameraRoll.saveAsset(`file://${capturedImageUri}`, {type: 'photo'});

                analytics().logEvent('meal_save_to_gallery');
                showToast('갤러리에 저장되었어요.');
              } catch (error) {
                console.error('Failed to save image:', error);
                showToast('이미지 저장에 실패했어요.');
              }
            }}
            style={{flex: 1}}>
            <View style={{paddingVertical: 14, alignItems: 'center', gap: 6, backgroundColor: theme.card, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignContent: 'center'}}>
              <FontAwesome6 name="download" size={18} color={theme.primaryText} iconStyle="solid" />
              <Text style={[typography.subtitle, {color: theme.primaryText}]}>저장</Text>
            </View>
          </TouchableScale>
        </View>

        <TouchableScale activeScale={0.98} tension={40} friction={3} onPress={shareToInstagramStory}>
          <View style={{paddingVertical: 14, alignItems: 'center', gap: 6, backgroundColor: theme.highlight, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignContent: 'center'}}>
            <FontAwesome6 name="instagram" size={20} color={theme.primaryText} iconStyle="brand" />
            <Text style={[typography.subtitle, {color: theme.primaryText}]}>인스타그램 스토리에 업로드</Text>
          </View>
        </TouchableScale>
      </View>
    </Container>
  );
};

export default ShareScreen;
