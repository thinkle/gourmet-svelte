<script>
 import {connected} from '../stores/recipeStores.js';
 import {shoppingList,recipesOnList} from '../stores/shoppingStores.js';
 import JsonDebug from '../widgets/JsonDebug.svelte';
 import Button from '../widgets/Button.svelte';
 import IconButton from '../widgets/IconButton.svelte';
 import AmountInput from '../widgets/AmountInput.svelte';
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

</script>
<div>
    {#if !$connected}
        Connecting to DB...
    {:else if !$shoppingList}
        Still loading... still no shopping list
    {:else}
        <!-- Toolbar -->
        <div class="top">
            {#if $shoppingList.length > 0}
                {#if !saving}
                    <Button on:click="{()=>saving=shoppingList.save()}">
                        Save
                    </Button>
                {:else}
                    {#await saving}
                        Saving... this will just take a second...
                    {:then}
                        <IconButton
                            icon="close"
                            on:click="{()=>saving=undefined}"
                        >
                            All set!
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
        <table>
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
        <div>
            <ShoppingListItems items="{$shoppingList}"/>
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
 }
.top :global(button) {
     margin-left: 1em;
 }
 div {
     font-family: var(--recipeFont);
     
 }
</style>
