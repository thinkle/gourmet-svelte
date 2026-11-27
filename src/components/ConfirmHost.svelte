<script>
  // Shows the question asked with confirm.svelte.js's ask().
  import { Dialog, Button, Inline } from "contain-css-svelte";
  import { pending, reply } from "../app/confirm.svelte.js";
  const q = $derived(pending.question);
</script>

{#if q}
  <!-- Deliberately not `dismissible`: an unanswered question should not go
       away on a stray click outside it. Escape still closes it, answering no.
       (Contain 1.10.1 and earlier also read a keyboard-made click inside as a
       click outside, which made the answer always "no"; fixed in 1.10.2.) -->
  <Dialog open modal onclose={() => reply(false)} aria-label={q.title}>
    <h2>{q.title}</h2>
    {#if q.body}<p>{q.body}</p>{/if}
    <Inline>
      <Button primary={!q.danger} danger={q.danger} onclick={() => reply(true)}>{q.yes ?? "OK"}</Button>
      <Button onclick={() => reply(false)}>{q.no ?? "Cancel"}</Button>
    </Inline>
  </Dialog>
{/if}
