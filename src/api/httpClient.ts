import axios from 'axios';

const httpClient = axios.create({
  baseURL: 'https://npi.ny64.kr',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default httpClient;
