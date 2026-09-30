import ky from 'ky';
import { API_URL } from '../VARS';

export const api = ky.create({
  prefixUrl: API_URL,
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
  retry: 0,
});
