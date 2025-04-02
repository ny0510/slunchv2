import {API_BASE_URL} from '@env';
import axios from 'axios';

import {showToast} from '@/lib/toast';

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
      return showToast('네트워크 연결을 확인해주세요.');
    }
    return Promise.reject(error);
  },
);

export default httpClient;
