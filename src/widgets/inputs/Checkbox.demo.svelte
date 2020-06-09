<script>
 import Checkbox from './Checkbox.svelte';
 
 let v1 = true
 let v2 = false
 let v3
 let sizes = [12,16,24,48,64,96,128,256]
</script>
<div>
    A couple of bound checkboxes:
    <Checkbox bind:checked="{v1}"/> One <Checkbox bind:checked="{v1}"/> Two
</div>
<div>
    A couple of unbound checkboxes:
    <Checkbox checked="{v2}"/> One <Checkbox checked="{v2}"/> Two
</div>
<div>
    On more with events... (console.log on event)
    <br><Checkbox on:change="{(e)=>console.log(e)}" checked="{v3}"/> Three
    <br><Checkbox on:change="{(e)=>console.log(e)}" checked="{v2}"/> Two
    <br><Checkbox on:change="{(e)=>console.log(e)}" checked="{v1}"/> One
</div>

<div>
    And some different sizes:
    {#each sizes as size}
        <br><Checkbox {size} bind:checked="{v1}"/> {size}
    {/each}
</div>
