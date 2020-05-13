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
</style>
