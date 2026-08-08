import { describe, expect, it } from 'vitest';
import { getApiErrorMessage, getApiErrorMessageSync } from '../errors';
import { HTTPError } from 'ky';

function makeHttpError(body: unknown, status = 400): HTTPError {
  const response = new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
  return new HTTPError(response, new Request('http://test'), {} as never);
}

function makeHttpErrorBadJson(status = 500): HTTPError {
  const response = new Response('not json', { status });
  return new HTTPError(response, new Request('http://test'), {} as never);
}

describe('getApiErrorMessage', () => {
  it('returns fallback for non-Error value', async () => {
    expect(await getApiErrorMessage('oops', 'fallback')).toBe('fallback');
  });

  it('returns Error.message for plain Error', async () => {
    expect(await getApiErrorMessage(new Error('boom'), 'fallback')).toBe(
      'boom',
    );
  });

  it('returns fallback for Error with blank message', async () => {
    expect(await getApiErrorMessage(new Error('   '), 'fallback')).toBe(
      'fallback',
    );
  });

  it('returns string payload directly', async () => {
    const err = makeHttpError('Server is down');
    expect(await getApiErrorMessage(err, 'fallback')).toBe('Server is down');
  });

  it('returns detail string from object payload', async () => {
    const err = makeHttpError({ detail: 'Invalid input' });
    expect(await getApiErrorMessage(err, 'fallback')).toBe('Invalid input');
  });

  it('formats array of validation issues', async () => {
    const err = makeHttpError({
      detail: [
        { loc: ['body', 'name'], msg: 'field required' },
        { loc: ['body', 'id'], msg: 'invalid' },
      ],
    });
    const result = await getApiErrorMessage(err, 'fallback');
    expect(result).toContain('name: field required');
    expect(result).toContain('id: invalid');
  });

  it('filters "body" from loc path', async () => {
    const err = makeHttpError({
      detail: [{ loc: ['body', 'scenario_id'], msg: 'too short' }],
    });
    const result = await getApiErrorMessage(err, 'fallback');
    expect(result).toBe('scenario_id: too short');
  });

  it('uses msg without loc', async () => {
    const err = makeHttpError({ detail: [{ msg: 'general error' }] });
    expect(await getApiErrorMessage(err, 'fallback')).toBe('general error');
  });

  it('falls back to payload.message', async () => {
    const err = makeHttpError({ message: 'Something went wrong' });
    expect(await getApiErrorMessage(err, 'fallback')).toBe(
      'Something went wrong',
    );
  });

  it('falls back to payload.error', async () => {
    const err = makeHttpError({ error: 'Not found' });
    expect(await getApiErrorMessage(err, 'fallback')).toBe('Not found');
  });

  it('returns fallback when payload is null', async () => {
    const err = makeHttpError(null);
    expect(await getApiErrorMessage(err, 'fallback')).toBe('fallback');
  });

  it('returns fallback when response body is not JSON', async () => {
    const err = makeHttpErrorBadJson();
    expect(await getApiErrorMessage(err, 'fallback')).toBe('fallback');
  });
});

describe('getApiErrorMessageSync', () => {
  it('returns Error.message', () => {
    expect(getApiErrorMessageSync(new Error('sync error'), 'fb')).toBe(
      'sync error',
    );
  });

  it('returns fallback for non-Error', () => {
    expect(getApiErrorMessageSync({ code: 42 }, 'fb')).toBe('fb');
  });
  it('returns fallback when detail array is empty', async () => {
    const err = makeHttpError({ detail: [] });
    expect(await getApiErrorMessage(err, 'fallback')).toBe('fallback');
  });
  it('returns fallback when detail array issues have no msg or loc', async () => {
    const err = makeHttpError({ detail: [{ msg: '' }] });
    expect(await getApiErrorMessage(err, 'fallback')).toBe('fallback');
  });
  it('returns fallback for blank Error.message', () => {
    expect(getApiErrorMessageSync(new Error('  '), 'fb')).toBe('fb');
  });
});
