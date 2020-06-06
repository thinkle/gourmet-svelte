<script>
 import {registerBuild} from '../stores/debug.js'; registerBuild(Number("BUILD_MS"));
 import ComboInput from './ComboInput.svelte';
 import IB from './IconButton.svelte';
 import { flip } from 'svelte/animate';
 import { quintOut } from 'svelte/easing';
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
    <span>
        <ComboInput
            onSelect="{addValue}"
            options="{
                      options
                      .filter(
                         (o)=> value.map( 
                                 (v)=>v.name
                                 ).indexOf(o.name)==-1
                      )
                      .map(o=>o.name)
                      }"
            bind:value={nextValue}
        />
        <IB
            icon="add"
            bare="{true}"
            on:click="{addValue}"
        />
    </span>
    <span class="tag-container">
        {#each value as v (v.name)}
            <span
                class="tag"
                animate:flip="{{delay: 100, duration: 250, easing: quintOut}}"
            >
                {v.name}
                {#if !v.name}
                    {@debug v}
                {/if}
                <span class="close">
                    <IB icon="close"
                        small="{true}"
                        bare="{true}"
                        on:click="{()=>remove(v)}"
                    />
                </span>
            </span>
        {/each}
    </span>
</span>
<style>
 .tag-container {
     display: flex;
     flex-direction: row;
     flex-wrap: wrap;
 }
 span > span {
     display: flex;
     flex-direction: row
 }

 .tag .material-icons {
     font-size: 1rem;
 }
 .tag {
     display: inline-flex;
     padding: 4px;
     margin: 2px;
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
 .close {
     align-self: flex-start; /* top */
     margin-left: auto; /* right */
 }
</style>
