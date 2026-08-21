import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/mydata';

export const httpClient = axios.create({
  baseURL: BASE_URL,
});
