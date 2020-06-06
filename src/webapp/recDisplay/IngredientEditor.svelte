<script>
 import {registerBuild} from '../../stores/debug.js'; registerBuild(Number("BUILD_MS"));
 import {slide,fade} from 'svelte/transition'
 import SmallLabel from '../../widgets/SmallLabel.svelte';
 import NumberUnitInput from '../../widgets/NumberUnitInput.svelte'
 import IngredientInput from '../../widgets/IngredientInput.svelte'
 import IconButton from '../../widgets/IconButton.svelte';
 import Menu from '../../widgets/Menu.svelte';
 import MenuItem from '../../widgets/MenuItem.svelte';
 import RecipePickerLauncher from './RecipePickerLauncher.svelte';
 import {storedRecipes} from '../../stores/recipeStores.js';
 export let ing
 export let onChange
 export let onEnter
 export let onDelete
 export let onMove
 export let shouldFocus
 export let groups
 export let position
 export let parent
 let topLevel;
 let groupName;
 let menu;
 $: {
     topLevel = true;
     for (let g of groups) {
         if (g.ingredients == parent) {
             topLevel = false;
             groupName = g.text
         }
     }
 }


 function addRecipeReference (id) {
     ing.reference = $storedRecipes[id]._id || $storedRecipes[id].id // Prefer remote ID if we have it...
     ing.text = $storedRecipes[id].title || 'New Recipe';
     ing.amount = {
         amount : 1,
         unit : 'recipe',
     }
     console.log('Change!',ing);
     onChange(ing)
 }
 
</script>
{#if ing.reference}
    <NumberUnitInput
        bind:value="{ing.amount}"
        {onChange}
    />    
    <td>
        <SmallLabel>Recipe</SmallLabel>
        <input type="text" bind:value="{ing.text}">
        <RecipePickerLauncher
            onSelected="{addRecipeReference}"
        >
            (Change Recipe)
        </RecipePickerLauncher>
    </td>
{:else}
    <!-- Editor -->
    <td colspan="3">
        <IngredientInput
            {onChange}
            {onDelete}
            {onEnter}
            {shouldFocus}  
            {ing}
        />
    </td>
{/if}
<td style="border:none">
    <Menu
        bind:this={menu}
        icon="more_vert"
        anchorRight="{true}"
    >
        {#if position > 0}
            <MenuItem icon="arrow_upward"
                      on:click="{()=>menu.hideMenu(onMove(-1))}"
            >
                Move Up
            </MenuItem>
        {/if}
        {#if position < (parent.length -1) }
            <MenuItem icon="arrow_downward"
                      on:click="{()=>menu.hideMenu(onMove(1))}"
            >
                Move Down
            </MenuItem>
        {/if}
        {#if topLevel && (!ing.amount || (!ing.amount.amount && !ing.amount.unit))}
            <MenuItem icon="collections"
                      on:click="{()=>{menu.hideMenu(onChange({...ing,ingredients:[]}))}}"
            >
                Make into group
            </MenuItem>
        {/if}
        <MenuItem 
            icon="delete"
            on:click="{onDelete}"
        >
            Delete
        </MenuItem>
        <MenuItem>
            <RecipePickerLauncher
                onSelected="{(id)=>menu.hideMenu(addRecipeReference(id))}"
                onClose="{menu.hideMenu}"
            >Add Recipe as Ingredient</RecipePickerLauncher>
        </MenuItem>            
        {#if !topLevel}
            <MenuItem icon="arrow_leftward"
                      on:click="{()=>menu.hideMenu(onMove(0,'top'))}"
            >
                Move out of {groupName}
                </MenuItem>
        {/if}
        {#each groups as group}
            {#if group.ingredients !== parent}
                <MenuItem icon="arrow_rightward"
                              on:click="{()=>menu.hideMenu(onMove(0,group.ingredients))}"
                >
                    Move into {group.text}
                </MenuItem>
            {/if}
        {/each}
    </Menu>
</td>

