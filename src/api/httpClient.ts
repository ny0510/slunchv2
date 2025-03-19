import {API_BASE_URL} from '@env';
import axios from 'axios';
import {Alert} from 'react-native';

console.log(API_BASE_URL);

const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: status => {
    return status < 500;
  },
});

httpClient.interceptors.response.use(
  response => response,
  error => {
    if (error.message === 'Network Error') {
      Alert.alert('네트워크 오류', '인터넷 연결을 확인해주세요.');
    }
    return Promise.reject(error);
  },
);

export default httpClient;
