<script>
 import ComboInput from './ComboInput.svelte';
 import IB from './IconButton.svelte';
 import { tick } from 'svelte';
 import { fly } from 'svelte/transition';
 import { flip } from 'svelte/animate';

 import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();

 
 export let value;
 export let options=[]
 let nextValue = '';

 function remove (v) {
     value.splice(value.indexOf(v),1)
     value = value;
     dispatch('change',value)
 }

 function addValue () {
     console.log('Add value!',nextValue);
     if (nextValue) {
         value = [...value, {name:nextValue}];
         console.log('did it?');
     }
     nextValue = ''
     dispatch('change',value)
 }

</script>
<span>
    <span><ComboInput onSelect="{addValue}" options={options.filter((o)=>value.map((v)=>v.name).indexOf(o)==-1)} bind:value={nextValue}/> <IB on:click={addValue} bare={true} icon="add"></IB></span>
    <span>
        {#each value as v}
            <span class="tag">{v.name}
                <IB on:click={()=>remove(v)} bare={true} icon="close"></IB>
            </span>
        {/each}
    </span>
</span>
<style>
 span {display: flex; flex-direction: column;}
 span > span {display: flex; flex-direction: row}

 .tag .material-icons {
     font-size: 1rem;
 }
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
 
 .current {
     background-color: yellow;
     font-weight: bold;
 }
</style>
