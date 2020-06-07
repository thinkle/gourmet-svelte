<script>
 import {connected} from '../stores/recipeStores.js';
 import {shoppingList} from '../stores/shoppingStores.js';
 import JsonDebug from '../widgets/JsonDebug.svelte';
 import Button from '../widgets/Button.svelte';
 import IconButton from '../widgets/IconButton.svelte';

 import RecipePicker from '../recDisplay/picker/RecipePicker.svelte';
 import RecipePickerLauncher from '../recDisplay/picker/RecipePickerLauncher.svelte';
 import ShoppingListItems from './ShoppingListItems.svelte';
 
 import {onMount} from 'svelte';

 onMount(
     ()=>{
         shoppingList.get();
     }
 );

</script>
<div>
    {#if !($shoppingList && $connected) }
        Still loading...
        {$connected && "shopping list..."}
    {:else}
        <!-- Toolbar -->
        <div>
            <RecipePickerLauncher
                onSelected="{shoppingList.addRecipe}"  
            >
                <Button>Add Recipe to List</Button>
            </RecipePickerLauncher>
        </div>
        <div>
            <ShoppingListItems items="{$shoppingList}"/>
        </div>
        <JsonDebug data="{$shoppingList}"/>
    {/if}
</div>
