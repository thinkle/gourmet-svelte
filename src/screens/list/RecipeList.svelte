<script>
  import { DataList, DataListItem, Text } from "contain-css-svelte";
  import RecipeSwatch from "../../components/RecipeSwatch.svelte";
  import CategoryTag from "../../components/CategoryTag.svelte";
  import { fmtTime, stars, sourceLabels } from "../../app/lib.js";
  let { results, onopen } = $props();
  // The categories that matched the search come first; then the tidy ones.
  const tags = (hit) => [...new Set([...hit.cats, ...hit.recipe.tidyCats])].slice(0, 3);
</script>

<DataList iconSize="3.5rem" class="recipe-list">
  {#each results as hit (hit.recipe.id)}
    {@const r = hit.recipe}
    <DataListItem interactive onclick={() => onopen(r)}>
      {#snippet start()}<RecipeSwatch recipe={r} />{/snippet}
      <h4>{r.title}</h4>
      <p>
        {#each tags(hit) as c}<CategoryTag name={c} />{/each}
        {#if hit.source}<Text muted>from</Text> {hit.source}
        {:else if hit.ingredient}<Text muted>with</Text> {hit.ingredient}
        {:else if hit.inText}<Text muted>mentioned in the text</Text>
        {:else if !tags(hit).length}<Text muted>{r.flat.slice(0, 4).map((i) => i.text).filter(Boolean).join(", ")}</Text>{/if}
      </p>
      {#snippet end()}
        {@const src = sourceLabels(r)}
        {#if src.length}<span class="source" title={src.join(", ")}><span class="name">{src[0]}</span>{#if src.length > 1}<span class="more">+{src.length - 1}</span>{/if}</span>{/if}
        {#if r.rating}<span class="stars" aria-label="Rated {Math.round(r.rating / 2)} of 5">{stars(r.rating)}</span>{/if}
        {#if fmtTime(r.seconds)}<Text muted>{fmtTime(r.seconds)}</Text>{/if}
      {/snippet}
    </DataListItem>
  {/each}
</DataList>
