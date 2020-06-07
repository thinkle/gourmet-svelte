<script>
 export let item
 import {floatToFrac} from '../utils/numbers.js';
 import {crossfade} from 'svelte/transition'
 import PlainInput from '../widgets/PlainInput.svelte';
 import NumberUnitDisplay from '../widgets/NumberUnitDisplay.svelte';
 import Ingredient from '../recDisplay/ing/Ingredient.svelte'
 import IconButton from '../widgets/IconButton.svelte';
 import Button from '../widgets/Button.svelte';
 import {shoppingList} from '../stores/shoppingStores.js';
 import {titleCase} from '../utils/textUtils.js';

 let [send,receive] = crossfade({duration:300});

 export let showItems=true;

 let editingItem
 function onItemChanged (event) {
     for (let itm of item.items) {
         shoppingList.setShopItem(itm,newShopItem)
     }
     console.log('done!');
     editingItem = false
     console.log('cool');
 }
 let newShopItem = item && item.item || '';

</script>
<tr>
    <td>
        <table>
            {#each item.amounts as amount,n}
                <tr>
                    <NumberUnitDisplay mode="table" multipliable="{false}" value="{amount}"/>
                </tr>
            {/each}
        </table>
    </td>
    <td>
        {#if !editingItem}
            <div
                on:click="{()=>editingItem=true}"
            >
                {item.item}
                <IconButton
                    small="true"
                    icon="edit"
                    bare="true"/>
            </div>
        {:else}
            <div>
                <PlainInput bind:value="{newShopItem}"/>
                <IconButton small="true"
                            icon="done"
                            bare="true"
                            on:click={()=>onItemChanged()}/>
            </div>
        {/if}
        <small on:click="{()=>showItems=!showItems}">
            ({item.items.length}
            {#if item.items.length==1}
                item
            {:else}
                separate items
            {/if})
            {#if !showItems}
                <span class="origin" in:receive out:send>
                </span>
            {/if}
        </small>
        
        <div class="break">
            {#if showItems}
                {#each item.items as subitem}
                    <div in:receive out:send>
                        <small>
                            <!-- <Ingredient ing={subitem.ingredient} edit="{false}" /> -->
                            <NumberUnitDisplay
                                value="{subitem.ingredient.amount}"
                                multiplyBy="{subitem.multiplier}"/>
                            {subitem.ingredient.text}
                            {#if titleCase(subitem.ingredient.text) !== item.item}
                                <Button on:click={()=>shoppingList.setShopItem(subitem,titleCase(subitem.ingredient.text))}>
                                    Separate
                                </Button>
                            {/if}
                            from
                            <i>{subitem.source.title}</i>
                            {#if subitem.multiplier}
                                &times;{floatToFrac(subitem.multiplier)}
                            {/if}
                        </small>
                    </div>
                {/each}
            {/if}
        </div>
    </td>
</tr>

<style>
 .origin {
     position: relative;
     width: 6em;
     height: 1em;
     left: -6em;
 }
 tr:last-child td {
     border-bottom: none;
 }
 td {
     border-bottom: 1px solid var(--light-underline);
     padding-top: 10px;
     padding-bottom: 10px;
 }
 small {
     font-size: var(--small);
 }
 i {
     font-style: italic;
 }
 table :global(td) {
     text-align: center;
 }
 td div {
     display: inline-flex;
 }
 td div.break,
 td div.break div {
     display: block
 }
</style>
