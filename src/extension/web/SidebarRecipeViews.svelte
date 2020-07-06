<script>
 export let recipe
 
 import Recipe from '../../recDisplay/rec/Recipe.svelte'
 import SidebarSummary from './SidebarSummary.svelte';
 import {recipeActions,connected,storedRecipes} from '../../stores/recipeStores.js';
 import {IconButton,
        Tabs,
        Tab} from '../../widgets/';

 let mode = 'summary'

 // promise
 let saving;

 function doSaveRecipe () {
     saving = recipeActions.createRecipe(recipe);    
 }
 
 function selectVariant (event) {
     console.log('Select',event.target.value);
     let oldRecipe = recipe;
     recipe = recipe.alternatives[event.target.value]
     recipe.alternatives = oldRecipe.alternatives;
     console.log('Changed to',recipe,'from',oldRecipe);
 }
 let variantNames = {
     0 : 'Merged',
     1 : 'By tag',
     2 : 'JSON',
 }

</script>
<Tabs sticky="{true}" top="2.2em">
    <Tab active="{mode=='summary'}" on:click="{()=>{mode='summary'}}">Summary</Tab>
    <Tab active="{mode=='full'}" on:click="{()=>{mode='full'}}">Whole Recipe</Tab>
    <Tab active="{mode=='save'}" on:click="{()=>{mode='save'}}"><span class="important">Save</span></Tab>
    {#if recipe.alternatives}
        <select on:change="{selectVariant}">
            {#each recipe.alternatives as variant,n}
                <option value="{n}">{variantNames[n]||n+1}</option>
            {/each}
        </select>
    {/if}
</Tabs>
{#if mode=='full' && recipe}
    <Recipe editable={false} rec={recipe} showShopping="{false}" />
{:else if mode=='summary' && recipe}
    <SidebarSummary recipe="{recipe}"/>
{:else if recipe}
    Once you have saved your recipe, you can view and edit it to your heart's content.
    If you would rather make changes <em>here</em>, enter the tagging view.
    {#if $connected}<IconButton icon="save" on:click={doSaveRecipe}>Save Recipe to Collection</IconButton>{/if}
    {#if saving}
        {#await saving}
            Creating recipe in database...
        {:then recipe}
            <a href={`${location.origin}/`} target="_BLANK">Open collection...</a>
            <a href={`${location.origin}/rec/${recipe.id}`} target="_BLANK">Open recipe</a>
        {:catch error}
            Unable to create recipe {error}
        {/await}
    {/if}
{:else}
    No recipe?
{/if}
<style>
 .important {
     color: #444;
 }
 select {
     margin-right: 1em;
     margin-left: auto;
     border: none;
 }
</style>
