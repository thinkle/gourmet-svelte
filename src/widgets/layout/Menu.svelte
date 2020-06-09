<script>
 import { fly,slide,fade } from 'svelte/transition';
 import {IconButton} from '../';
 export let text=''
 export let width=200;
 export let icon='menu'
 export let anchorRight=false
 export let anchorLeft=true
 export let anchorTop=true
 export let anchorBottom=false
 export function showMenu () {
     show = true;
 }
 export function hideMenu () {
     show = false
 }
 let show
 if (anchorBottom) {anchorTop = false}
 if (anchorRight) {anchorLeft = false}

 let ref;

 export function onFocusOut () {
     setTimeout(()=>{
         if (!ref.contains(document.activeElement)) {
             show = false;
         } else {
             console.log('The focus is coming from INSIDE THE HOUSE');
         }
     },100)
 }

</script>
<span  bind:this="{ref}" on:focusout={onFocusOut}>
    <IconButton
        icon="{icon}"
        bare="{true}"
        on:click="{()=>show=!show}"
        on:focus="{()=>console.log('focus')}"
    >
        {text}
    </IconButton>
    {#if show}
        <div class:anchorRight
             class:anchorLeft
             class:anchorTop
             class:anchorBottom
             in:slide out:slide
             style="{`width:${width}px`}"
        >
            <slot/>
        </div>
    {/if}
</span>

<style>
 span {
     position: relative;
 }
 span div {
     position: absolute;
     z-index: 2;
     background-color: var(--light-bg);
     color: var(--light-fg);
     /*      border: 1px solid var(--light-underline); */
 }

 span div :global(li) {
     list-style: none;
     padding: 4px;
     border-top: 1px solid var(--light-underline);
 }
 
 .anchorLeft {
     left : 16px;
 }
 .anchorRight {
     right : 16px;
 }
 .anchorTop {
     top : 16px;
 }
 .anchorBottom {
     bottom: 16px;
 }
</style>
