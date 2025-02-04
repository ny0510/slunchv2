import axios from 'axios';

const httpClient = axios.create({
  baseURL: 'http://localhost:3000',
  // baseURL: 'https://npi.ny64.kr',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default httpClient;
