<!-- A quick summary of the recipe -->
<script>
 export let recipe

 import IngredientList from '../../recDisplay/ing/IngredientList.svelte';
 import TimeSummary from '../../recDisplay/rec/TimeSummary.svelte';
 import {AmountInput,Button,Tabs,Tab} from '../../widgets/';

 import {onMount,setContext,getContext} from 'svelte'
 import {writable} from 'svelte/store'


 import {backgroundSetIngredients} from '../messaging/highlighterMessages.js';
 
 let multiplier = writable(1);
 setContext('multiplier',multiplier);

 function doPageHighlightMagic () {
     if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
         backgroundSetIngredients.send(
             recipe.ingredients
         );
     }
 }

 $: doPageHighlightMagic(recipe)

 const ING = 0
 const TIME = 1
 let mode=ING
 
</script>
<Tabs sticky="{true}" stickyTop="2.2em;">
    <Tab on:click="{()=>mode=ING}" active="{mode==ING}">Ingredients</Tab>
    <Tab on:click="{()=>mode=TIME}" active="{mode==TIME}">Times</Tab>
    {#if mode==ING}
    <div class='multiplier'>
        &times;
        <AmountInput
            value="{$multiplier}"
            on:change="{(e)=>$multiplier=e.detail}"
            showPlusMinusButtons="{true}"
        />
    </div>
    {/if}
</Tabs>
{#if mode==TIME}
    <TimeSummary rec="{recipe}"/>
{/if}
{#if mode==ING}
    <IngredientList editabe="{false}" ingredients="{recipe.ingredients}"/>
{/if}
<style>
 .multiplier {
     /* Align to the bottom like a tab + to the right */
     align-self: flex-end;
     margin-left: auto; 
 }
 nav {
     display: flex;
     flex-direction: row;
     flex-wrap: wrap;
 }
</style>
