import ky from 'ky';
import { PORT } from '../VARS';

const apiBaseUrl = `http://localhost:${PORT}`;

export const api = ky.create({
  prefixUrl: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  retry: 0,
});

export type ApiClient = typeof api;
