<script>
 import RecDef from '../../common/RecDef.js';
 import RecProp from './RecProp.svelte';
 export let recipe
 export let onClick
 let thumb;
 $: thumb = recipe.images && recipe.images.length > 0 && recipe.images[0];
 function wowAClick (event) {
     if (onClick) {
         onClick(event);
     }
 }
</script>
<tr class='summary' on:click={wowAClick}>
    <td>
        {#if thumb}
            <img src={thumb.thumbnailUrl||thumb.url} alt={thumb.alt||recipe.title}/>
        {/if}
    </td>
    <td>
        <h3>{recipe.title}</h3>
    </td>
    {#each RecDef.recProps.filter((p)=>p.summaryView) as prop}
        <td>
            <RecProp showLabel={false} editable={false} prop={prop} value={recipe[prop.name]}></RecProp>
        </td>
    {/each}        
</tr>
<style>
</style>
