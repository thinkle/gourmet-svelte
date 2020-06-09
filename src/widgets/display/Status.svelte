<script>
 import {registerBuild} from '../../stores/debug.js'; registerBuild(Number("BUILD_MS"));
 import status,{states} from '../../stores/status.js';
 import Progress from './Progress.svelte';
 import { fly } from 'svelte/transition';
 import {IconButton} from '../';
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
 
</script>
<div>
    
    {#each items as item}
        <span transition:fly>
            <div>{item.name}: {@html item.formatter && item.formatter(item) || format(item)}</div>
            <div><Progress width="90%" amount={item.amount} total={item.total}/></div>
            {#if item.status==states.COMPLETE}
                <IconButton
                    bare="{true}"
                    small="{true}"
                    on:click="{()=>status.removeStatus(item.id)}"
                    icon="close"
                    />
            {/if}
        </span>
    {/each}
    
</div>
<style>
 div {
     background-color: #ff77;
     display: flex;
     min-width: 10em;
 }
 span {
     display : inline-block;
     padding: 5px;
     border : 1px solid #333;
     position: relative;
     padding:22px;
     width: 12em;
 }
 span button {
     position: absolute;
     top:2px;
     right:2px;
     
 }
</style>

