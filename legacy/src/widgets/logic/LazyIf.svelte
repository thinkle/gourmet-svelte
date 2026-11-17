<script>
 export let condition;
 export let shouldRender = true;
 
 $: shouldRender = shouldRender || condition;
</script>

{#if shouldRender}
    <div class="wrapper" class:active={condition}>
	<slot />
    </div>
{/if}

<style>
 .wrapper {
     display: none;
 }
 .wrapper.active {
     display: contents;
 }
</style>
