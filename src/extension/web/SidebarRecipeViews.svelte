<script>
 export let recipe
 
 import Recipe from '../../recDisplay/rec/Recipe.svelte'
 import {recipeActions,connected,storedRecipes} from '../../stores/recipeStores.js';
 import {IconButton,
         Tabs,
         Tab} from '../../widgets/';

 let mode = 'full'

 // promise
 let saving;

 function doSaveRecipe () {
     saving = recipeActions.createRecipe(recipe);    
 }

</script>
<Tabs sticky="{true}" top="2.2em">
    <Tab active="{mode=='full'}" on:click="{()=>{mode='full'}}">Whole Recipe</Tab>
    <Tab active="{mode=='summary'}" on:click="{()=>{mode='summary'}}">Summary</Tab>
    <Tab active="{mode=='save'}" on:click="{()=>{mode='save'}}"><span class="important">Save</span></Tab>
</Tabs>
{#if mode=='full'}
    <Recipe editable={false} rec={recipe} showShopping="{false}" />
{:else if mode=='summary'}
    <p>Sorry, this view will be awesome, but I haven't written it yet.</p>
{:else}
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
{/if}
<style>
 .important {
     color: #444;
 }
</style>
