<script>
  // The three ways to add a photo, in one dialog: a file, the clipboard, or
  // a URL. Laid out as one labelled column so the three do not sit at three
  // different indents the way they did inline.
  //
  // No photo logic here: the parent owns `busy`, `error` and what to do with
  // what comes back. This component only collects files or a URL.
  import { Dialog, Button, FormItem, Input, Inline, Text } from "contain-css-svelte";

  // Not `dismissible`: Contain reads any click that reaches the dialog with
  // coordinates outside its content box as a backdrop click, and a click made
  // by the keyboard or by script carries (0, 0). Escape and the close button
  // still shut it. `onchoose` opens a file input the PARENT keeps, outside
  // this dialog, for the same reason -- it has to outlive a dismissal.
  let { busy = false, error = "", onfiles, onchoose, onurl, onclipboard, onclose } = $props();
  let url = $state("");

  const submitUrl = () => { if (url.trim()) onurl?.(url.trim()); };

  function paste(e) {
    const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
    if (files.length) { e.preventDefault(); onfiles?.(files); return; }
    const text = e.clipboardData?.getData("text/plain")?.trim();
    if (/^https:\/\//i.test(text ?? "")) { e.preventDefault(); url = text; onurl?.(text); }
  }
</script>

<Dialog open {onclose} aria-label="Add a photo">
  <div class="photo-picker" onpaste={paste}>
    <h2>Add a photo</h2>
    <p><Text muted>The first photo appears on the recipe and in your recipe list.</Text></p>

    <FormItem>
      {#snippet label()}From your device{/snippet}
      <Inline wrap>
        <Button onclick={() => onchoose?.()} disabled={busy}>Choose photo…</Button>
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
