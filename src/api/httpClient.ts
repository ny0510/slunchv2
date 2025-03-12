import {API_BASE_URL} from '@env';
import axios from 'axios';

const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default httpClient;
