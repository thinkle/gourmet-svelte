// Keep the desktop photo shape: {url, caption?}, with a 1200px longest edge.
export const PHOTO_EDGE = 1200;
export const MAX_PHOTO_DATA = 4000000;
export const MAX_RECIPE_PHOTO_BYTES = 4500000;
export const photosFit = (photos) => new TextEncoder().encode(JSON.stringify(photos)).byteLength <= MAX_RECIPE_PHOTO_BYTES;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
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

/** True when any pixel is less than fully opaque, or when we cannot tell. */
function hasAlpha(context, width, height) {
  try {
    const { data } = context.getImageData(0, 0, width, height);
    for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return true;
    return false;
  } catch {
    return true; // No pixel access: keep the format that cannot lose anything.
  }
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

export async function preparePhoto(file, { edge = PHOTO_EDGE, maxData = MAX_PHOTO_DATA } = {}) {
  if (!file?.type?.startsWith('image/') || file.type === 'image/svg+xml') throw new Error('Choose a photo such as JPEG, PNG, or WebP.');
  if (file.size > MAX_PHOTO_BYTES) throw new Error('Choose a photo smaller than 10 MB.');
  const url = await readDataUrl(file);
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error('That image could not be opened. Try a JPEG or PNG.'));
    img.src = url;
  });
  const size = photoSize(img.naturalWidth, img.naturalHeight, edge);
  if (Math.max(img.naturalWidth, img.naturalHeight) <= edge && url.length <= maxData) return { url };
  const canvas = document.createElement('canvas');
  Object.assign(canvas, size);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser could not resize the photo.');
  // Only a format that can carry alpha is worth scanning for it, and a scan
  // we cannot run (no getImageData) means we keep the format that is safe.
  const mayHaveAlpha = ALPHA_TYPES.test(file.type ?? '');
  let transparent = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    canvas.width = size.width; canvas.height = size.height;
    context.drawImage(img, 0, 0, size.width, size.height);
    if (transparent === null) transparent = mayHaveAlpha && hasAlpha(context, size.width, size.height);
    for (const url of encodings(canvas, transparent)) {
      if (url.length <= maxData) return { url };
    }
    size.width = Math.max(1, Math.round(size.width * 0.8));
    size.height = Math.max(1, Math.round(size.height * 0.8));
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
