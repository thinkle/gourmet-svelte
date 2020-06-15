<script>
 export let condition;
 let shouldRender = false;
 
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
