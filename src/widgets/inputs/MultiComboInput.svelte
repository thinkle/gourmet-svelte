<script>
 import ComboInput from './ComboInput.svelte';

 import { tick } from 'svelte';
 import { fly } from 'svelte/transition';
 import { flip } from 'svelte/animate';
 
 export let value;
 export let options=[]
 let nextValue = '';

 function remove (v) {
     value.splice(value.indexOf(v),1)
     value = value;
 }

 function addValue () {
     console.log('Add value!',nextValue);
     if (nextValue && value.indexOf(nextValue)==-1) {
         value = [...value, nextValue];
         value.sort()
         value = value
         console.log('did it?');
         nextValue = ''
     }
 }

</script>
<span>
    <span><ComboInput onSelect="{addValue}" options={options.filter((o)=>value.indexOf(o)==-1)} bind:value={nextValue}/> <button class="icon" on:click={addValue}><i  class='material-icons'>add</i></button></span>
    <span>
        {#each value as v (v)}
            <span animate:flip class="tag">{v}
                <button class="icon" on:click={()=>remove(v)}><i class='material-icons'>close</i></button>
            </span>
        {/each}
    </span>
</span>
<style>
 span {display: flex; flex-direction: column;}
 span > span {display: flex; flex-direction: row}
 .tag {
     display: inline-flex;
     padding: 4px;
     border-radius: 5px;
     background-color: #c7c7d7;
     color: #333;
     font-weight: bold;
     font-size: 0.8rem;
     align-items: center;
     margin-right: 5px;
 }
 .tag .material-icons {
     font-size: 1rem;
 }
 
 .current {
     background-color: yellow;
     font-weight: bold;
 }
</style>
