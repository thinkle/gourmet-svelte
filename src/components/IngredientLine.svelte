<script>
  // One ingredient as a line of text: "1 1/2 cups flour, sifted". When you
  // leave the line (or press Enter), Gourmet's own parser reads it, and what
  // it understood is shown beside it: the amount and unit pulled out of the
  // name. A line you did not change is never re-parsed.
  //
  // Keys: Enter adds a line below, Backspace in an empty line removes it,
  // Alt+Up / Alt+Down move it.
  import { Input } from "contain-css-svelte";
  import { ingredientLine, understood, parseLine } from "../app/recipeEdit.js";

  let { ing, path, onchange, onenter, onremove, onmove, placeholder = "e.g. 1 cup sugar" } = $props();

  const line = $derived(ingredientLine(ing));
  let text = $state("");
  let focused = false;
  let from = ""; // what the line said when editing started
  $effect(() => { const l = line; if (!focused) text = l; });

  const seen = $derived(understood(ing));

  function commit() {
    if (text === from) return;
    from = text;
    onchange?.(parseLine(text, ing));
  }

  function onkeydown(e) {
    if (e.key === "Enter") { e.preventDefault(); commit(); onenter?.(); }
    else if (e.key === "Backspace" && text === "") { e.preventDefault(); from = text; onremove?.(); }
    else if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      commit();
      onmove?.(e.key === "ArrowUp" ? -1 : 1);
    }
  }
</script>

<span class="ingredient-line">
  <Input
    value={text}
    {placeholder}
    data-path={path}
    aria-label="Ingredient"
    autocomplete="off"
    oninput={(e) => (text = e.currentTarget.value)}
    onfocus={() => { focused = true; from = text; }}
    onblur={() => { commit(); focused = false; text = ingredientLine(ing); }}
    {onkeydown}
  />
  {#if seen && (seen.amount || seen.unit)}
    <span class="understood" title="How Gourmet read this line">
      <span class="amount">{seen.amount}</span>
      {#if seen.unit}<span class="unit">{seen.unit}</span>{/if}
      {#each seen.also ?? [] as m}<span class="also">({m})</span>{/each}
      <span class="item">{seen.item}</span>
    </span>
  {/if}
</span>
