<script>
 export let prop;
 export let value;
 export let clickable=undefined;
 export let onClick=undefined;
 import {NumberUnitDisplay,TimeLink} from '../../widgets/';
 import StarDisplay from './StarDisplay.svelte';
 $: {
     if (prop.array && !value) {
         value = []
 }}
 


 import RecDef from '../../common/RecDef.js';
 import RecipeText from '../text/RecipeText.svelte';
 

 let modes = RecDef.EditModes

 const propDisplay = {
     [modes.NUMUNIT] : NumberUnitDisplay,
     [modes.DUR] : TimeLink,
     [modes.RCH] : RecipeText,
     [modes.STAR] : StarDisplay,
 }

 var displayValue;
 function getDisplayVal (v) {
     return v && prop.toHtml && prop.toHtml(v) || v
 }

 function handleClick (value) {
     if (clickable && onClick) {
         onClick({
             value:value,
             html:getDisplayVal(value),
             text:getDisplayVal(value).replace(/<[^>]*>/g,'').replace(/^\s+|\s+$/g,''),
             prop:prop,
             target:prop.name
         })
     }
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
                <span class="arrayval" class:tag="{prop.displayAsTag}"
                      class:clickable
                      on:click="{()=>handleClick(v)}"
                >
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
            <span class:clickable on:click="{()=>handleClick(value)}">
                {@html getDisplayVal(value)}
            </span>
        {/if}
    {/if}
{/if}
<style>
 .tag {
     /* color: var(--light-fg); */
     /* border-color: var(--medium-underline); */
     /*      background-color: var(--light-bg); */
     border-radius: 5px;
     border-width: 1px;
     border-style: solid;
     background-color: var(--accent-fg);
     border-color: var(--accent-bg);
     color: var(--accent-bg);
     padding: 3px;
     display: inline-block;
     font-size: 0.8rem;
     font-weight: bold;
     text-align: center;

 }
 
 .arrayval {
     margin-right: 1em;
 }

 span :global(img) {
     display: block;
     max-width: calc(100% - 2em);
     margin: auto;
 }
</style>
