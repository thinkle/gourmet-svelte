<script>
 import {registerBuild} from '../stores/debug.js'; registerBuild(BUILD_MS,'Ing',);
 let b;
 export let invisible=false; // useful if we want to take up the normal space in our layout whether active or not
 export let inverse=false;
 export let icon
 export let bare=false
 export let toggle=false
 export let toggled=false
 export let iconSize=undefined;
 export let fontSize=undefined;
 export let small=undefined;
 export function focus () {
     b.focus()
 }
</script>

<button
    class:bare
    class:inverse
    class:invisible
    class:toggle
    class:toggled
    class:small
    class="icon" 
    style={`--fontSize:${fontSize};--iconSize:${iconSize}`}
           class:customSize={fontSize}
    
    on:click bind:this={b}>
    <slot>
    </slot>
    <i class:customSize={iconSize}  class="material-icons">
        {icon}
    </i>
</button>
<style>
 .inverse {
     background-color: #232323;
     color: white;
 }
 button {
     font-family : var(--uiFont);
     display: inline-flex;
     justify-content: center;
     align-content: center;
     border-radius: 10px;
     transition: all 300ms;
 }
 
 button.customSize {
     font-size: var(--fontSize);
 }
 
 i.customSize {
     font-size: var(--iconSize) 
 }
 button.small i {
     font-size: var(--small);
 }
 
 button.bare {
     border: none;
     background-color: transparent;
 }

 button.icon:hover {
     background-color: var(--light-bg);
     color: var(--light-fg);
 }
 button.icon:focus {
     border: 1px solid #7474f4;
 }
 button.toggle {
     transition: all 0.8s;
 }

 button.toggled {
     background-color: var(--medium-bg);
     color: var(--medium-fg);
     font-weight: 500;
 }
 button.active-toggle {
     background-color: #747474;
     color: white;
 }
 .invisible {
     visibility: hidden;
 }

</style>
