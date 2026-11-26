<script>
  // A recipe text body, edited in place.
  //
  // The rule that keeps stored HTML safe: nothing is written back unless the
  // user types (or formats, or pastes) in this body. Showing it, focusing it
  // and leaving it change nothing. What the region shows is the body run
  // through the same sanitizer the recipe view uses; what it writes, once
  // edited, is the region's HTML cleaned with the same rules.
  //
  // Pasted pictures: the sanitizer allows <img>, so a step copied from a
  // cooking site keeps its photo. The paste lands at once (so the caret
  // never waits on the network) and each remote image is then brought in as
  // a data URL in the background -- see app/bodyImages.js for why.
  import { onDestroy, onMount } from "svelte";
  import { Button, Inline, Text } from "contain-css-svelte";
  import { bodyHtml, sanitizeBody } from "../app/recipeText.js";
  import { clipboardImages, htmlIsOnlyImage, localizeImages, remoteImages } from "../app/bodyImages.js";

  /** `prepareImage(source)` turns a URL string or an image file into a data
      URL. Left out, pasted pictures keep whatever src they arrived with. */
  let { body, onchange, label = "Text", placeholder = "First, chop the onion…", prepareImage = null } = $props();
  let el = $state();
  let working = $state(0);
  let note = $state("");
  let disposed = false;
  onDestroy(() => { disposed = true; });

  // Filled once: after that the region belongs to the person typing. (A
  // revert remounts this component.)
  onMount(() => { el.innerHTML = bodyHtml(typeof body === "string" ? body : ""); });

  // A picture still being prepared has no src worth storing: leave those out
  // of what gets written back, so a save mid-paste cannot keep an empty img.
  function currentHtml() {
    const clone = el.cloneNode(true);
    for (const pending of clone.querySelectorAll("img[data-pending]")) pending.remove();
    return sanitizeBody(clone.innerHTML);
  }
  const emit = () => onchange?.(currentHtml());

  function format(command) {
    el.focus();
    document.execCommand(command, false);
    emit();
  }

  /** Bring any remote <img> in this body in as data URLs, saving as each lands. */
  async function localize() {
    if (!prepareImage || !remoteImages(el).length) return;
    working += 1;
    note = "Saving pasted pictures…";
    try {
      await localizeImages(el, prepareImage, { onprogress: emit, isStale: () => disposed });
    } finally {
      if (!disposed) {
        working -= 1;
        note = working ? note : "";
        emit();
      }
    }
  }

  /** Put an image file into the body: a placeholder first, then the real data URL. */
  async function insertFiles(files) {
    if (!prepareImage) return;
    const token = `p${Date.now()}${Math.random().toString(36).slice(2)}`;
    const holders = files
      .map((_, i) => `<img src="" alt="" data-pending="${token}-${i}">`)
      .join("");
    document.execCommand("insertHTML", false, holders);
    working += 1;
    note = "Preparing pasted picture…";
    try {
      for (const [i, file] of files.entries()) {
        const holder = el.querySelector(`img[data-pending="${token}-${i}"]`);
        try {
          const url = await prepareImage(file);
          if (disposed) return;
          if (holder && url) { holder.setAttribute("src", url); holder.removeAttribute("data-pending"); }
          else holder?.remove();
        } catch {
          holder?.remove();
          if (!disposed) note = "That picture could not be added.";
        }
        if (!disposed) emit();
      }
    } finally {
      if (!disposed) {
        working -= 1;
        if (!working && note.startsWith("Preparing")) note = "";
        emit();
      }
    }
  }

  function onpaste(e) {
    const files = clipboardImages(e);
    const html = e.clipboardData?.getData("text/html");
    const text = e.clipboardData?.getData("text/plain") ?? "";
    e.preventDefault();
    // A picture copied from a page arrives as both a file and an <img> tag.
    // The file is already here, so use it rather than fetching the src back.
    if (files.length && prepareImage && (!html || htmlIsOnlyImage(html))) {
      void insertFiles(files);
      return;
    }
    const clean = html ? sanitizeBody(html) : bodyHtml(text);
    document.execCommand("insertHTML", false, clean);
    emit();
    void localize();
  }

  function onkeydown(e) {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === "b") { e.preventDefault(); format("bold"); }
    else if (mod && e.key.toLowerCase() === "i") { e.preventDefault(); format("italic"); }
  }
</script>

<div class="rich-text">
  <Inline>
    <!-- mousedown would take the selection away from the text: keep it. -->
    <Button aria-label="Bold" onmousedown={(e) => e.preventDefault()} onclick={() => format("bold")}><b>B</b></Button>
    <Button aria-label="Italic" onmousedown={(e) => e.preventDefault()} onclick={() => format("italic")}><i>I</i></Button>
    <Button aria-label="Bulleted list" onmousedown={(e) => e.preventDefault()} onclick={() => format("insertUnorderedList")}>• List</Button>
    <Button aria-label="Numbered list" onmousedown={(e) => e.preventDefault()} onclick={() => format("insertOrderedList")}>1. List</Button>
    {#if note}<Text muted role="status">{note}</Text>{/if}
  </Inline>
  <div
    class="recipe-prose rich-text-body"
    bind:this={el}
    contenteditable="true"
    role="textbox"
    tabindex="0"
    aria-multiline="true"
    aria-label={label}
    data-placeholder={placeholder}
    oninput={emit}
    onfocus={() => document.execCommand?.("defaultParagraphSeparator", false, "p")}
    {onpaste}
    {onkeydown}
  ></div>
</div>
