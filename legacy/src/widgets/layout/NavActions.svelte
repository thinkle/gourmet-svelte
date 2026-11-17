<script>
 export let menuProps={
     anchorRight : true
 }
 export let forceHide;
 import Menu from './Menu.svelte';
 $: console.log(menuProps);
</script>


<div class="mobile">
    <Menu {...menuProps} {forceHide}>
        <slot/>
    </Menu>
</div>
<div class="desktop">
    <slot/>
</div>

<style>

 .desktop :global(li) {
     list-style :none;
     margin-right: 3px;
     margin-left: 3px;
     display: flex;
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

 @media print {
     div {
        display: none !important;
     }
 }

 
 
</style>


