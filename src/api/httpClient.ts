import axios from 'axios';

const httpClient = axios.create({
  baseURL: 'https://slunch-v2.ny64.kr',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default httpClient;
