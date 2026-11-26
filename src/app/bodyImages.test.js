import { describe, it, expect, vi } from 'vitest';
import { clipboardImages, htmlIsOnlyImage, remoteImages, localizeImages } from './bodyImages.js';
import { sanitizeBody } from './recipeText.js';

const frag = (html) => { const d = document.createElement('div'); d.innerHTML = html; return d; };

describe('what a paste carries', () => {
  it('picks image files off a clipboard and ignores other files and SVG', () => {
    const event = { clipboardData: { files: [
      new File(['a'], 'shot.png', { type: 'image/png' }),
      new File(['b'], 'notes.txt', { type: 'text/plain' }),
      new File(['c'], 'logo.svg', { type: 'image/svg+xml' }),
    ] } };
    expect(clipboardImages(event).map((f) => f.name)).toEqual(['shot.png']);
    expect(clipboardImages({})).toEqual([]);
  });
  it('knows a picture-only paste from a paste with words in it', () => {
    expect(htmlIsOnlyImage('<img src="https://e.com/a.jpg">')).toBe(true);
    expect(htmlIsOnlyImage('<p>Step one</p><img src="https://e.com/a.jpg">')).toBe(false);
    expect(htmlIsOnlyImage('<p>Just words</p>')).toBe(false);
    expect(htmlIsOnlyImage('')).toBe(false);
  });
});

describe('the sanitizer a body is stored through', () => {
  it('keeps a picture but drops its script handler and anything unresolvable', () => {
    expect(sanitizeBody('<img src="https://e.com/a.jpg" alt="pan">')).toContain('src="https://e.com/a.jpg"');
    expect(sanitizeBody('<img src="data:image/png;base64,YQ==">')).toContain('data:image/png');
    expect(sanitizeBody('<img src="x" onerror="alert(1)">')).not.toContain('onerror');
    expect(sanitizeBody('<img src="blob:https://e.com/abc">')).not.toContain('blob:');
  });
});

describe('bringing remote pictures in', () => {
  it('finds only the ones pointing at another server', () => {
    const root = frag('<img src="https://e.com/a.jpg"><img src="data:image/png;base64,YQ=="><img>');
    expect(remoteImages(root)).toHaveLength(1);
    expect(remoteImages(null)).toEqual([]);
  });
  it('swaps each src for a data URL and reports progress as it goes', async () => {
    const root = frag('<p>Step</p><img src="https://e.com/a.jpg"><img src="https://e.com/b.jpg">');
    const onprogress = vi.fn();
    const done = await localizeImages(root, async () => 'data:image/png;base64,YQ==', { onprogress });
    expect(done).toBe(2);
    expect(remoteImages(root)).toHaveLength(0);
    expect(onprogress).toHaveBeenCalledTimes(2);
    expect(root.querySelectorAll('img[data-localizing]')).toHaveLength(0);
  });
  it('leaves a hotlink alone rather than a hole when it cannot be fetched', async () => {
    const root = frag('<img src="https://e.com/a.jpg"><img src="https://e.com/b.jpg">');
    const prepare = vi.fn()
      .mockRejectedValueOnce(new Error('Sign in to import a photo URL.'))
      .mockResolvedValueOnce('data:image/png;base64,YQ==');
    expect(await localizeImages(root, prepare)).toBe(1);
    const srcs = [...root.querySelectorAll('img')].map((i) => i.getAttribute('src'));
    expect(srcs[0]).toBe('https://e.com/a.jpg');
    expect(srcs[1]).toBe('data:image/png;base64,YQ==');
  });
  it('stops partway when the editor it was working in has gone', async () => {
    const root = frag('<img src="https://e.com/a.jpg"><img src="https://e.com/b.jpg">');
    let stale = false;
    const done = await localizeImages(root, async () => 'data:image/png;base64,YQ==', {
      onprogress: () => { stale = true; },
      isStale: () => stale,
    });
    expect(done).toBe(1);
    expect(remoteImages(root)).toHaveLength(1);
  });
});
