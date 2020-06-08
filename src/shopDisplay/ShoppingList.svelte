<script>
 import {fade,slide} from 'svelte/transition'
 import {connected} from '../stores/recipeStores.js';
 import {shoppingList,recipesOnList} from '../stores/shoppingStores.js';
 import JsonDebug from '../widgets/JsonDebug.svelte';
 import Button from '../widgets/Button.svelte';
 import IconButton from '../widgets/IconButton.svelte';
 import AmountInput from '../widgets/AmountInput.svelte';
 import IngredientInput from '../widgets/IngredientInput.svelte'; 
 import RecipePicker from '../recDisplay/picker/RecipePicker.svelte';
 import RecipePickerLauncher from '../recDisplay/picker/RecipePickerLauncher.svelte';
 import ShoppingListItems from './ShoppingListItems.svelte';
 
 import {onMount} from 'svelte';

 onMount(
     ()=>{
         if (!$shoppingList || $shoppingList.length < 1) {
             shoppingList.get();
         }
     }
 );
 let saving

 let showAdd=false
 let showRecipes=true
 let showSubItems=true
 
 function addItem (item) {
     shoppingList.addItem(item);
     return true; // tells input to clear
 }

</script>
<div class="contain">
    {#if !$connected}
        Connecting to DB...
    {:else if !$shoppingList}
        Still loading... still no shopping list
    {:else}
        <!-- Toolbar -->
        <div class="top">
            {#if $shoppingList.length > 0}
                <h2>Shopping List</h2>
                <Button toggle="true" toggled="{showSubItems}" on:click="{()=>showSubItems=!showSubItems}">Show details</Button>
                <IconButton toggle="true" toggled="{showAdd}" on:click="{()=>showAdd=!showAdd}" icon="add">Add Items</IconButton>
                {#if !saving}
                    <Button width="5em" on:click="{()=>saving=shoppingList.save()}">
                        Save
                    </Button>
                {:else}
                    {#await saving}
                        <Button width="5em" inactive="true">
                            Saving...
                        </Button>
                    {:then}
                        <IconButton
                            icon="close"
                            on:click="{()=>saving=undefined}"
                        >
                            All set!
                            {function () {saving=false}()}
                        </IconButton>
                    {:catch err}
                        Something went wrong :(
                        <IconButton
                            icon="close"
                            on:click="{()=>saving=undefined}"
                        >
                            Try again later?
                        </IconButton>
                        Error: <JsonDebug data="{err}"/>
                    {/await}
                {/if}
            {/if}
            <RecipePickerLauncher
                onSelected="{shoppingList.addRecipe}"  
            >
                <Button>Add Recipe to List</Button>
            </RecipePickerLauncher>
        </div>

        {#if showAdd}
            <table in:fade="{{duraton:300}}" out:fade="{{duration:300}}">
                <IngredientInput
                    showAddButton="true"
                    onEnter="{addItem}"
                    shouldFocus="{true}"
                />
            </table>
        {/if}
        {#if ($recipesOnList && $recipesOnList.length > 0)}
            <h3 on:click="{()=>showRecipes=!showRecipes}">
                For {$recipesOnList.length} {#if $recipesOnList.length>1}Recipes{:else}Recipe{/if}
            </h3>
            {#if showRecipes}
                <table in:slide out:slide>
                    {#each $recipesOnList as recipe}
                        <tr>
                            <td>
                                <span>                         
                                    <AmountInput
                                        showPlusMinusButtons="{true}"
                                        value={recipe.multiplier}
                                                              on:change="{(event)=>{
                                                                         console.log('Setting quantity to',event.detail);
                                                                         shoppingList.updateRecipeQuantity(
                                                                             recipe.id,
                                                                             event.detail
                                                                         )
                                                                         }}"
                                    />
                                    &times;
                                </span>
                            </td>
                            <td>
                                {recipe.title}
                            </td>
                            <td>
                                <IconButton
                                    bare="true"
                                    icon="clear"
                                    on:click="{()=>shoppingList.removeRecipe(recipe.id)}"
                                >
                                </IconButton>
                            </td>
                        </tr>
                    {/each}
                </table>
            {/if}
        {/if}
        <div>
            <ShoppingListItems showSubItems="{showSubItems}" items="{$shoppingList}"/>
        </div>
        <JsonDebug data="{$shoppingList}"/>
    {/if}
</div>

<style>
 table {
     margin: auto;
 }
 .top {
     display: flex;
     align-items: center;
     justify-content: flex-end;
     position: sticky;
     top: 0;
     padding-top: 3px;
     background-color: var(--white);
     color: var(--black);
     z-index: 2;
     margin-bottom: var(--small);
 }
 .top :global(button) {
     margin-left: 1em;     
 }
 
 h2 {
     font-family: var(--uiFont);
     font-size: var(--large);
 }

 div {
     font-family: var(--recipeFont);
     
 }
 .contain {
     overflow-y: scroll;
     max-height: 100vh;
 }
 h3 {
     text-align: center;
 }
</style>
