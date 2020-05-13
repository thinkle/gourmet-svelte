<script>
 let b;
 export let inverse=false;
 export function focus () {
     b.focus()
 }
</script>

<button class:inverse class="icon" on:click bind:this={b}>
    <i  class="material-icons">
        <slot>
        </slot>
    </i>
</button>
<style>
 .inverse {
     background-color: #232323;
     color: white;
 }
 button.icon {
     border: none;
     background-color: transparent;
     border-radius: 10px;
     transition: all 0.8s;
 }
 button.icon:hover {
     background-color: #7474f4;
     color: white;
 }
 button.icon:focus {
     border: 1px solid #7474f4;
 }


</style>
