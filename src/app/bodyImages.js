// Images that live inside a text body, rather than in the recipe's photo list.
//
// Paste a step from a cooking site and the HTML brings its <img> tags with
// it: the sanitizer already allows img/src/alt, so they survive. But the src
// points at someone else's server, which means the picture dies when that
// page does, leaks a referrer, and is missing when the app is offline. So
// every body image is brought in as a data URL, through the same prepare
// step the Photos box uses, only held to a smaller edge (INLINE_EDGE).
//
// Nothing here talks to the network or to the session: the caller hands in a
// `prepare(source)` that turns a URL or a file into a data URL. That keeps
// this module testable and keeps auth in one place.

/** Image files riding on a paste (a screenshot, or an image copied from the desktop). */
export function clipboardImages(event) {
  return Array.from(event?.clipboardData?.files ?? []).filter(
    (file) => file.type?.startsWith("image/") && file.type !== "image/svg+xml"
  );
}

/** True when pasted HTML is just a picture: no words of its own worth keeping. */
export function htmlIsOnlyImage(html) {
  if (!html) return false;
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.querySelectorAll("img").length > 0 && doc.body.textContent.trim() === "";
}

/** The <img> elements under `root` still pointing at another server. */
export function remoteImages(root) {
  return Array.from(root?.querySelectorAll?.("img") ?? []).filter((img) =>
    /^https?:/i.test(img.getAttribute("src") ?? "")
  );
}

/**
   Replace every remote <img> src under `root` with a data URL, one at a
   time, calling `onprogress` after each so the caller can save as it goes.

   An image that cannot be brought in keeps its remote src: a hotlink that
   works today beats a hole in the instructions. Returns the number brought in.
**/
export async function localizeImages(root, prepare, { onprogress, isStale } = {}) {
  let done = 0;
  for (const img of remoteImages(root)) {
    if (isStale?.()) break;
    const src = img.getAttribute("src");
    img.setAttribute("data-localizing", "");
    try {
      const url = await prepare(src);
      if (isStale?.()) break;
      if (url) {
        img.setAttribute("src", url);
        done += 1;
      }
    } catch {
      // Leave the remote src in place.
    } finally {
      img.removeAttribute("data-localizing");
    }
    onprogress?.();
  }
  return done;
}
