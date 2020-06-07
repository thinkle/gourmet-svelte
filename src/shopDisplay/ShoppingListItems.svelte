<script>
 export let items
 
 import {flip} from 'svelte/animate';
 import JsonDebug from '../widgets/JsonDebug.svelte';
 import Button from '../widgets/Button.svelte';
 import ShoppingListItem from './ShoppingListItem.svelte';

 
 import {extractItems} from '../utils/ingredientUtils.js';
 import {titleCase} from '../utils/textUtils.js';
 import {addAmounts} from '../utils/unitAmounts.js';

 let byShopItem = {}
 let uniqueItems = []

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
 }
 
 let showItems=true

</script>
<Button toggle="true" toggled="{showItems}" on:click="{()=>showItems=!showItems}">Show details</Button>
<table>
    {#each uniqueItems as item (item.item)}
        <tbody animate:flip>
            <ShoppingListItem {showItems} {item}/>
        </tbody>
    {:else}
        Nothing in your shopping list buddy!
    {/each}
</table>
Items:<JsonDebug data="{uniqueItems}"/>
Unique Items:<JsonDebug data="{uniqueItems}"/>

<style>
 table {
     max-width: 35em;
     margin: auto;
 }
</style>
