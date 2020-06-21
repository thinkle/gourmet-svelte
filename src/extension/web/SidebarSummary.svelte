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
     backgroundSetIngredients.send(
         recipe.ingredients
     );
 }

 const ING = 0
 const TIME = 1
 let mode=ING
 
</script>
<Tabs sticky="{true}">
    <Tab on:click="{()=>mode=ING}" active="{mode==ING}">Ingredients</Tab>
    <Tab on:click="{()=>mode=TIME}" active="{mode==TIME}">Times</Tab>
</Tabs>
{#if mode==TIME}
    <h3>Times</h3>
    <TimeSummary rec="{recipe}"/>
{/if}
{#if mode==ING}
    <nav>
        <h3>Ingredients</h3>
        <Button on:click="{doPageHighlightMagic}">Highlight</Button>
        <div class='multiplier'>
            &times;
            <AmountInput
                value="{$multiplier}"
                on:change="{(e)=>$multiplier=e.detail}"
                showPlusMinusButtons="{true}"
            />
        </div>
    </nav>
    <IngredientList editabe="{false}" ingredients="{recipe.ingredients}"/>
{/if}
<style>
 nav {
     display: flex;
     flex-direction: row;
     flex-wrap: wrap;
 }
</style>
