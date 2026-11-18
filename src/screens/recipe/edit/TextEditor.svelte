<script>
  // The recipe's text blocks: a header and a body each. Bodies are edited
  // with RichTextBody, which writes nothing back unless the body is edited.
  import { Button, CircleButton, Input, Inline, Text } from "contain-css-svelte";
  import RichTextBody from "../../../components/RichTextBody.svelte";
  import { textView } from "../../../app/recipeEdit.js";

  /** @type {{ edit: import("../../../app/editState.svelte.js").RecipeEdit }} */
  let { edit } = $props();
  const blocks = $derived(textView(edit.draft.text));
  // Remount the bodies when blocks are reordered or removed, so each region
  // shows its own block (they keep their own DOM once filled).
  let order = $state(0);

  const blockList = () => edit.list("text");
  function move(i, dir) {
    const l = blockList();
    const j = i + dir;
    if (j < 0 || j >= l.length) return;
    l.splice(j, 0, l.splice(i, 1)[0]);
    order += 1;
  }
  function remove(i) {
    blockList().splice(i, 1);
    order += 1;
  }
</script>

<section class="text-editor" aria-label="Text">
  {#key `${edit.version}-${order}`}
    {#each blocks as b, i}
      <div class="text-block-editor">
        <Inline>
          <Input value={b.header ?? ""} placeholder="Heading, e.g. Instructions" aria-label="Heading"
            oninput={(e) => (blockList()[i].header = e.currentTarget.value)} />
          <CircleButton aria-label="Move block up" onclick={() => move(i, -1)}>↑</CircleButton>
          <CircleButton aria-label="Move block down" onclick={() => move(i, 1)}>↓</CircleButton>
          <CircleButton aria-label="Remove block" onclick={() => remove(i)}>×</CircleButton>
        </Inline>
        <RichTextBody body={b.body} label={b.header || "Text"} onchange={(html) => (blockList()[i].body = html)} />
      </div>
    {:else}
      <p><Text muted>No text yet.</Text></p>
    {/each}
  {/key}
  <Button onclick={() => blockList().push({ header: "", body: "" })}>Add a text block</Button>
</section>
