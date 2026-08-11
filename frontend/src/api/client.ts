import ky from 'ky';
import { API_URL } from '../app/vars';

export const api = ky.create({
  prefixUrl: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  retry: 0,
});

export type ApiClient = typeof api;
