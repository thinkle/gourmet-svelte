<script>
 export let hidden = false;
 export let auto = false;
 export let content
 export let filename
 export let type='text/plain'
 export let icon="save"
 import IconButton from './IconButton.svelte';
 import {onMount} from 'svelte';

 

 let link
 $: {
     if (link) {
         URL.revokeObjectURL(link);
     }
     if (content) {
         link = URL.createObjectURL(new Blob([content],{type:type}));
     } else {
         link = ""
     }
 }
 
 onMount(
     // we really just want an on destory, which is the return value of onMount
     ()=>()=>link && URL.revokeObjectURL(link)
 );

 function download (node) {
     if (auto) {
         node.click()
     }
 }

</script>

{#if !hidden}
    <IconButton {icon}>
        <a use:download={{auto}} href="{link}" download="{filename}" ><slot/></a>
    </IconButton>
{:else}
    <span>
        <a use:download={{auto}} href="{link}" download="{filename}" ><slot/></a>
    </span>
{/if}
<style>
 span {
     display: none;
 }
 a {
     text-decoration: none;
     color: inherit;
 }
</style>
