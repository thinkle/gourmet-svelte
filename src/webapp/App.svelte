<script>
 import router from 'page';
 import Recipe from './recDisplay/Recipe.svelte';
 import Demo from './Demo.svelte';
 let name = 'Gourmet';
 let page;
 let params;
 router('/',()=> page = Recipe);
 router('/demo',()=>page = Demo);
 router.start();
</script>

<div>
Testing router
<svelte:component this={page} params={params}/>
</div>
<style>
 .app {
     margin: auto;
     max-width: 1200px;
 }
 :root {
     --grey : #727272;
     --black : #efefef;
     --font : Futura, sans-serif;
 }
 :global(body) {
     background-color: #232323;
 }
 :global(*) {
     color: var(--black);
     font-family: var(--font);
 }
</style>
