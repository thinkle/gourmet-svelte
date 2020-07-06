<script>
 export let items

 import {flip} from 'svelte/animate';
 import {JsonDebug,
        Button,
        IconButton} from '../widgets/';

 import ShoppingListItem from './ShoppingListItem.svelte';
 
 import {getShopItem} from '../utils/ingredientUtils.js';
 import {addAmounts} from '../utils/unitAmounts.js';

 let byShopItem = {}
 let uniqueItems = []

 import {crossfade} from 'svelte/transition';
 import {onMount} from 'svelte'

 let [send,receive] = crossfade({duration:300});

 $: items && organizeItems();


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
 
 
 let animating
 

 onMount(
     ()=>{
         let t = setTimeout(()=>animating=true,2500);
         return ()=>{
             clearTimeout(t)
         }
     }
 );
 
 function maybeFlip (node, { from, to }, params) {
     if (animating) {return flip(node,{from,to},params)}
     else {
         return {
	     delay: 0,
	     duration: 0,
	     css: (t, u) => ''
         };
     }
 }

</script>

<table>
    {#each shoppingItems as item (item.item)}
        <tbody
            animate:maybeFlip="{{duration:300}}"
            in:receive|local="{{key:item.item}}"
            out:send|local="{{key:item.item}}">
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
