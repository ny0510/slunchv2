import {API_BASE_URL} from '@env';
import React from 'react';
import {Image, Text, View} from 'react-native';
import TouchableScale from 'react-native-touchable-scale';

import Loading from '@/components/Loading';
import {useAuth} from '@/contexts/AuthContext';
import {useTheme} from '@/contexts/ThemeContext';
import {showToast} from '@/lib/toast';

const ProfileSection = () => {
  const {user, loading, logout, login} = useAuth();
  const {theme, typography, isDark} = useTheme();

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={{width: '100%'}}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.card,
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderColor: theme.border,
          borderWidth: 1,
          gap: 12,
        }}>
        <Image src={user && user.photoURL ? user.photoURL : isDark ? `${API_BASE_URL}/public/default_profile.png` : `${API_BASE_URL}/public/default_profile_light.png`} style={{width: 48, height: 48, backgroundColor: theme.border, borderRadius: 24}} borderRadius={24} />
        <View style={{flex: 1}}>
          <Text style={[typography.body, {color: theme.primaryText, fontWeight: '600'}]}>{user ? user.displayName : '게스트'}</Text>
          <Text style={[typography.caption, {color: theme.secondaryText}]}>{user ? user.email : '로그인해 주세요'}</Text>
        </View>
        <TouchableScale
          activeScale={0.98}
          tension={40}
          friction={3}
          onPress={() => {
            if (user) {
              logout()
                .then(() => showToast('로그아웃 완료'))
                .catch(error => showToast(`로그아웃에 실패했어요:\n${error.message}`));
            } else {
              login()
                .then(_user => (_user ? showToast('로그인 완료') : showToast('로그인에 실패했어요.')))
                .catch(error => showToast(`로그인에 실패했어요:\n${error.message}`));
            }
          }}>
          <View
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              backgroundColor: theme.background,
              borderRadius: 8,
            }}>
            <Text style={[typography.caption, {color: theme.primaryText, fontWeight: '600'}]}>{user ? '로그아웃' : '로그인'}</Text>
          </View>
        </TouchableScale>
      </View>
    </View>
  );
};

export default ProfileSection;
