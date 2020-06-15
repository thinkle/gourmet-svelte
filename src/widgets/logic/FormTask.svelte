<script>
 export let name='Do task'
 export let buttonName=''
 export let icon="save_alt"
 export let promiseAction=undefined
 export let onStart=undefined
 export let onComplete=undefined
 export let onError=undefined
 export let boxy=true;
 export let inline=false
 export let isReady
 
 import {IconButton,
        StatusIcon} from '../'

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

<div class="container" class:boxy class:inline>
    <span class="head">{name}</span>
    <div class="form">
        <slot/>
    </div>
    <span class="submit" >
        <IconButton
            {icon}
            active="{isReady && !promise}"
            on:click="{submit}"
            busy="{promise}"
        >
            {buttonName}
        </IconButton>
        {#if promise}
            {#await promise}
                <StatusIcon icon="busy" tooltip="Working on it..."/>
            {:then data}
                <StatusIcon icon="done" tooltip="All set!"/>
            {:catch err}
                <StatusIcon icon="error" tooltip="Bummer, something wen wrong!"/>
            {/await}
        {/if}
    </span>
        
</div>

<style>
 .form {
     display: grid;
     grid-template-columns: 8rem auto;
     font-family: var(--uiFont);
     grid-area: form;
     align-items: center;     
 }

 .form :global(button) {
     margin: auto;
 }

 .inline {
     display: inline-flex;
 }
 .boxy {
     border: 1px solid var(--light-underline);
     padding: 1rem;
     display: grid;
     grid-template-areas:
         "title title"
         "form  button"
         ;
     grid-template-columns: 1fr auto;
 }

 .boxy .head {
     font-size: 1rem;
     font-weight: bold;
     grid-area: title;
 }
 .submit {
     margin-left: 5px;
     align-self: flex-end;
     justify-self: flex-end;
     grid-area: button;
 }
</style>
