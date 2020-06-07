<script>
 import {registerBuild} from '../../stores/debug.js'; registerBuild(Number("BUILD_MS"));
 import IconButton from '../../widgets/IconButton.svelte';
 import RecipePicker from './RecipePicker.svelte';
 import ModalLauncher from '../../widgets/ModalLauncher.svelte';

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
<div on:click="{()=>{
               console.log("They clicked the div");
               show=true}}">
    <ModalLauncher modalVisible="{show}"  >
        <slot>
            <IconButton {...icon}>
                Select Recipe
            </IconButton>
        </slot>
    </ModalLauncher>
</div>
{#if show}
    <RecipePicker
        onSelected="{onSelectedInternal}"
        onClose="{onCloseInternal}"/>
{/if}

