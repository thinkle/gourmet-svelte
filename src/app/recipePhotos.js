// Keep the desktop photo shape: {url, caption?}, with a 1200px longest edge.
export const PHOTO_EDGE = 1200;
export const MAX_PHOTO_DATA = 4000000;
export const MAX_RECIPE_PHOTO_BYTES = 4500000;
export const photosFit = (photos) => new TextEncoder().encode(JSON.stringify(photos)).byteLength <= MAX_RECIPE_PHOTO_BYTES;
// What we will read off a device at all. A current phone's photo is routinely
// 8-15 MB, and it gets scaled down to PHOTO_EDGE here anyway, so the cap is
// only there to stop an absurd file being read into memory.
export const MAX_PHOTO_BYTES = 25 * 1024 * 1024;
// Inline body images sit in a column of text, not a hero slot, and several
// may share one recipe: hold them to a smaller edge and a tighter budget.
export const INLINE_EDGE = 800;
export const MAX_INLINE_DATA = 600000;
export const photoSize = (width, height, edge = PHOTO_EDGE) => {
  const scale = Math.min(1, edge / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
};

export function readDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read that photo.'));
    reader.readAsDataURL(blob);
  });
}

// Formats that can carry transparency; a JPEG source never can.
const ALPHA_TYPES = /^image\/(png|gif|webp|avif)$/i;
// Quality is given up before resolution: dropping to 0.6 costs far less of
// the picture than shrinking it by a fifth.
const JPEG_QUALITIES = [0.85, 0.72, 0.6];

/**
   What the drawn canvas holds: whether any pixel is less than fully opaque,
   and whether nothing arrived at all. null when the pixels cannot be read, in
   which case we assume neither.

   `blank` is the tell for a draw that failed rather than threw: a browser that
   runs out of room decoding a very large photo leaves the canvas untouched and
   still encodes it happily, which is how a phone photo can be saved as nothing.
**/
function scanCanvas(context, width, height) {
  let data;
  try { ({ data } = context.getImageData(0, 0, width, height)); }
  catch { return null; } // No pixel access: assume the picture is there and opaque.
  let transparent = false, blank = true;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) transparent = true;
    if (data[i] !== 0) blank = false;
    if (transparent && !blank) break;
  }
  return { transparent, blank };
}

/**
   What to try saving this canvas as, best first. A photograph re-encoded as
   PNG is routinely larger than the JPEG it came from, which used to push the
   resize loop into shrinking the picture to meet the budget. A picture with
   transparency stays PNG, since JPEG would flatten it.
**/
function* encodings(canvas, transparent) {
  if (transparent) { yield canvas.toDataURL('image/png'); return; }
  for (const quality of JPEG_QUALITIES) yield canvas.toDataURL('image/jpeg', quality);
}

/** Formats a browser may hand us from a phone but cannot decode itself. */
const PHONE_TYPES = /^image\/(heic|heif)$/i;

/**
   The photo's pixels, ready to draw, plus its own size.

   createImageBitmap is tried first: it decodes off the main thread and, unlike
   <img>, does not subsample a very large picture, which is how a 48-megapixel
   phone photo can otherwise draw blank on iOS. Not every browser has it, and
   it refuses some formats, so <img> stays as the fallback.
**/
async function decodePhoto(file, url) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      if (bitmap?.width) return { source: bitmap, width: bitmap.width, height: bitmap.height };
    } catch { /* fall through to <img> */ }
  }
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error(PHONE_TYPES.test(file?.type ?? '')
      ? 'This browser cannot open HEIC photos. On an iPhone, Settings > Camera > Formats > Most Compatible saves JPEGs, or share the photo to convert it.'
      : 'That image could not be opened. Try a JPEG or PNG.'));
    img.src = url;
  });
  return { source: img, width: img.naturalWidth, height: img.naturalHeight };
}

export async function preparePhoto(file, { edge = PHOTO_EDGE, maxData = MAX_PHOTO_DATA } = {}) {
  // A phone's photo picker sometimes hands over a file with no type at all.
  // Only an outright wrong type is refused here; anything else is left to the
  // decoder, which knows better than the label does.
  if (file?.type === 'image/svg+xml' || (file?.type && !file.type.startsWith('image/'))) {
    throw new Error('Choose a photo such as JPEG, PNG, or WebP.');
  }
  if (file?.size > MAX_PHOTO_BYTES) throw new Error('Choose a photo smaller than 25 MB.');
  const url = await readDataUrl(file);
  const { source, width, height } = await decodePhoto(file, url);
  if (!width || !height) throw new Error('That image could not be opened. Try a JPEG or PNG.');
  const size = photoSize(width, height, edge);
  if (Math.max(width, height) <= edge && url.length <= maxData) {
    source.close?.();
    return { url };
  }
  const canvas = document.createElement('canvas');
  Object.assign(canvas, size);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser could not resize the photo.');
  // Only a format that can carry alpha is worth scanning for it, and a scan
  // we cannot run (no getImageData) means we keep the format that is safe.
  const mayHaveAlpha = ALPHA_TYPES.test(file.type ?? '');
  let transparent = null;
  try {
    for (let attempt = 0; attempt < 8; attempt++) {
      canvas.width = size.width; canvas.height = size.height;
      context.drawImage(source, 0, 0, size.width, size.height);
      if (transparent === null) {
        const scan = scanCanvas(context, size.width, size.height);
        // A source that cannot carry transparency has no honest way to come
        // out blank: nothing was drawn, however quietly.
        if (scan?.blank && !mayHaveAlpha) {
          throw new Error('This browser ran out of room to resize that photo. Try a smaller image.');
        }
        transparent = mayHaveAlpha && (scan?.transparent ?? true);
      }
      for (const encoded of encodings(canvas, transparent)) {
        if (encoded.length <= maxData) return { url: encoded };
      }
      size.width = Math.max(1, Math.round(size.width * 0.8));
      size.height = Math.max(1, Math.round(size.height * 0.8));
    }
  } finally {
    source.close?.();
  }
  throw new Error('That photo is too large to save. Try a smaller image.');
}

export async function photoFromUrl(value, { token, signal, fetcher = fetch } = {}) {
  let url;
  try { url = new URL(value); } catch { throw new Error('Paste the full HTTPS URL of an image.'); }
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Use an HTTPS image URL without a username or password.');
  if (!token) throw new Error('Sign in to import a photo URL.');
  const response = await fetcher('/.netlify/functions/recipe-image', {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ url: url.href }),
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Sign in again to import a photo URL.');
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || 'Could not download that photo. Try uploading the image file instead.');
  }
  return response.blob();
}
