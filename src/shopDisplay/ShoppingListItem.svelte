<script>
 export let item
 export let ignored=false
 import {floatToFrac} from '../utils/numbers.js';
 import {crossfade} from 'svelte/transition'
 import {
     Button,IconButton,Checkbox,
     PlainInput,NumberUnitDisplay,
 } from '../widgets/';
  import Ingredient from '../recDisplay/ing/Ingredient.svelte'
  import {shoppingList} from '../stores/shoppingStores.js';
 import {titleCase} from '../utils/textUtils.js';

 let [send,receive] = crossfade({duration:300});

 export let showSubItems=true;

 let editingItem

 
 function setShopItem () {
     for (let itm of item.items) {
         if (itm.source.isTheShoppingList) {
             // special case when we are a custom item
             if (arguments[0]) {
                 // i.e. changing item
                 itm.ingredient.text = arguments[0];
                 itm.ingredient.shopItem = arguments[0];
                 shoppingList.updateItem(itm.ingredient);
             } else {
                 // i.e. removing item
                 shoppingList.removeItem(itm.ingredient.id);
             }
         } else { 
                shoppingList.setShopItem(itm,...arguments)
                }
     }
 }
 
 function onItemChanged (event) {
     setShopItem(newShopItem.replace(/^\s+|\s+$/g,''));
     editingItem = false
 }

 function onItemIgnore (event) {
     setShopItem(undefined,true)
 }
 function onItemDontIgnore (event) {
     setShopItem(undefined,false)
 }

 function setPurchased (event) {
     if (event.target.checked) {
         console.log('We should make it purchased!');
     } else {
         console.log('We should make it not purchased!');

     }
 }

 let newShopItem = item && item.item || '';

</script>
<tr class:ignored>
    <td>
        {#if !ignored}
            <!-- checked="{item.purchased}" -->
            <Checkbox size="36"
                      on:change="{setPurchased}"
            />
        {/if}
    </td>
    <td>
        <table>
            {#each item.amounts as amount,n}
                <tr>
                    {#if n}+{/if}<NumberUnitDisplay mode="table" multipliable="{false}" value="{amount}"/>
                </tr>
            {/each}
        </table>
    </td>
    <td>
        {#if !editingItem}
            <div>
                <div
                    on:click="{()=>editingItem=true}"
                >
                    {item.item}
                    <IconButton
                        small="true"
                        icon="edit"
                        bare="true"/>
                </div>
                {#if !ignored}
                    <IconButton
                        small="true"
                        icon="remove_shopping_cart"
                        bare="true"
                        on:click={()=>onItemIgnore()}/>
                {:else}
                    <IconButton
                        small="true"
                        icon="add_shopping_cart"
                        bare="true"
                        on:click={()=>onItemDontIgnore()}/>
                {/if}
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
        <small on:click="{()=>showSubItems=!showSubItems}">
            ({item.items.length}
            {#if item.items.length==1}
                item
            {:else}
                separate items
            {/if})
            {#if !showSubItems}
                <span class="origin" in:receive="{{key:item.item+'display'}}" out:send="{{key:item.item+'display'}}">
                </span>
            {/if}
        </small>
        
        {#if showSubItems}
            <div class="break" in:receive="{{key:item.item+'display'}}" out:send="{{key:item.item+'display'}}">
                {#each item.items as subitem}
                    <div in:receive={{key:subitem.ingredient}} out:send={{key:subitem.ingredient}}>
                        <small>
                            <!-- <Ingredient ing={subitem.ingredient} edit="{false}" /> -->
                            <NumberUnitDisplay
                                value="{subitem.ingredient.amount}"
                                multiplyBy="{subitem.multiplier}"/>
                            {subitem.ingredient.text}
                            {#if titleCase(subitem.ingredient.text) !== item.item && item.items.length > 1}
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
            </div>
        {/if}
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
 td {
     padding-right: 1em;
 }
 td div {
     display: inline-flex;
 }
 td div.break,
 td div.break div {
     display: block
 }
 
 .ignored {
     font-style: italic;
 }
</style>
