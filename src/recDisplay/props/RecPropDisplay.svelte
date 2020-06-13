<script>
 export let prop;
 export let value;
 
 $: {if (prop.array && !value) {
     value = []
  }}
        import {NumberUnitDisplay,TimeLink} from '../../widgets/';

 import RecDef from '../../common/RecDef.js';
 import RecipeText from '../text/RecipeText.svelte';

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

{#if !value}
    {#if prop.nullValueText}
        <span>{prop.nullValueText}</span>
    {/if}
{:else}
    {#if prop.array}
        {#if Array.isArray(value)}
            {#each value as v,n}
                <span class="arrayval" class:tag="{prop.displayAsTag}">
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
            Invalid property value: ${value}
            {console.log('Invalid value: ',value)}
        {/if}
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
{/if}
<style>
 .tag {
     background-color: var(--light-bg);
     color: var(--light-fg);
     border-radius: 5px;
     border-width: 1px;
     border-style: solid;
     border-color: var(--medium-underline);
     padding: 3px;
     display: inline-block;
     margin-right: 5px;

 }
</style>
