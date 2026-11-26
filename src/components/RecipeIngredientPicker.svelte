<script>
  import { untrack } from "svelte";
  import { Dialog, Button, FormItem, Input, Inline, Text } from "contain-css-svelte";
  import AmountInput from "./AmountInput.svelte";
  import { recipeChoices } from "../app/recipeLinks.js";
  import { refFor } from "../app/shoppingList.js";
  let { recipes = [], current, onchoose, onclose, initialBatches = 1 } = $props();
  let query = $state("");
  let chosen = $state(null);
  let batches = $state(untrack(() => initialBatches > 0 ? initialBatches : 1));
  const choices = $derived(recipeChoices(recipes, current, query));
  const selected = $derived(recipes.find((r) => refFor(r) === chosen));
</script>

<Dialog open dismissible {onclose} aria-label="Add a recipe ingredient">
  <h2>Add a recipe ingredient</h2>
  <FormItem>
    {#snippet label()}Search recipes{/snippet}
    <Input bind:value={query} aria-label="Search recipes to link" placeholder="Recipe name or category" />
  </FormItem>
  <ul class="recipe-link-choices">
    {#each choices.slice(0, 40) as recipe}
      <li>
        <Button primary={refFor(recipe) === chosen} aria-pressed={refFor(recipe) === chosen} onclick={() => (chosen = refFor(recipe))}>
          {recipe.title || "(untitled)"}
          {#if recipe.categories?.length}<Text muted>{recipe.categories.map((c) => c.name || c).join(", ")}</Text>{/if}
        </Button>
      </li>
    {:else}<li><Text muted>No matching recipes.</Text></li>{/each}
  </ul>
  {#if choices.length > 40}<p><Text muted>Showing the first 40. Type more to narrow the list.</Text></p>{/if}
  <FormItem>
    {#snippet label()}How much of the recipe?{/snippet}
    <AmountInput times={false} bind:value={batches} label="Recipe batches" unit="batches" />
  </FormItem>
  <p><Text muted>1 batch uses the whole recipe; ½ uses half. Its ingredients are included when shopping.</Text></p>
  {#if selected}<p>Selected: <strong>{selected.title}</strong></p>{/if}
  <Inline wrap>
    <Button primary disabled={!selected} onclick={() => onchoose?.(selected, batches)}>Add linked recipe</Button>
    <Button onclick={onclose}>Cancel</Button>
  </Inline>
</Dialog>
