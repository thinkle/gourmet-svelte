<script>
 export let prop;
 export let value;
 
 $: {if (prop.array && !value) {
     value = []
 }}
 import NumberUnitDisplay from '../../widgets/NumberUnitDisplay.svelte';
 import TimeLink from '../../widgets/TimeLink.svelte';
 import RecDef from '../../common/RecDef.js';
 import RecipeText from './RecipeText.svelte';

 let modes = RecDef.EditModes

 const propDisplay = {
     [modes.NUMUNIT] : NumberUnitDisplay,
     [modes.DUR] : TimeLink,
     [modes.RCH] : RecipeText,
 }

 var displayValue;
 function getDisplayVal (v) {
     return v && prop.toHtml && prop.toHtml(v) || v
 }
</script>
{#if prop.array}
    {#each value as v,n}
        <span class="arrayval">
            {#if propDisplay[prop.edit]}
                <svelte:component
                    this="{propDisplay[prop.edit]}"
                    bind:value="{v}"
                />
            {:else}
                <!-- generic display -->
                {@html getDisplayVal(v)}
            {/if}
        </span>
    {/each}
{:else}
    {#if propDisplay[prop.edit]}
        <svelte:component
            this="{propDisplay[prop.edit]}"
            bind:value="{value}"
        />
    {:else}
        <!-- generic display -->
        {@html getDisplayVal(value)}
    {/if}
{/if}
