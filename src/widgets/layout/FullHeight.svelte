<script>
 export let scrolls=false;
</script>
<!-- Flex container may or may not scroll -->
<section class:scrolls>
    <slot/>
</section>

<style>
 section > :global(.slot) {
     display: contents;
 }
 section {
     flex-grow: 1;
     flex-shrink: 1;
     display: flex;
     flex-direction: column;
     overflow-y: hidden;
 }

 .scrolls {
     overflow-y: scroll;
 }
 
</style>
