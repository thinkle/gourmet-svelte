<script>
  import { onDestroy } from "svelte";
  import { get } from "svelte/store";
  import { Button, Fieldset, FormItem, Input, Inline, Text } from "contain-css-svelte";
  import PhotoPicker from "../../../components/PhotoPicker.svelte";
  import { user } from "../../../auth/session.js";
  import { preparePhoto, photoFromUrl, photosFit } from "../../../app/recipePhotos.js";

  let { edit, busy = $bindable(false) } = $props();
  const photos = $derived(Array.isArray(edit.draft.images) ? edit.draft.images : []);
  let error = $state("");
  let area = $state();
  let picking = $state(false);
  // The file input lives here, not in the dialog: it must outlive the dialog
  // for the chosen photo to arrive at all. See PhotoPicker.
  let fileInput = $state();
  let disposed = false;
  let controller;
  onDestroy(() => { disposed = true; controller?.abort(); busy = false; });

  // A revert replaces the draft: an open picker no longer applies. Not while a
  // photo is being prepared, so the message about it lands where the user is
  // looking rather than behind a dialog that vanished.
  let pickedAt = $state(0);
  $effect(() => { if (picking && !busy && edit.version !== pickedAt) picking = false; });

  async function add(readFiles) {
    if (busy) return;
    busy = true; error = "";
    const version = edit.version;
    controller = new AbortController();
    try {
      const files = await readFiles(controller.signal);
      const ready = [];
      for (const file of files) ready.push(await preparePhoto(file));
      if (!disposed && edit.version === version) {
        const next = [...photos, ...ready];
        if (!photosFit(next)) throw new Error("This recipe has too much photo data. Remove a photo or choose smaller images.");
        edit.set("images", next);
        picking = false;
      }
      // The draft was replaced while this was being prepared: say so rather
      // than dropping the photo without a word.
      else if (!disposed) error = "The recipe changed while that photo was being prepared. Add it again.";
    } catch (err) {
      if (!disposed && err.name !== "AbortError") error = err.message || "Could not add that photo.";
    } finally { if (!disposed) busy = false; }
  }
  function fromUrl(value) {
    const url = String(value ?? "").trim();
    if (!url) return;
    return add(async (signal) => [await photoFromUrl(url, { user: get(user), signal })]);
  }
  function paste(e) {
    const files = Array.from(e.clipboardData?.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (files.length) { e.preventDefault(); void add(async () => files); }
    else if (e.target === area) {
      const text = e.clipboardData?.getData("text/plain")?.trim();
      if (/^https:\/\//i.test(text ?? "")) { e.preventDefault(); void fromUrl(text); }
    }
  }
  async function readClipboard() {
    if (!navigator.clipboard?.read) { error = "Paste a copied photo here with Ctrl+V or ⌘V, or choose a photo."; return; }
    await add(async () => {
      let items;
      try { items = await navigator.clipboard.read(); }
      catch { throw new Error("Clipboard access was blocked. Paste here with Ctrl+V or ⌘V, or choose a photo."); }
      const files = [];
      for (const item of items) {
        const type = item.types.find((t) => t.startsWith("image/") && t !== "image/svg+xml");
        if (type) files.push(await item.getType(type));
      }
      if (!files.length) throw new Error("Copy a photo first, then paste it here.");
      return files;
    });
  }
  function move(i, direction) {
    const next = [...photos];
    const j = i + direction;
    [next[i], next[j]] = [next[j], next[i]];
    edit.set("images", next);
  }
  function openPicker() { error = ""; pickedAt = edit.version; picking = true; }
</script>

<Fieldset border="1px solid color-mix(in oklab, currentColor 20%, transparent)" padding="0.9rem 1rem" borderRadius="0.5rem">
  {#snippet legend()}Photos{/snippet}
  <section class="photos-editor" aria-label="Photo paste area" bind:this={area} onpaste={paste}>
    {#if photos.length}
      <ol class="photo-list">
        {#each photos as photo, i}
          <li>
            {#if /^data:image\/(png|jpeg|webp|gif|avif);/i.test(photo.url ?? "")}
              <img src={photo.url} alt={photo.caption || `Recipe photo ${i + 1}`} />
            {:else}<p><Text muted>Existing photo {i + 1}</Text></p>{/if}
            <FormItem>
              {#snippet label()}Caption{/snippet}
              <Input aria-label="Caption for photo {i + 1}" value={photo.caption ?? ""} oninput={(e) => {
                const next = [...photos]; next[i] = { ...photo, caption: e.currentTarget.value }; edit.set("images", next);
              }} />
            </FormItem>
            <Inline wrap>
              <Button onclick={() => move(i, -1)} disabled={i === 0 || busy} aria-label="Move photo {i + 1} earlier">↑</Button>
              <Button onclick={() => move(i, 1)} disabled={i === photos.length - 1 || busy} aria-label="Move photo {i + 1} later">↓</Button>
              <Button onclick={() => edit.set("images", photos.filter((_, n) => n !== i))} disabled={busy} aria-label="Remove photo {i + 1}">Remove photo</Button>
            </Inline>
          </li>
        {/each}
      </ol>
    {:else}
      <p><Text muted>No photos yet. The first one you add appears on the recipe and in your recipe list.</Text></p>
    {/if}
    <Inline wrap>
      <Button onclick={openPicker} disabled={busy}>Add photo…</Button>
      {#if busy}<Text role="status">Preparing photo…</Text>{/if}
    </Inline>
    <!-- Outside the dialog on purpose: a photo chosen from the device arrives
         on this input's change event, long after the dialog may have gone. -->
    <input
      bind:this={fileInput}
      class="file-trigger"
      type="file"
      accept="image/*"
      multiple
      disabled={busy}
      aria-label="Upload photos"
      onchange={(e) => {
        const input = e.currentTarget;
        const files = Array.from(input.files ?? []);
        input.value = "";
        if (files.length) void add(async () => files);
      }}
    />
    {#if error && !picking}<p role="alert"><Text warning>{error}</Text></p>{/if}
    <p><Text muted>You can also paste a copied photo straight into this box.</Text></p>
  </section>
</Fieldset>

{#if picking}
  <PhotoPicker
    {busy}
    {error}
    onfiles={(files) => add(async () => files)}
    onchoose={() => fileInput?.click()}
    onurl={fromUrl}
    onclipboard={readClipboard}
    onclose={() => { picking = false; error = ""; }}
  />
{/if}
