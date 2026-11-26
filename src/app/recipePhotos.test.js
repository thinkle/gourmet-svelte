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
  it('resizes large photos to the legacy PNG format before saving', async () => {
    vi.stubGlobal('Image',class { naturalWidth=2400; naturalHeight=1600; set src(value){queueMicrotask(()=>this.onload());} });
    const drawImage=vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({drawImage});
    vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,RESIZED');
    expect(await preparePhoto(new Blob(['photo'],{type:'image/jpeg'}))).toEqual({url:'data:image/png;base64,RESIZED'});
    expect(drawImage.mock.calls[0].slice(1)).toEqual([0,0,1200,800]);
  });
  it('bounds total photo data before sending a recipe', () => {
    expect(photosFit([{url:'data:image/png;base64,YQ=='}])).toBe(true);
    expect(photosFit([{url:'x'.repeat(4500000)}])).toBe(false);
  });
  it('rejects nonphotos, SVG and oversized uploads', async () => {
    await expect(preparePhoto(new Blob(['x'],{type:'text/plain'}))).rejects.toThrow(/Choose a photo/);
    await expect(preparePhoto(new Blob(['x'],{type:'image/svg+xml'}))).rejects.toThrow(/Choose a photo/);
    await expect(preparePhoto({type:'image/png',size:11*1024*1024})).rejects.toThrow(/10 MB/);
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
