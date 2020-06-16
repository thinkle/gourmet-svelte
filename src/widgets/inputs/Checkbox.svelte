<script>
 export let checked=undefined
 export let size=24
 import { draw,fade } from 'svelte/transition';
 export let color="var(--light-fg)"
</script>

<label>
    <input type="checkbox" bind:checked="{checked}" on:checked on:change on:input/>
    <svg  xmlns="http://www.w3.org/2000/svg" height="{size}" viewBox="0 0 24 24" width="{size}"
          style="">
        {#if checked}
            <path in:draw={{duration:1000}} out:fade="{{duration:400}}" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                  style="{`stroke:${color};fill:${color};`}"
            />
        {:else}
            <path in:draw="{{duration:1000}}" out:fade="{{duration:400}}" d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"
                  style="{`stroke:${color};fill:${color};`}"
            />
        {/if}
    </svg>
</label>
<style>
 label {
     display: inline-flex;
 }
 input {
     display: none;
 }
 svg {
     vertical-align: middle;
     /*
     position:relative;
     bottom:${-1 * size/3}px;
     */
 }
</style>
