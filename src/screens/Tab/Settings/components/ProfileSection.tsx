import React from 'react';
import {ActivityIndicator, Easing, Image, Text, TouchableOpacity, View} from 'react-native';

import TouchableScale from '@/components/TouchableScale';
import {showToast} from '@/lib/toast';
import {useAuth} from '@/providers/AuthProvider';
import {theme} from '@/styles/theme';

const ProfileSection = () => {
  const {user, loading, logout, login} = useAuth();

  if (loading) {
    return <ActivityIndicator size="large" color={theme.colors.primaryText} />;
  }

  return (
    <View style={{alignItems: 'center', justifyContent: 'center', gap: 12}}>
      <Image src={user && user.user.photo ? user.user.photo : 'https://f.ny64.kr/photos/defaultProfile.png'} style={{width: 150, height: 150, backgroundColor: theme.colors.border, borderRadius: 75}} borderRadius={75} />
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
