<script>
 let b;
 export let inverse=false;
 export let icon
 export let bare=false
 export let iconSize=undefined;
 export let fontSize=undefined;
 export function focus () {
     b.focus()
 }
</script>

<button
    style={`--fontSize:${fontSize};--iconSize:${iconSize}`}
     class:customSize={fontSize}
    class:bare class:inverse class="icon" on:click bind:this={b}>
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
 
 button.bare {
     border: none;
     background-color: transparent;
 }

 button.icon:hover {
     background-color: #7474f4;
     color: white;
 }
 button.icon:focus {
     border: 1px solid #7474f4;
 }


</style>
