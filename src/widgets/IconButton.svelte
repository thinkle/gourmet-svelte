<script>
 let b;
 export let inverse=false;
 export let icon
 export let bare
 export function focus () {
     b.focus()
 }
</script>

<button class:bare class:inverse class="icon" on:click bind:this={b}>
    <slot>
    </slot>
    <i  class="material-icons">
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
 }
 button.icon {
     border-radius: 10px;
     transition: all 0.8s;
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
