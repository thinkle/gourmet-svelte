<script>
 import {registerBuild} from '../../stores/debug.js'; registerBuild(Number("BUILD_MS"));
 import IconButton from '../../widgets/IconButton.svelte';
 import RecipePicker from './RecipePicker.svelte';
 import { send,receive } from './pickerTransition.js';

 export let icon;
 export let show;
 export let message = 'Pick recipe to include as ingredient'
 export let onSelected;
 export let onClose = undefined;
 


 function onSelectedInternal (id) {
     show = false;
     if (onSelected) onSelected(id)
 }
 function onCloseInternal () {
     show = false;
     if (onClose) onClose();
 }
 

</script>

<div on:click="{()=>show=true}">
    <slot>
        <IconButton {...icon}>
            Select Recipe
        </IconButton>
    </slot>    
    {#if !show}<span
        in:receive out:send
    >   
    </span>{/if}
</div>
{#if show}
    <RecipePicker
        onSelected="{onSelectedInternal}"
        onClose="{onCloseInternal}"/>
{/if}

