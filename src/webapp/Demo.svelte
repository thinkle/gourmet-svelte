<script>
 import {registerBuild} from '../stores/debug.js'; registerBuild(Number("BUILD_MS"));
 import demos from './demos.js';
 export let demo

 $: {
     console.log('Demo is',demo);
     console.log('Demos are',demos);
 }
</script>
<div>
    {#if demo}
        {#if !demos[demo]}
            Oops - no demo named {demo}. Maybe you meant...
            {#each Object.keys(demos) as name}
                <li><a href={`/demo/${name}`}>{name}</a></li>
            {/each}
        {:else}
            <svelte:component this="{demos[demo]}" initialShow={true} />
        {/if}
    {:else}
        {#each Object.keys(demos) as name}
            <h2>{name} <a href={`/demo/${name}`}>standalone</a></h2> 
            <svelte:component this={demos[name]} initialShow={false} />
        {/each}
    {/if}
</div>
<style>
 div {
     overflow-y: scroll;
     height: 100vh;
     width: 100vw;
     overflow-x: scroll;
 }
</style>
