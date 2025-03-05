import React, {useEffect, useState} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';

import Barcode from './components/Barcode';
import Container from '@/components/Container';
import {showToast} from '@/lib/showToast';
import {useAuth} from '@/providers/AuthProvider';
import {theme} from '@/styles/theme';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {useIsFocused} from '@react-navigation/native';

const SchoolCard = () => {
  const {user, login, logout, loading} = useAuth();
  const isFocused = useIsFocused();

  const [name, setName] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [classNum, setClassNum] = useState<string>('');
  const [number, setNumber] = useState<string>('');
  const [generation, setGeneration] = useState<number>(0);
  const [barcodeValue, setBarcodeValue] = useState<string>('');

  useEffect(() => {
    if (user && user.user) {
      const _name = user.user.name ? user.user.name.slice(5) : '';
      const _grade = user.user.name ? user.user.name.slice(0, 1) : '';
      const _classNum = user.user.name ? parseInt(user.user.name.slice(1, 3), 10).toString() : '';
      const _number = user.user.name ? parseInt(user.user.name.slice(3, 5), 10).toString() : '';
      const _generation = 118 - (23 - parseInt(user.user.email.slice(0, 2), 10));

      setName(_name);
      setGrade(_grade);
      setClassNum(_classNum);
      setNumber(_number);
      setGeneration(_generation);
      setBarcodeValue(`S2${user.user.email.slice(0, 2)}0${user.user.email.slice(8, 11)}`);
    }
  }, [user]);

  if (loading || !isFocused) {
    return null;
  }

  const isSunrinEmail = user && user.user && user.user.email.endsWith('@sunrint.hs.kr');

  return (
    <Container style={{justifyContent: 'center', alignItems: 'center', flex: 1}}>
      {user && user.user && isSunrinEmail ? (
        <View style={{justifyContent: 'space-between', aspectRatio: 3 / 3.7, backgroundColor: theme.colors.card, width: '85%', borderRadius: 12, padding: 16, paddingTop: 26, paddingBottom: 0}}>
          <View>
            <Text style={[theme.typography.caption]}>선린인터넷고등학교 모바일 학생증</Text>
          </View>
          <View style={{gap: 8}}>
            <View style={{flexDirection: 'row', gap: 4, alignItems: 'flex-end'}}>
              <Text style={[theme.typography.title, {fontSize: 32, fontFamily: theme.fontWeights.bold}]}>{name}</Text>
              <Text style={[theme.typography.caption, {color: theme.colors.secondaryText}]}>{`${generation}기`}</Text>
            </View>
            <View>
              <Text style={[theme.typography.subtitle, {color: theme.colors.secondaryText}]}>{`${grade}학년 ${classNum}반 ${number}번`}</Text>
              <Text style={[theme.typography.body, {color: theme.colors.secondaryText}]}>{user.user.email}</Text>
            </View>
          </View>
          <View style={{justifyContent: 'center', alignContent: 'center', backgroundColor: theme.colors.border, height: 100, marginHorizontal: -16, borderBottomRightRadius: 12, borderBottomLeftRadius: 12, marginTop: 16, gap: 4}}>
            <Barcode value={barcodeValue} format={'CODE128'} />
            <Text style={[theme.typography.caption, {textAlign: 'center', color: theme.colors.secondaryText}]}>{barcodeValue}</Text>
          </View>
        </View>
      ) : (
        <View style={{justifyContent: 'center', alignItems: 'center', flex: 1}}>
          <TouchableOpacity
            style={{backgroundColor: theme.colors.border, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12}}
            onPress={() => {
              logout();
              login()
                .then(_user => {
                  if (!_user.user.email.endsWith('@sunrint.hs.kr')) {
                    showToast('선린인터넷고등학교 구글 계정으로 로그인해 주세요.');
                    logout();
                  } else {
                    showToast('로그인 완료');
                  }
                })
                .catch(error => {
                  showToast(`로그인에 실패했어요:\n${error.message}`);
                });
            }}>
            <View style={{flexDirection: 'row', gap: 8, alignItems: 'center'}}>
              <FontAwesome6 name="google" iconStyle="brand" size={22} color={theme.colors.primaryText} />
              <Text style={[theme.typography.subtitle, {color: theme.colors.primaryText}]}>로그인</Text>
            </View>
          </TouchableOpacity>
          <View style={{position: 'absolute', bottom: 32}}>
            <Text style={[theme.typography.body, {color: theme.colors.secondaryText}]}>선린인터넷고 구글 계정으로 로그인 해 주세요.</Text>
          </View>
        </View>
      )}
    </Container>
  );
};

export default SchoolCard;
