<script>
 import {fade,slide} from 'svelte/transition'
 import {connected} from '../stores/recipeStores.js';
 import {shoppingList,recipesOnList,localShopRec} from '../stores/shoppingStores.js';
 import {
     Bar,
     Button,
     FullHeight,
     IconButton,
     JsonDebug,
     AmountInput,
     NavActions,
     IngredientInput} from '../widgets/';
 import RecipePicker from '../recDisplay/picker/RecipePicker.svelte';
 import RecipePickerLauncher from '../recDisplay/picker/RecipePickerLauncher.svelte';
 import ShoppingListItems from './ShoppingListItems.svelte';
 import {titleCase} from '../utils/textUtils.js';
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
     item.shopItem = titleCase(item.text);
     shoppingList.addItem(item);
     return true; // tells input to clear
 }

</script>

    {#if !$connected}
        Connecting to DB...
    {:else if !$shoppingList}
        Still loading... still no shopping list
    {:else}
        <!-- Toolbar -->        
        <Bar>
            <h2 slot="center">Shopping List</h2>
            <div slot="right">
                <NavActions>
                    {#if $shoppingList.length > 0}
                        <Button toggle="true" toggled="{showSubItems}" on:click="{()=>showSubItems=!showSubItems}">Show details</Button>
                    {/if}
                    <IconButton toggle="true" toggled="{showAdd}" on:click="{()=>showAdd=!showAdd}" icon="add">Add Items</IconButton>
                    {#if !saving}
                        <Button width="5em" on:click="{()=>saving=shoppingList.save()}">
                            Save
                        </Button>
                    {:else}
                        {#await saving}
                            <Button width="5em" busy="{true}">
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
                    <RecipePickerLauncher
                        onSelected="{shoppingList.addRecipe}"  
                    >
                        <Button>Add Recipe to List</Button>
                    </RecipePickerLauncher>
                </NavActions>
            </div>
        </Bar>
        
        {#if showAdd}
            <table in:fade="{{duraton:300}}" out:fade="{{duration:300}}">
                <tr>
                    <td>Add Item:</td>
                    <td>
                        <IngredientInput
                            showAddButton="true"
                            onEnter="{addItem}"
                            shouldFocus="{true}"
                        />
                    </td>
                </tr>
            </table>
        {/if}
        <FullHeight scrolls={true}>
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
        {#if DEV}
            Shopping List: <JsonDebug data="{$shoppingList}"/>
            Shop Rec: <JsonDebug data="{$localShopRec}"/>
        {/if}
        </FullHeight>
    {/if}


<style>
 table {
     margin: auto;
 }
 
 h2 {
     font-family: var(--uiFont);
     font-size: var(--large);
 }

 div {
     font-family: var(--recipeFont);
     
 }
 h3 {
     text-align: center;
 }
</style>
