<script>
 import RecDef from '../../common/RecDef.js';
 import RecPropDisplay from '../props/RecPropDisplay.svelte';
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
<td class="clickable title" on:click={wowAClick}>
    <h3>{recipe.title}</h3>
</td>
<td class="thumb" style={`--maxImageWidth:${maxImageWidth}px`}>
    {#if thumb}
        <div >
            <img src={thumb.url} alt={thumb.alt||recipe.title}/>
            <!-- Forget the thumbnails for now -->
        </div>
    {/if}
</td>
{#each RecDef.recProps.filter((p)=>p.summaryView) as prop}
    <td class="{prop.name}">
        <RecPropDisplay prop={prop} value={recipe[prop.name]}></RecPropDisplay>
    </td>
{/each}        
<style>
 .clickable:hover {
     text-decoration: underilne;
 }
 img {
    min-width: var(--maxImageWidth);
    max-height: var(--maxImageWidth);
    }
 div {
     border-radius: 50%;
     width: var(--maxImageWidth);
     height: var(--maxImageWidth);
     overflow: hidden;
 }
</style>
