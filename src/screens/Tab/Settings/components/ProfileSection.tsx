import React from 'react';
import {ActivityIndicator, Easing, ImageBackground, Text, TouchableOpacity, View} from 'react-native';
import ImagePicker, {PickerErrorCode} from 'react-native-image-crop-picker';

import TouchableScale from '@/components/TouchableScale';
import {showToast} from '@/lib/toast';
import {useAuth} from '@/providers/AuthProvider';
import {theme} from '@/styles/theme';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

interface Props {
  isPressed: boolean;
  setIsPressed: (isPressed: boolean) => void;
}

const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB

const ProfileSection = ({isPressed, setIsPressed}: Props) => {
  const {user, loading, logout, login} = useAuth();

  if (loading) {
    return <ActivityIndicator size="large" color={theme.colors.primaryText} />;
  }

  return (
    <View style={{alignItems: 'center', justifyContent: 'center', gap: 12}}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={async () => {
          if (isPressed) {
            let selectedImage = await ImagePicker.openPicker({
              mediaType: 'photo',
              cropping: false,
            });

            await ImagePicker.openCropper({
              path: selectedImage.path,
              compressImageMaxWidth: 512,
              compressImageMaxHeight: 512,
              cropping: true,
              cropperCircleOverlay: true,
              forceJpg: true,
              enableRotationGesture: true,
              cropperRotateButtonsHidden: true,
              mediaType: 'photo',
              writeTempFile: false,
              cropperToolbarTitle: '사진 편집',
              loadingLabelText: '로딩 중...',
              cropperChooseText: '완료',
              cropperCancelText: '취소',
              cropperActiveWidgetColor: theme.colors.highlight,
              cropperStatusBarColor: theme.colors.background,
              cropperToolbarColor: theme.colors.background,
              cropperToolbarWidgetColor: theme.colors.primaryText,
            })
              .then(image => {
                if (image.size > MAX_IMAGE_SIZE) {
                  return showToast('이미지 크기가 너무 커요. (최대 3MB)');
                }
                console.log(image);
                setIsPressed(false);
              })
              .catch(error => {
                console.log(error);
                const errorCode: PickerErrorCode = error.code;
                switch (errorCode) {
                  case 'E_PICKER_CANCELLED':
                    break;
                  case 'E_NO_LIBRARY_PERMISSION':
                    showToast('사진 앨범 접근 권한이 없어요.');
                    break;
                  default:
                    showToast(`사진 선택에 실패했어요:\n${error.message}`);
                    break;
                }
                setIsPressed(false);
              });
          } else {
            setIsPressed(true);
          }
        }}>
        <ImageBackground src={user && user.user.photo ? user.user.photo : 'https://f.ny64.kr/photos/defaultProfile.png'} style={{width: 150, height: 150, backgroundColor: theme.colors.border, borderRadius: 75}} borderRadius={75}>
          {isPressed && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: 75,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <FontAwesome6 name="pen-to-square" size={32} color={theme.colors.primaryText} iconStyle="solid" />
            </View>
          )}
        </ImageBackground>
      </TouchableOpacity>
      <View style={{alignItems: 'center', justifyContent: 'center'}}>
        <Text style={{color: theme.colors.primaryText, fontFamily: theme.fontWeights.bold, fontSize: 24}}>{user ? user.user.name : '게스트'}</Text>
        <Text style={{color: theme.colors.secondaryText, fontFamily: theme.fontWeights.medium, fontSize: 16}}>{user ? user.user.email : '로그인해 주세요'}</Text>
      </View>

      <View style={{width: '100%'}}>
        <TouchableScale
          style={{flex: 1}}
          pressInEasing={Easing.elastic(0.5)}
          pressOutEasing={Easing.elastic(0.5)}
          pressInDuration={100}
          pressOutDuration={100}
          scaleTo={0.98}
          onPress={() => {
            if (user) {
              logout()
                .then(() => showToast('로그아웃 완료'))
                .catch(error => showToast(`로그아웃에 실패했어요:\n${error.message}`));
            } else {
              login()
                .then(() => showToast('로그인 완료'))
                .catch(error => showToast(`로그인에 실패했어요:\n${error.message}`));
            }
          }}>
          <TouchableOpacity style={{flex: 1}}>
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.card,
                borderRadius: 12,
                width: '100%',
                paddingVertical: 8,
                borderColor: theme.colors.border,
                borderWidth: 1,
                gap: 8,
              }}>
              <Text style={{color: theme.colors.primaryText, fontFamily: theme.fontWeights.bold, fontSize: theme.typography.body.fontSize}}>{user ? '로그아웃' : '로그인'}</Text>
            </View>
          </TouchableOpacity>
        </TouchableScale>
      </View>
    </View>
  );
};

export default ProfileSection;
