<script>
 export let menuProps={
     anchorRight : true
 }

 import Menu from './Menu.svelte';
 
</script>


<div class="mobile">
    <Menu {...menuProps}>
        <slot/>
    </Menu>
</div>
<div class="desktop">
    <slot/>
</div>

<style>

 .desktop :global(li) {
     list-style :none;
 }
 
 @media (max-width: 768px) {
     .desktop {
         display: none;
     }
     .mobile {
         display: contents;
     }
     .mobile :global(button) {
         display: flex;
         flex-direction: row;
         -webkit-appearance: none;
         background: none;
         border: none;
         height: 100%;
         width: 100%;
         margin: 0;
     }
 }

 @media (min-width: 769px) {
     .desktop {
         display: contents;
     }
     .mobile {
         display: none;
     }
 }

 
 
</style>


