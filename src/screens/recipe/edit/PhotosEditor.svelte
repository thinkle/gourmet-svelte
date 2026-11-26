<script>
  import { onDestroy } from "svelte";
  import { get } from "svelte/store";
  import { Button, Fieldset, FormItem, Input, Inline, Text } from "contain-css-svelte";
  import { user } from "../../../auth/session.js";
  import { preparePhoto, photoFromUrl, photosFit } from "../../../app/recipePhotos.js";

  let { edit, busy = $bindable(false) } = $props();
  const photos = $derived(Array.isArray(edit.draft.images) ? edit.draft.images : []);
  let url = $state("");
  let error = $state("");
  let area = $state();
  let disposed = false;
  let controller;
  onDestroy(() => { disposed = true; controller?.abort(); busy = false; });

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
      }
    } catch (err) {
      if (!disposed && edit.version === version && err.name !== "AbortError") error = err.message || "Could not add that photo.";
    } finally { if (!disposed) busy = false; }
  }
  function fromUrl() {
    const value = url.trim();
    return add(async (signal) => [await photoFromUrl(value, { token: get(user)?.access_token, signal })]);
  }
  function paste(e) {
    const files = Array.from(e.clipboardData?.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (files.length) { e.preventDefault(); void add(async () => files); }
    else if (e.target === area) {
      const text = e.clipboardData?.getData("text/plain")?.trim();
      if (/^https:\/\//i.test(text ?? "")) { e.preventDefault(); url = text; void fromUrl(); }
    }
  }
  async function readClipboard() {
    area?.querySelector("button")?.focus();
    if (!navigator.clipboard?.read) { error = "Paste a copied photo here with Ctrl+V or ⌘V, or use Upload photos."; return; }
    await add(async () => {
      let items;
      try { items = await navigator.clipboard.read(); }
      catch { throw new Error("Clipboard access was blocked. Paste here with Ctrl+V or ⌘V, or use Upload photos."); }
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
</script>

<Fieldset>
  {#snippet legend()}Photos{/snippet}
  <section class="photos-editor" aria-label="Photo paste area" bind:this={area} onpaste={paste}>
    <p><Text muted>The first photo appears on the recipe and in your recipe list. Paste a copied photo here, or add one below.</Text></p>
    <FormItem>
      {#snippet label()}Upload photos{/snippet}
      <input type="file" accept="image/*" multiple disabled={busy} onchange={(e) => {
        const input = e.currentTarget;
        const files = Array.from(input.files ?? []);
        if (files.length) void add(async () => files);
        input.value = "";
      }} />
    </FormItem>
    <Inline wrap>
      <Button onclick={readClipboard} disabled={busy}>Paste photo</Button>
      {#if busy}<Text role="status">Preparing photo…</Text>{/if}
    </Inline>
    <FormItem>
      {#snippet label()}Photo URL{/snippet}
      <Inline wrap>
        <Input type="url" bind:value={url} placeholder="https://example.com/photo.jpg" aria-label="Photo URL" disabled={busy}
          onkeydown={(e) => { if (e.key === "Enter") { e.preventDefault(); void fromUrl(); } }} />
        <Button onclick={fromUrl} disabled={busy || !url.trim()}>Import photo</Button>
      </Inline>
    </FormItem>
    {#if error}<p role="alert"><Text warning>{error}</Text></p>{/if}
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
  </section>
</Fieldset>
