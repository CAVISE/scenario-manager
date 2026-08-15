import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadFile } from './download';

describe('downloadFile', () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    createObjectURLSpy = vi.fn(() => 'blob:mock-url');
    revokeObjectURLSpy = vi.fn();
    URL.createObjectURL =
      createObjectURLSpy as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL =
      revokeObjectURLSpy as unknown as typeof URL.revokeObjectURL;

    clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    clickSpy.mockRestore();
  });

  it('creates an object URL from the given content and triggers a click on a temporary anchor', () => {
    downloadFile('scenario.yaml', 'world:\n  town: Town03');

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    const [blobArg] = createObjectURLSpy.mock.calls[0] as [Blob];
    expect(blobArg).toBeInstanceOf(Blob);
    expect(blobArg.type).toBe('text/plain');

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('sets the anchor href to the created object URL and download to the given filename', () => {
    clickSpy.mockImplementation(function (this: HTMLAnchorElement) {});

    downloadFile('my-config.ini', 'some content');

    const anchor = clickSpy.mock.instances[0] as HTMLAnchorElement;
    expect(anchor.href).toBe('blob:mock-url');
    expect(anchor.download).toBe('my-config.ini');
  });

  it('does not revoke the object URL synchronously', () => {
    downloadFile('file.txt', 'content');

    expect(revokeObjectURLSpy).not.toHaveBeenCalled();
  });

  it('revokes the object URL after the event loop settles', () => {
    downloadFile('file.txt', 'content');

    vi.runAllTimers();

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
  });

  it('builds a fresh blob per call so unrelated downloads do not share content', () => {
    downloadFile('a.txt', 'content A');
    downloadFile('b.txt', 'content B');

    expect(createObjectURLSpy).toHaveBeenCalledTimes(2);
  });
});
