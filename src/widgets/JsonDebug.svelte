<script>
 export let data
 let show=false;
 $: if (show==true) {console.log(data)}
</script>
<div>
    <button on:click="{()=>show=!show}">
        {#if show}Hide{:else}Show{/if} data
    </button>
    {#if show}
        <div>
            <h2>It's also in the console :)</h2>
            {JSON.stringify(data)}
        </div>
    {/if}
</div>

<style>
    div { border : 1px solid grey; padding : 2px; max-height: 200px; overflow-y: scroll}
</style>
