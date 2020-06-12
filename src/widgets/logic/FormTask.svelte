<script>
 export let name='Do task'
 export let buttonName='Submit'
 export let icon
 export let promiseAction=undefined
 export let onStart=undefined
 export let onComplete=undefined
 export let onError=undefined
 export let isReady
 
 import {IconButton} from '../'
 let promise

 export async function submit () {
     console.log('FormTask.submit!');
     if (onStart) onStart()
     promise = promiseAction();
     try { 
         let result = await promise;
         if (onComplete) onComplete(result);
     } catch (err) {
         if (onError) onError(err)
         else {
             console.log('FormTask got error but has no handler :(')
             console.log('FormTask props: ',$$props);
             console.log(err);
         }
     }
 }
 
</script>

<div>
    <h3>{name}</h3>
    <div class="form"><slot/></div>
    {#await promise}
        Working on it...
    {:then data}
        Got it!
    {:catch err}
        Dangnabbits!
    {/await}
    <IconButton
        {icon}
        active="{isReady && !promise}"
        on:click="{submit}"
        busy="{promise}"
    >
        {buttonName}
    </IconButton>
        
</div>

<style>
 .form {
     display: grid;
     grid-template-columns: auto auto;
 }
</style>
