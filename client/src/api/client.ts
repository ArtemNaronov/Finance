import axios from 'axios';

const apiBase = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api';
const apiToken = import.meta.env.VITE_API_TOKEN as string | undefined;

export const apiClient = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json',
    ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Ошибка сети';
    return Promise.reject(new Error(message));
  },
);
