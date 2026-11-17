<script>
 import RecipePicker from './RecipePicker.svelte';
 import RecipePickerLauncher from './RecipePickerLauncher.svelte';
 import { crossfade, scale } from 'svelte/transition';

 let show = false;
 let selected
 let ref

</script>
<p>
    Here is a paragraph to move the button
<button
    on:click="{()=>show=!show}"
    ref={this}
>
    Toggle Picker
</button>
</p>
<p>Here is the other one with my magicp icker doodad...
    <RecipePickerLauncher
        onSelected="{(v)=>selected=v}"
    ><button>Click here I dare you!</button></RecipePickerLauncher>
</p>
{#if show}
    <RecipePicker key=1 onSelected="{(v)=>selected=v}" onClose="{()=>show=false}"/>
{/if}
<br>Selected: {selected}

