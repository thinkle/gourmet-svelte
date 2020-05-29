<script>
 import RecDef from '../../common/RecDef.js';
 import RecPropDisplay from './RecPropDisplay.svelte';
 export let recipe
 export let onClick
 export let maxImageWidth=150
 let thumb;
 $: thumb = recipe.images && recipe.images.length > 0 && recipe.images[0];
 function wowAClick (event) {
     if (onClick) {
         onClick(event);
     }
 }
</script>
<tr class='summary' style={`--maxImageWidth:${maxImageWidth}px`}>
    <slot/>
    <td>
        {#if thumb}
            <img src={thumb.thumbnailUrl||thumb.url} alt={thumb.alt||recipe.title}/>
        {/if}
    </td>
    <td class="clickable" on:click={wowAClick}>
        <h3>{recipe.title}</h3>
    </td>
    {#each RecDef.recProps.filter((p)=>p.summaryView) as prop}
        <td>
            <RecPropDisplay prop={prop} value={recipe[prop.name]}></RecPropDisplay>
        </td>
    {/each}        
</tr>
<style>
 .clickable:hover {
     text-decoration: underilne;
 }
 img {
     max-width: var(--maxImageWidth)
 }
</style>
