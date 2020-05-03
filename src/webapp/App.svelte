<script>
 import router from 'page';
 import Recipe from './recDisplay/Recipe.svelte';
 import Demo from './Demo.svelte';
 import {testRecs} from '../common/mocks/recipes.js'


 let name = 'Gourmet';
 let page;
 let params;
 router('/',()=>{page = Recipe; params={rec:testRecs.standard}});
 router('/demo',()=>page = Demo);
 router.start();
 $: {
     console.log('params:',params);
 }
</script>

<div>

<svelte:component this={page} {...params}/>
</div>
<style>
 .app {
     margin: auto;
     max-width: 1200px;
 }
 :root {
     --grey : #727272;
     --black : #efefef;
     --white : #121212;
     --font : Futura, sans-serif;
 }
 </style>
