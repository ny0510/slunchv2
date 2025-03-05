import React from 'react';
import {ActivityIndicator, Easing, ImageBackground, Text, TouchableOpacity, View} from 'react-native';

import TouchableScale from '@/components/TouchableScale';
import {showToast} from '@/lib/showToast';
import {useAuth} from '@/providers/AuthProvider';
import {theme} from '@/styles/theme';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

interface Props {
  isPressed: boolean;
  setIsPressed: (isPressed: boolean) => void;
}

const ProfileSection = ({isPressed, setIsPressed}: Props) => {
  const {user, loading, logout, login} = useAuth();

  if (loading) {
    return <ActivityIndicator size="large" color={theme.colors.primaryText} />;
  }

  return (
    <View style={{alignItems: 'center', justifyContent: 'center', gap: 12}}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (isPressed) {
            console.log('Pressed');
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
        <Text style={{color: theme.colors.secondaryText, fontFamily: theme.fontWeights.medium, fontSize: 16}}>{user ? user.user.email : '로그인 해 주세요'}</Text>
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
                .then(() => {
                  showToast('로그아웃 완료');
                })
                .catch(error => {
                  showToast(`로그아웃에 실패했어요: ${error}`);
                });
            } else {
              login()
                .then(() => {
                  showToast('로그인 완료');
                })
                .catch(error => {
                  showToast(`로그인에 실패했어요: ${error}`);
                });
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
