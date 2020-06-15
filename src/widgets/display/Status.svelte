<script>
 import {registerBuild} from '../../stores/debugStore.js'; registerBuild(Number("BUILD_MS"));
 import status,{states} from '../../stores/statusStore.js';
 import Progress from './Progress.svelte';
 import { fly } from 'svelte/transition';
 import {IconButton,Toaster} from '../';
 export let type;

 let items = []
 status.subscribe(
     (status)=>{
         console.log('Got data',status);
         items = []
         for (let s of Object.values(status)) {
             if (type && s.type==type || !type) {
                 items.push(s);
             }
         }
         items = items;
     }
 );

 function format (item) {
     // default formatter
     if (item.amount && item.total) {
         return `${item.status}
         ${(item.amount*100/item.total)}% complete
         ${item.amount} of ${item.total}
         `
     }
     else {
         return `${item.status}`
     }
 }

 let toaster
 $: items.length > 0 && toaster && toaster.popUp();
 $: items.length == 0 && toaster && toaster.close();

</script>
{#if items.length > 0}
    <IconButton icon="info" on:click="{toaster.popUp}">{items.length}</IconButton>
{/if}
<Toaster bind:this="{toaster}" delay="{8000}">    
    {#each items as item}
        <div class="item">
            <div class="title">{item.name}: {@html item.formatter && item.formatter(item) || format(item)}</div>
            <div class="prog"><Progress width="90%" amount={item.amount} total={item.total}/></div>
            <div class="button" >
                {#if item.status==states.COMPLETE}
                    <IconButton
                        bare="{true}"
                        small="{true}"
                        on:click="{()=>status.removeStatus(item.id)}"
                        icon="done"
                    />
                {/if}
            </div>
        </div>
    {/each}
    
</Toaster>
<style>
 .item {
     display: grid;
     grid-template-areas :
         "title button"
         "prog button";
     grid-template-columns: 1fr 24px;
 }
 .button {
     grid-area: button;
 }
 .title {
     grid-area: title;
 }
 .prog {
     grid-area: prog;
 }
 div {
     display: flex;
     min-width: 10em;
 }
</style>

