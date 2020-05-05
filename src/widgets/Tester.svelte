<script>
 export let initialShow = false;
 export let name
 export let options=[];
 export let initialOption=0;
 var hidden
 $: hidden = !initialShow


 var option = initialOption||options&&options[0];
</script>
<div class="test">
    <div class="label">
        <span on:click={()=>hidden=!hidden}>{name}
        {#if hidden}(show)
        {:else}(hide)
        {/if}
        </span>
        <div class="options">{#if options && !hidden}
            {#each options as o,i}
            <span class:selected="{o==option}" on:click="{()=>option=o}">{o}</span>
            {#if i < (options.length - 1)}| {/if}
            {/each}
        {/if}
        </div>
    </div>
    <div class:hidden={hidden}>
        <slot option={option}></slot>
    </div>
</div>
<style>
 
 .test {
     border: 2px dotted red;
 }
 div.hidden {display: none}
 div.show {display:block}
 .selected  {text-decoration: underline}
 .label {display: flex}
 .options { margin-left: auto }
</style>
