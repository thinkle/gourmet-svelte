<script>
  import { Surface, Text } from "contain-css-svelte";
  import Ingredients from "./Ingredients.svelte";
  // The amount and any alternate measures ("2 sticks (225 g)"), scaled.
  import Measures from "../../components/Measures.svelte";
  let { list, mult = 1, active = null, onpick } = $props();
</script>

<ul class="ingredients">
  {#each list ?? [] as ing}
    {#if ing?.ingredients}
      <li class="group">
        <h4>{ing.text}</h4>
        <Ingredients list={ing.ingredients} {mult} {active} {onpick} />
      </li>
    {:else if ing}
      <li>
        <Surface as="button" colorRole={active === ing.text ? "note" : null} type="button" class={["ingredient", active === ing.text && "active"]}
          data-ingredient={ing.text} aria-pressed={active === ing.text} onclick={() => onpick?.(ing.text)}>
          <span class="amount"><Text primary={mult !== 1}><Measures amount={ing.amount} altAmounts={ing.altAmounts} {mult} /></Text></span>
          <span class="item">{ing.text}</span>
        </Surface>
      </li>
    {/if}
  {/each}
</ul>
