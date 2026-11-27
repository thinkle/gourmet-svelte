/**
   The photos a recipe carries, as the API lets a client see and change them.

   A stored image is the desktop app's shape: `{url, caption?}`, where `url`
   is a data URL holding the picture itself (see src/app/recipePhotos.js).
   That is why recipe responses never carry image data -- a single photo can
   be megabytes -- and why an API client gets a count, a metadata list, and
   endpoints that take a picture rather than a wall of base64.

   Two ways to hand over a photo:
     - `url`: a public HTTPS link. The server fetches it (bounded, public
       addresses only; netlify/lib/recipeImage.js) and stores the bytes, so
       the recipe keeps working when the original link rots.
     - `dataUrl`: the picture inline, for a client that made it itself.

   Budgets mirror the browser editor's, because a photo the app cannot save
   is worse than one we declined to store.
**/
import { downloadImage } from './recipeImage.js';

export const MAX_STORED_IMAGE_DATA = 4000000; // one data URL, in characters
export const MAX_RECIPE_IMAGE_DATA = 4500000; // every image on one recipe
export const MAX_IMAGES_PER_REQUEST = 4;
export const MAX_CAPTION = 500;

const DATA_URL = /^data:(image\/(?:jpeg|png|webp|gif|avif));base64,([A-Za-z0-9+/=]+)$/;

export class ImageError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}
const fail = (status, message) => { throw new ImageError(status, message); };

/** What a stored image is, without the picture itself. */
export function imageInfo(image, index) {
    const url = typeof image?.url === 'string' ? image.url : '';
    const match = DATA_URL.exec(url);
    const info = { index, caption: typeof image?.caption === 'string' ? image.caption : '' };
    if (match) {
        info.contentType = match[1];
        info.bytes = Math.floor(match[2].replace(/=+$/, '').length * 3 / 4);
    } else if (url) {
        // Older or hand-written entries may hold a link instead of the picture.
        info.contentType = null;
        info.bytes = 0;
        info.link = url;
    } else {
        info.contentType = null;
        info.bytes = 0;
    }
    for (const field of ['width', 'height']) {
        if (typeof image?.[field] === 'number') { info[field] = image[field]; }
    }
    return info;
}

export const describeImages = (images) => (Array.isArray(images) ? images : []).map(imageInfo);

/** The position an API client named, as an index into this list. */
export function imageIndex(value, images) {
    const index = Number(value);
    if (!Number.isInteger(index) || index < 0 || index >= images.length) {
        fail(404, `No image ${value} on this recipe (it has ${images.length}).`);
    }
    return index;
}

function caption(value) {
    if (value === undefined || value === null) { return undefined; }
    if (typeof value !== 'string') { fail(400, 'caption must be a string.'); }
    if (value.length > MAX_CAPTION) { fail(400, `A caption is at most ${MAX_CAPTION} characters.`); }
    return value;
}

// Sizes in the message are the picture's own, not the base64 it is stored as.
const tooBig = (what) => fail(413, `${what} is too large to store on a recipe. One photo may be about 3 MB, ` +
    'and all the photos on one recipe about 3.4 MB. Resize it -- the app saves photos at 1200px on the ' +
    'longest edge, which is well inside that -- and send it again.');

/** Every image on a recipe, together, has to stay under the budget. */
export function assertRecipeFits(images) {
    if (Buffer.byteLength(JSON.stringify(images)) > MAX_RECIPE_IMAGE_DATA) { tooBig('That recipe\'s photos'); }
    return images;
}

function storedImage(dataUrl, text) {
    if (dataUrl.length > MAX_STORED_IMAGE_DATA) { tooBig('That photo'); }
    const image = { url: dataUrl };
    if (text !== undefined) { image.caption = text; }
    return image;
}

/**
   One image as a client asked for it, ready to store: `{url}` fetched from
   the web, or `{dataUrl}` sent inline.
**/
export async function prepareImage(input, { download = downloadImage } = {}) {
    if (typeof input === 'string') { input = { url: input }; }
    if (!input || typeof input !== 'object') { fail(400, 'Send {url} (a public HTTPS image link) or {dataUrl}.'); }
    const text = caption(input.caption);
    const { url, dataUrl } = input;
    if (url && dataUrl) { fail(400, 'Send url or dataUrl, not both.'); }
    if (dataUrl) {
        if (typeof dataUrl !== 'string' || !DATA_URL.test(dataUrl)) {
            fail(400, 'dataUrl must look like "data:image/jpeg;base64,..." (jpeg, png, webp, gif or avif).');
        }
        return storedImage(dataUrl, text);
    }
    if (typeof url !== 'string' || !url) { fail(400, 'Send {url} (a public HTTPS image link) or {dataUrl}.'); }
    if (/^data:/i.test(url)) { return storedImage(url.trim(), text); } // a data URL under the other name
    let image;
    try {
        image = await download(url);
    } catch (err) {
        fail(400, `Could not fetch that photo: ${err.message} Use a public HTTPS image URL, or send the picture as dataUrl.`);
    }
    return storedImage(`data:${image.type};base64,${image.bytes.toString('base64')}`, text);
}

/** Several at once, fetched together so one slow host does not stack up on the next. */
export async function prepareImages(inputs, options) {
    const list = Array.isArray(inputs) ? inputs : [inputs];
    if (!list.length) { fail(400, 'Send at least one image.'); }
    if (list.length > MAX_IMAGES_PER_REQUEST) {
        fail(400, `Send at most ${MAX_IMAGES_PER_REQUEST} images in one request.`);
    }
    return await Promise.all(list.map((input) => prepareImage(input, options)));
}

/** Move an image to another place in the list ("make this the main photo"). */
export function moveImage(images, from, to) {
    const next = [...images];
    const [image] = next.splice(from, 1);
    next.splice(Math.max(0, Math.min(to, next.length)), 0, image);
    return next;
}

export function insertImages(images, additions, at) {
    if (at === undefined || at === null) { return [...images, ...additions]; }
    const index = Number(at);
    if (!Number.isInteger(index) || index < 0 || index > images.length) {
        fail(400, `index must be a whole number from 0 to ${images.length}.`);
    }
    return [...images.slice(0, index), ...additions, ...images.slice(index)];
}
