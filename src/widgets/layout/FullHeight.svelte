<script>
 export let scrolls;
</script>
<!-- Flex container may or may not scroll -->
<section class:scrolls>
    <slot/>
</section>

<style>
 section > :global(div) {
     flex-grow: 1;
     display: flex;
     flex-direction: column;
 }
 section {
     flex-grow: 1;
     display: flex;
     flex-direction: column;
 }

 .scrolls {
     overflow-y: scroll;
 }
</style>
