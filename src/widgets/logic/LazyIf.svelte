<script>
 export let condition;
 let shouldRender = false;
 
 $: shouldRender = shouldRender || condition;
 $: console.log('condition', condition);
 $: console.log('shouldRender', shouldRender);
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
