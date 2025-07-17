import React, {useCallback, useEffect, useState} from 'react';
import {Modal, Text, TouchableOpacity, View} from 'react-native';

import Barcode from './components/Barcode';
import IDCard from './components/IDCard';
import Container from '@/components/Container';
import {useAuth} from '@/contexts/AuthContext';
import {useTheme} from '@/contexts/ThemeContext';
import {showToast} from '@/lib/toast';
import DeviceBrightness from '@adrianso/react-native-device-brightness';
import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {useIsFocused} from '@react-navigation/native';
import {useKeepAwake} from '@sayem314/react-native-keep-awake';

const SchoolCard = () => {
  const {user, login, logout, loading} = useAuth();
  const {theme, typography} = useTheme();
  const isFocused = useIsFocused();

  const [name, setName] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [classNum, setClassNum] = useState<string>('');
  const [number, setNumber] = useState<string>('');
  const [generation, setGeneration] = useState<number>(0);
  const [barcodeValue, setBarcodeValue] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [originalBrightness, setOriginalBrightness] = useState<number | null>(null);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [isSunrinEmail, setIsSunrinEmail] = useState(false);
  useKeepAwake();

  useEffect(() => {
    analytics().logScreenView({screen_name: '학생증 페이지', screen_class: 'SchoolCard'});
  }, []);

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const demoMode = JSON.parse((await AsyncStorage.getItem('demoMode')) || 'false');
        setIsDemoUser(demoMode);

        if (user && user.email) {
          setIsSunrinEmail(user.email.endsWith('@sunrint.hs.kr'));
        } else {
          setIsSunrinEmail(false);
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        setIsDemoUser(false);
        setIsSunrinEmail(false);
      }
    };

    checkUserStatus();
  }, [user]);

  useEffect(() => {
    if (isDemoUser) {
      setName('Demo User');
      setGrade('1');
      setClassNum('1');
      setNumber('1');
      setGeneration(0);
      setBarcodeValue('DEMO123456');
      return;
    }

    if (user) {
      const userEmail = user.email || '';
      const userName = user.displayName || '';

      const _name = userName.slice(5);
      const _grade = userName.slice(0, 1);
      const _classNum = parseInt(userName.slice(1, 3), 10).toString();
      const _number = parseInt(userName.slice(3, 5), 10).toString();
      const _generation = 118 - (23 - parseInt(userEmail.slice(0, 2), 10));
      let _barcodeValue = '';

      const year = parseInt(userEmail.slice(0, 2), 10);

      if (year <= 24) {
        _barcodeValue = `S2${userEmail.slice(0, 2)}0${userEmail.slice(8, 11)}`;
      } else {
        _barcodeValue = `S2${userEmail.slice(0, 2)}0${userEmail.slice(3, 6)}`;
      }

      setName(_name);
      setGrade(_grade);
      setClassNum(_classNum);
      setNumber(_number);
      setGeneration(_generation);
      setBarcodeValue(_barcodeValue);
    }
  }, [user, isDemoUser]);

  const handleBarcodePress = useCallback(async () => {
    try {
      const currentBrightness = await DeviceBrightness.getBrightnessLevel();
      setOriginalBrightness(currentBrightness);
      await DeviceBrightness.setBrightnessLevel(1);
      setIsModalVisible(true);
    } catch (error) {
      console.error('Error adjusting brightness:', error);
    }
  }, []);

  const handleCloseModal = useCallback(async () => {
    try {
      if (originalBrightness !== null) {
        await DeviceBrightness.setBrightnessLevel(originalBrightness);
      }
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error restoring brightness:', error);
    }
  }, [originalBrightness]);

  if (loading || !isFocused) {
    return null;
  }

  return (
    <Container style={{justifyContent: 'center', alignItems: 'center', flex: 1}}>
      {isDemoUser || (user && isSunrinEmail) ? (
        <IDCard name={name} schoolName="선린인터넷고등학교" generation={generation.toString()} grade={grade} classNum={classNum} number={number} barcodeValue={barcodeValue} handleBarcodePress={handleBarcodePress} />
      ) : (
        <View style={{justifyContent: 'center', alignItems: 'center', flex: 1}}>
          <TouchableOpacity
            style={{backgroundColor: theme.border, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12}}
            onPress={() => {
              logout();
              login()
                .then(async _user => {
                  if (!_user) {
                    return showToast('로그인에 실패했어요.');
                  }

                  const email = _user.email ?? '';
                  const isSunrin = email.endsWith('@sunrint.hs.kr');

                  if (!isSunrin) {
                    showToast('선린인터넷고등학교 구글 계정으로 로그인해 주세요.');
                    logout().catch(error => showToast(`로그아웃에 실패했어요:\n${error.message}`));
                  } else {
                    showToast('로그인 완료');
                  }
                })
                .catch(error => showToast(`로그인에 실패했어요:\n${error.message}`));
            }}>
            <View style={{flexDirection: 'row', gap: 8, alignItems: 'center'}}>
              <FontAwesome6 name="google" iconStyle="brand" size={22} color={theme.primaryText} />
              <Text style={[typography.subtitle, {color: theme.primaryText}]}>로그인</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
      <View style={{elevation: 0, zIndex: 0}}>
        <Modal visible={isModalVisible} transparent={true}>
          <TouchableOpacity
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              transform: [{rotate: '90deg'}, {scale: 2.5}],
            }}
            onPress={handleCloseModal}
            activeOpacity={1}>
            <Barcode value={barcodeValue} format={'CODE128'} fill={theme.white} />
          </TouchableOpacity>
        </Modal>
      </View>
    </Container>
  );
};

export default SchoolCard;
