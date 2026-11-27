import { describe, it, expect, vi, afterEach } from 'vitest';
import { photoSize, preparePhoto, photoFromUrl, photosFit } from './recipePhotos.js';
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe('photo preparation', () => {
  it('preserves proportions, fits 1200px and never enlarges', () => {
    expect(photoSize(2400,1600)).toEqual({width:1200,height:800});
    expect(photoSize(800,2400)).toEqual({width:400,height:1200});
    expect(photoSize(300,200)).toEqual({width:300,height:200});
  });
  it('keeps small photos as data URLs in the existing stored shape', async () => {
    vi.stubGlobal('Image',class { naturalWidth=100; naturalHeight=100; set src(value){queueMicrotask(()=>this.onload());} });
    const photo=await preparePhoto(new Blob(['photo'],{type:'image/png'}));
    expect(Object.keys(photo)).toEqual(['url']);
    expect(photo.url).toBe('data:image/png;base64,cGhvdG8=');
  });
  it('resizes large photos to 1200px before saving', async () => {
    vi.stubGlobal('Image',class { naturalWidth=2400; naturalHeight=1600; set src(value){queueMicrotask(()=>this.onload());} });
    const drawImage=vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({drawImage});
    vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/jpeg;base64,RESIZED');
    expect(await preparePhoto(new Blob(['photo'],{type:'image/jpeg'}))).toEqual({url:'data:image/jpeg;base64,RESIZED'});
    expect(drawImage.mock.calls[0].slice(1)).toEqual([0,0,1200,800]);
  });

  // A photograph re-encoded as PNG is often bigger than the JPEG it came
  // from, which used to spend the budget on shrinking the picture instead.
  const canvasStub = (alpha) => {
    const calls = [];
    const data = new Uint8ClampedArray([0, 0, 0, alpha]);
    vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({
      drawImage: vi.fn(),
      getImageData: () => ({ data }),
    });
    vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockImplementation((type, quality) => {
      calls.push([type, quality]);
      return `data:${type};base64,X`;
    });
    return calls;
  };
  const big = () => vi.stubGlobal('Image',class { naturalWidth=2400; naturalHeight=1600; set src(value){queueMicrotask(()=>this.onload());} });

  it('saves an opaque resized photo as JPEG rather than PNG', async () => {
    big();
    const calls = canvasStub(255);
    expect(await preparePhoto(new Blob(['photo'],{type:'image/png'}))).toEqual({url:'data:image/jpeg;base64,X'});
    expect(calls[0]).toEqual(['image/jpeg', 0.85]);
  });

  it('keeps a transparent picture as PNG, which JPEG would flatten', async () => {
    big();
    const calls = canvasStub(0);
    expect(await preparePhoto(new Blob(['logo'],{type:'image/png'}))).toEqual({url:'data:image/png;base64,X'});
    expect(calls.every(([type]) => type === 'image/png')).toBe(true);
  });

  it('gives up quality before it gives up resolution', async () => {
    big();
    const calls = [];
    vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({
      drawImage: vi.fn(), getImageData: () => ({ data: new Uint8ClampedArray([0,0,0,255]) }),
    });
    // Only the lowest quality fits, so it must be reached without resizing.
    vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockImplementation((type, quality) => {
      calls.push(quality);
      return quality === 0.6 ? 'data:image/jpeg;base64,SMALL' : 'x'.repeat(5000000);
    });
    expect(await preparePhoto(new Blob(['photo'],{type:'image/jpeg'}))).toEqual({url:'data:image/jpeg;base64,SMALL'});
    expect(calls).toEqual([0.85, 0.72, 0.6]);
  });
  // What a phone hands over is not always what a desktop file picker does.
  it('accepts a photo the picker handed over with no type at all', async () => {
    vi.stubGlobal('Image',class { naturalWidth=100; naturalHeight=100; set src(value){queueMicrotask(()=>this.onload());} });
    const file = new Blob(['photo']); // type ''
    expect(await preparePhoto(file)).toEqual({url:'data:application/octet-stream;base64,cGhvdG8='});
  });

  it('says what to do about an iPhone HEIC this browser cannot open', async () => {
    vi.stubGlobal('Image',class { naturalWidth=0; naturalHeight=0; set src(value){queueMicrotask(()=>this.onerror());} });
    await expect(preparePhoto(new Blob(['x'],{type:'image/heic'}))).rejects.toThrow(/HEIC/);
  });

  // A browser out of room for a 48-megapixel photo leaves the canvas
  // untouched and encodes it without complaint: that used to be saved.
  it('refuses a photo the browser drew as nothing rather than saving a blank', async () => {
    big();
    vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({
      drawImage: vi.fn(), getImageData: () => ({ data: new Uint8ClampedArray([0,0,0,0]) }),
    });
    vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/jpeg;base64,X');
    await expect(preparePhoto(new Blob(['photo'],{type:'image/jpeg'}))).rejects.toThrow(/ran out of room/);
  });

  it('decodes with createImageBitmap where there is one, and lets it go after', async () => {
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 2400, height: 1600, close })));
    vi.stubGlobal('Image', class { set src(value) { throw new Error('should not reach <img>'); } });
    const calls = canvasStub(255);
    expect(await preparePhoto(new Blob(['photo'],{type:'image/jpeg'}))).toEqual({url:'data:image/jpeg;base64,X'});
    expect(calls.length).toBeGreaterThan(0);
    expect(close).toHaveBeenCalled();
  });

  it('bounds total photo data before sending a recipe', () => {
    expect(photosFit([{url:'data:image/png;base64,YQ=='}])).toBe(true);
    expect(photosFit([{url:'x'.repeat(4500000)}])).toBe(false);
  });
  it('rejects nonphotos, SVG and oversized uploads', async () => {
    await expect(preparePhoto(new Blob(['x'],{type:'text/plain'}))).rejects.toThrow(/Choose a photo/);
    await expect(preparePhoto(new Blob(['x'],{type:'image/svg+xml'}))).rejects.toThrow(/Choose a photo/);
    await expect(preparePhoto({type:'image/png',size:26*1024*1024})).rejects.toThrow(/25 MB/);
  });
  it('requests URL photos from the signed-in same-origin fetch endpoint', async () => {
    const fetcher=vi.fn(async()=>({ok:true,blob:async()=>new Blob(['photo'],{type:'image/png'})}));
    const blob=await photoFromUrl('https://images.example/photo.png',{token:'synthetic',fetcher});
    expect(blob.type).toBe('image/png');
    expect(fetcher.mock.calls[0][0]).toBe('/.netlify/functions/recipe-image');
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({url:'https://images.example/photo.png'});
  });
  it('rejects missing auth and bad URLs without fetching', async () => {
    const fetcher=vi.fn();
    await expect(photoFromUrl('https://images.example/photo',{fetcher})).rejects.toThrow(/Sign in/);
    await expect(photoFromUrl('javascript:alert(1)',{token:'synthetic',fetcher})).rejects.toThrow(/HTTPS/);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
