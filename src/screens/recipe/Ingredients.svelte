<script>
  import { Surface, Text } from "contain-css-svelte";
  import Ingredients from "./Ingredients.svelte";
  // The amount and any alternate measures ("2 sticks (225 g)"), scaled.
  import Measures from "../../components/Measures.svelte";
  import { findRecipe, isRef } from "../../app/shoppingList.js";
  let { recipes = [], onopen, list, mult = 1, active = null, onpick } = $props();
</script>

<ul class="ingredients">
  {#each list ?? [] as ing}
    {#if ing?.ingredients}
      <li class="group">
        <h4>{ing.text}</h4>
        <Ingredients list={ing.ingredients} {mult} {active} {onpick} {recipes} {onopen} />
      </li>
    {:else if ing}
      {@const target = isRef(ing) ? findRecipe(recipes, ing.reference) : null}
      <li>
        {#if target && onopen}
        <Surface as="button" type="button" class={["ingredient", "linked-recipe"]}
          aria-label="Open recipe {ing.text || target.title}" onclick={() => onopen(target)}>
          <span class="amount"><Text primary={mult !== 1}><Measures amount={ing.amount} altAmounts={ing.altAmounts} {mult} /></Text></span>
          <span class="item">{ing.text || target.title}</span>
        </Surface>
        {:else if isRef(ing)}
        <div class="ingredient">
          <span class="amount"><Measures amount={ing.amount} altAmounts={ing.altAmounts} {mult} /></span>
          <span class="item">{ing.text || "Linked recipe"} <Text muted>(recipe unavailable)</Text></span>
        </div>
        {:else}
        <Surface as="button" colorRole={active === ing.text ? "note" : null} type="button" class={["ingredient", active === ing.text && "active"]}
          data-ingredient={ing.text} aria-pressed={active === ing.text} onclick={() => onpick?.(ing.text)}>
          <span class="amount"><Text primary={mult !== 1}><Measures amount={ing.amount} altAmounts={ing.altAmounts} {mult} /></Text></span>
          <span class="item">{ing.text}</span>
        </Surface>
        {/if}
      </li>
    {/if}
  {/each}
</ul>
