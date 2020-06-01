<script>
 import {slide,fade} from 'svelte/transition'
 import {registerBuild} from '../../stores/debug.js'; registerBuild(BUILD_MS);
 import NumberUnitInput from '../../widgets/NumberUnitInput.svelte'
 import IngredientInput from '../../widgets/IngredientInput.svelte'
 import IconButton from '../../widgets/IconButton.svelte';
 import Menu from '../../widgets/Menu.svelte';
 import MenuItem from '../../widgets/MenuItem.svelte';
 export let ing
 export let onChange
 export let onEnter
 export let onDelete
 export let onMove
 export let shouldFocus
 export let groups
 export let position
 export let parent
 let showMenu;
 let topLevel;
 let groupName;
 $: {
     topLevel = true;
     for (let g of groups) {
         if (g.ingredients == parent) {
             topLevel = false;
             groupName = g.text
         }
     }
 }

 
</script>
{#if ing.reference}
    <NumberUnitInput
        bind:value="{ing.amount}"
        {onChange}
    />    
    <td>FIX ME</td>
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
    <td style="border:none">
        <Menu
            icon="more_vert"
            anchorRight="{true}"
        >
            {#if position > 0}
                <MenuItem icon="arrow_upward"
                          on:click="{()=>onMove(-1)}"
                >
                    Move Up
                </MenuItem>
            {/if}
            {#if position < (parent.length -1) }
                <MenuItem icon="arrow_downward"
                          on:click="{()=>onMove(1)}"
                >
                    Move Down
                </MenuItem>
            {/if}
            {#if !ing.amount || (!ing.amount.amount && !ing.amount.unit)}
                <MenuItem icon="collections"
                          on:click="{()=>{onChange({...ing,ingredients:[]});}}"
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
                Add Recipe as Ingredient
            </MenuItem>            
            {#if !topLevel}
                <MenuItem icon="arrow_leftward"
                          on:click="{()=>onMove(0,'top')}"
                >
                    Move out of {groupName}
                </MenuItem>
            {/if}
            {#each groups as group}
                {#if group.ingredients !== parent}
                    <MenuItem icon="arrow_rightward"
                              on:click="{()=>onMove(0,group.ingredients)}"
                    >
                        Move into {group.text}
                    </MenuItem>
                {/if}
            {/each}
        </Menu>
    </td>
    {#if showMenu}
        <div class="menu" in:slide out:fade>
            Menu of stuff here?
        </div>

    {/if}
{/if}
