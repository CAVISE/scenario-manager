import { describe, it, expect, vi } from 'vitest';
import { HTTPError } from 'ky';
import { getApiErrorMessage, getApiErrorMessageSync } from './errors';

function makeHttpError(jsonResult: unknown, jsonThrows = false): HTTPError {
  const error = Object.create(HTTPError.prototype) as HTTPError;
  error.response = {
    json: jsonThrows
      ? vi.fn().mockRejectedValue(new Error('parse error'))
      : vi.fn().mockResolvedValue(jsonResult),
  } as unknown as Response;
  return error;
}
describe('getApiErrorMessage', () => {
  it('returns fallback for non-Error non-HTTPError values', async () => {
    expect(await getApiErrorMessage(null, 'fallback')).toBe('fallback');
    expect(await getApiErrorMessage(undefined, 'fallback')).toBe('fallback');
    expect(await getApiErrorMessage(42, 'fallback')).toBe('fallback');
    expect(await getApiErrorMessage('raw string', 'fallback')).toBe('fallback');
  });

  it('returns err.message for plain Error', async () => {
    const err = new Error('something went wrong');
    expect(await getApiErrorMessage(err, 'fallback')).toBe(
      'something went wrong',
    );
  });

  it('returns fallback for plain Error with blank message', async () => {
    const err = new Error('   ');
    expect(await getApiErrorMessage(err, 'fallback')).toBe('fallback');
  });

  it('returns string payload from HTTPError when response is a trimmed string', async () => {
    const err = makeHttpError('server error message');
    expect(await getApiErrorMessage(err, 'fallback')).toBe(
      'server error message',
    );
  });

  it('returns fallback when HTTPError string payload is blank', async () => {
    const err = makeHttpError('   ');
    expect(await getApiErrorMessage(err, 'fallback')).toBe('fallback');
  });

  it('returns detail from HTTPError object payload', async () => {
    const err = makeHttpError({ detail: 'not found' });
    expect(await getApiErrorMessage(err, 'fallback')).toBe('not found');
  });

  it('returns message from HTTPError object payload when detail is absent', async () => {
    const err = makeHttpError({ message: 'bad request' });
    expect(await getApiErrorMessage(err, 'fallback')).toBe('bad request');
  });

  it('returns error from HTTPError object payload when detail and message are absent', async () => {
    const err = makeHttpError({ error: 'unauthorized' });
    expect(await getApiErrorMessage(err, 'fallback')).toBe('unauthorized');
  });

  it('returns fallback when HTTPError object payload fields are all blank', async () => {
    const err = makeHttpError({ detail: '  ', message: '', error: undefined });
    expect(await getApiErrorMessage(err, 'fallback')).toBe('fallback');
  });

  it('returns fallback when HTTPError payload is null', async () => {
    const err = makeHttpError(null);
    expect(await getApiErrorMessage(err, 'fallback')).toBe('fallback');
  });

  it('returns fallback when HTTPError json() throws', async () => {
    const err = makeHttpError(null, true);
    expect(await getApiErrorMessage(err, 'fallback')).toBe('fallback');
  });
});

describe('getApiErrorMessageSync', () => {
  it('returns err.message for plain Error', () => {
    expect(getApiErrorMessageSync(new Error('sync error'), 'fallback')).toBe(
      'sync error',
    );
  });

  it('returns fallback for plain Error with blank message', () => {
    expect(getApiErrorMessageSync(new Error('  '), 'fallback')).toBe(
      'fallback',
    );
  });

  it('returns fallback for non-Error values', () => {
    expect(getApiErrorMessageSync(null, 'fallback')).toBe('fallback');
    expect(getApiErrorMessageSync(undefined, 'fallback')).toBe('fallback');
    expect(getApiErrorMessageSync('string', 'fallback')).toBe('fallback');
    expect(getApiErrorMessageSync(42, 'fallback')).toBe('fallback');
  });
});
