<script>
 export let onClose=undefined;
 export let closeOnClickOutside=true;
 export let width=undefined;
 export let maxWidth=undefined;
 export let insertInBody=true;
 export let showClose=true;
 export let key
 import {fade} from 'svelte/transition';
 import {IconButton} from '../';
 import {getCrossfade} from '../transitions/modalTransition.js'
 let [send,receive] = getCrossfade(key);

 function stopEvents (event) {
     event.stopPropagation();
 }
 
 function maybeClose (event) {
     if (closeOnClickOutside) {
         onClose && onClose();
     }
     event.stopPropagation();
 }

 function moveToBody (node) {
     if (insertInBody) {
         document.body.appendChild(node);
     }
 }

</script>

<section
    use:moveToBody
    class='screen' in:fade="{{duration:500}}" out:fade="{{duration:500}}"
    on:scroll="{stopEvents}"
    on:click="{maybeClose}"
    style="{`
           --max-width:${maxWidth};
           --width:${width};
           `}"
    

>
    <div class='dialog'
	 in:receive={{key:1}} out:send={{key:1}}
         on:click="{stopEvents}"
    >
        {#if showClose}
            <span class="close">
	        <IconButton bare="true" icon="close" on:click="{onClose}"/>
	    </span>
        {/if}
        <slot/>
        
    </div>    
</section>

<style>
 section {
     position: fixed;
     top : 0;
     left : 0;
     width: 100%;
     height: 100%;
     background-color: #00000077;
     display: flex;
     align-items: center;
     justify-content: center;
 }

 .dialog {
     height: 80vh;
     width: var(--width);
     max-width: var(--max-width);
     margin: auto;
     background-color: var(--white);
     color: var(--black);
     padding: 16px;
     box-shadow: 4px 4px #777;
     overflow-y: scroll;
     z-index: 3;

 }

 .close {
     float: right;
     position: sticky;
     top: 0;
     z-index: 3;
 }
 
</style>
