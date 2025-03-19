import {API_BASE_URL} from '@env';
import axios from 'axios';

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

export default httpClient;
