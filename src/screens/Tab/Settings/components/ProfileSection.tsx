import {API_BASE_URL} from '@env';
import React from 'react';
import {Image, Text, View} from 'react-native';
// import TouchableScale from '@/components/TouchableScale';
import TouchableScale from 'react-native-touchable-scale';

import Loading from '@/components/Loading';
import {useAuth} from '@/contexts/AuthContext';
import {useTheme} from '@/contexts/ThemeContext';
import {showToast} from '@/lib/toast';

const ProfileSection = () => {
  const {user, loading, logout, login} = useAuth();
  const {theme, typography} = useTheme();

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={{alignItems: 'center', justifyContent: 'center', gap: 12}}>
      <Image src={user && user.photoURL ? user.photoURL : `${API_BASE_URL}/public/default_profile.png`} style={{width: 150, height: 150, backgroundColor: theme.border, borderRadius: 75}} borderRadius={75} />
      <View style={{alignItems: 'center', justifyContent: 'center'}}>
        <Text style={{color: theme.primaryText, fontWeight: '700', fontSize: 24}}>{user ? user.displayName : '게스트'}</Text>
        <Text style={{color: theme.secondaryText, fontWeight: '500', fontSize: 16}}>{user ? user.email : '로그인해 주세요'}</Text>
      </View>

      <View style={{width: '100%'}}>
        <TouchableScale
          style={{flex: 1}}
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
          {/* <TouchableOpacity style={{flex: 1}}> */}
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.card,
              borderRadius: 12,
              width: '100%',
              paddingVertical: 12,
              borderColor: theme.border,
              borderWidth: 1,
              gap: 8,
            }}>
            <Text style={{color: theme.primaryText, fontWeight: '700', fontSize: typography.body.fontSize}}>{user ? '로그아웃' : '로그인'}</Text>
          </View>
          {/* </TouchableOpacity> */}
        </TouchableScale>
      </View>
    </View>
  );
};

export default ProfileSection;
