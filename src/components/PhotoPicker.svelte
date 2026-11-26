<script>
  // The three ways to add a photo, in one dialog: a file, the clipboard, or
  // a URL. Laid out as one labelled column so the three do not sit at three
  // different indents the way they did inline.
  //
  // No photo logic here: the parent owns `busy`, `error` and what to do with
  // what comes back. This component only collects files or a URL.
  import { Dialog, Button, FormItem, Input, Inline, Text } from "contain-css-svelte";

  let { busy = false, error = "", onfiles, onurl, onclipboard, onclose } = $props();
  let url = $state("");
  let fileInput = $state();

  const submitUrl = () => { if (url.trim()) onurl?.(url.trim()); };

  function paste(e) {
    const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
    if (files.length) { e.preventDefault(); onfiles?.(files); return; }
    const text = e.clipboardData?.getData("text/plain")?.trim();
    if (/^https:\/\//i.test(text ?? "")) { e.preventDefault(); url = text; onurl?.(text); }
  }
</script>

<Dialog open dismissible {onclose} aria-label="Add a photo">
  <div class="photo-picker" onpaste={paste}>
    <h2>Add a photo</h2>
    <p><Text muted>The first photo appears on the recipe and in your recipe list.</Text></p>

    <FormItem>
      {#snippet label()}From your device{/snippet}
      <Inline wrap>
        <Button onclick={() => fileInput?.click()} disabled={busy}>Choose photo…</Button>
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
            if (files.length) onfiles?.(files);
          }}
        />
      </Inline>
    </FormItem>

    <FormItem>
      {#snippet label()}From the clipboard{/snippet}
      <Inline wrap>
        <Button onclick={() => onclipboard?.()} disabled={busy}>Paste photo</Button>
        <Text muted>or press {navigator.platform?.startsWith("Mac") ? "⌘V" : "Ctrl+V"} here</Text>
      </Inline>
    </FormItem>

    <FormItem>
      {#snippet label()}From the web{/snippet}
      <Inline wrap>
        <Input
          type="url"
          bind:value={url}
          placeholder="https://example.com/photo.jpg"
          aria-label="Photo URL"
          disabled={busy}
          onkeydown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitUrl(); } }}
        />
        <Button onclick={submitUrl} disabled={busy || !url.trim()}>Import photo</Button>
      </Inline>
    </FormItem>

    {#if busy}<p><Text role="status">Preparing photo…</Text></p>{/if}
    {#if error}<p role="alert"><Text warning>{error}</Text></p>{/if}

    <Inline wrap>
      <Button onclick={onclose} disabled={busy}>Done</Button>
    </Inline>
  </div>
</Dialog>
