<script>
 export let items
 import {flip} from 'svelte/animate';
 import JsonDebug from '../widgets/JsonDebug.svelte';
 import Button from '../widgets/Button.svelte';
 import IconButton from '../widgets/IconButton.svelte';
 import ShoppingListItem from './ShoppingListItem.svelte';
 
 import {extractItems} from '../utils/ingredientUtils.js';
 import {titleCase} from '../utils/textUtils.js';
 import {addAmounts} from '../utils/unitAmounts.js';

 let byShopItem = {}
 let uniqueItems = []

 import {crossfade} from 'svelte/transition';

 let [send,receive] = crossfade({duration:300});

 $: items && organizeItems();

 function getShopItem (ingredient) {
     if (ingredient.shopItem) {
         return ingredient.shopItem
     } else {
         let words = extractItems(ingredient.text)
         if (words.length > 0) {
             return titleCase(words.join(' ')||'');
         } else {
             return titleCase(ingredient.text||'');
         }
     }
 }


 function summarizeAmount (items,shopItem) {
     let multiplied = items.map(
         (i)=>{
             if (!i.multiplier || i.multiplier==1) {return i.ingredient.amount}
             else {
                 if (i.ingredient.amount && i.ingredient.amount.amount) {
                     return {
                         ...i.ingredient.amount,
                         amount : i.ingredient.amount.amount * i.multiplier,
                     }
                 } else {
                     return {
                         ...i.ingredient.amount,
                         amount:i.multiplier,
                     }
                 }
             }
         }
     );
     return addAmounts(multiplied,shopItem)
 }

 function organizeItems () {
     console.log('Re organizing items!');
     byShopItem = {
     }
     for (let item of items) {
         let shopItem = getShopItem(item.ingredient);
         if (!byShopItem[shopItem]) {
             byShopItem[shopItem] = [item]
         } else {
             byShopItem[shopItem].push(item)
         }
     }
     let shopItems = Object.keys(byShopItem);
     shopItems.sort(); // fix me...
     uniqueItems = shopItems.map(
         (si)=>({
             item:si,
             amounts : summarizeAmount(byShopItem[si],si),
             items : byShopItem[si]
         })
     );
     uniqueItems.forEach(
         (i)=>{
             if (i.items.find((ii)=>ii.ingredient.shopIgnore)) {
                 i.ignore = true
             }
         }
     );

 }
 
 export let showSubItems=true
 let showAdd=false

 let shoppingItems = []
 let ignoredItems = []
 $: shoppingItems = uniqueItems.filter((i)=>!i.ignore);
 $: ignoredItems = uniqueItems.filter((i)=>i.ignore);
 

</script>

<table>
    {#each shoppingItems as item (item.item)}
        <tbody animate:flip in:receive="{{key:item.item}}" out:send="{{key:item.item}}">
            <ShoppingListItem {showSubItems} {item}/>
        </tbody>
    {:else}
        Nothing in your shopping list buddy!
    {/each}
</table>

{#if ignoredItems.length > 0}
    <table class="ignore">
        <tr class="ignoreHeader"><td colspan="3">Ignored Items</td></tr>
        <tr class="ignoreDesc">
            <td colspan="3">
                You removed these from the list -- maybe you already have them? Maybe you don't actually use them.
            </td>
        </tr>
        {#each ignoredItems as item (item.item)}
            <tbody class="ignore" animate:flip in:receive="{{key:item.item}}" out:send="{{key:item.item}}">
                <ShoppingListItem ignored={true} {showSubItems} {item}/>
            </tbody>
        {/each}
    </table>
{/if}

Items:<JsonDebug data="{uniqueItems}"/>
Unique Items:<JsonDebug data="{uniqueItems}"/>

<style>
 table {
     max-width: 35em;
     margin: auto;
 }

 .ignoreHeader {
     font-size: var(--large);
     margin-top: 2em;
 }
 .ignoreDesc {
     color: var(--grey);
     font-size: var(--small);
 }
 .ignore {
     color : var(--grey);
 }

</style>
