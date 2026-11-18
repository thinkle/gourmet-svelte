<script>
  // Shows the question asked with confirm.svelte.js's ask().
  import { Dialog, Button, Inline } from "contain-css-svelte";
  import { pending, reply } from "../app/confirm.svelte.js";
  const q = $derived(pending.question);
</script>

{#if q}
  <!-- Not `dismissible`: Contain's backdrop check reads a keyboard-made
       click (Enter on a button, clientX/Y 0) as a click outside, so the
       answer would always be "no". Escape still closes it. See CONTAIN_NOTES gap log. -->
  <Dialog open modal onclose={() => reply(false)} aria-label={q.title}>
    <h2>{q.title}</h2>
    {#if q.body}<p>{q.body}</p>{/if}
    <Inline>
      <Button primary={!q.danger} danger={q.danger} onclick={() => reply(true)}>{q.yes ?? "OK"}</Button>
      <Button onclick={() => reply(false)}>{q.no ?? "Cancel"}</Button>
    </Inline>
  </Dialog>
{/if}
