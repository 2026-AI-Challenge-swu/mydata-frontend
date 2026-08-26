import axios from 'axios';

const BASE_URL = import.meta.env.VITE_SURVEY_API_BASE_URL ?? 'http://localhost:8080/api/survey';

export const surveyHttpClient = axios.create({
  baseURL: BASE_URL,
});
