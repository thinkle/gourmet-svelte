<script>
 import router from 'page';
 import Landing from './Landing.svelte';
 import Recipe from './recDisplay/Recipe.svelte';
 import RecipeList from './recDisplay/RecipeList.svelte';
 import Demo from './Demo.svelte';
 import Sidebar from '../extension/web/Sidebar.svelte';
 import {testRecs} from '../common/mocks/recipes.js'


 let name = 'Gourmet';
 let page;
 let params = {};
 router('/',()=>{page = Landing; params={}});
 router('/sidebar',()=>{page = Sidebar; params={}});
 router('/rl',()=>{page = RecipeList; params={}});
 router('/oneRec',()=>{page = Recipe; params={rec:testRecs.standard}});
 router('/demo/',(ctx)=>{
     console.log('Demo...',ctx);
     page = Demo
     params = {}
              });

     router('/demo/:demo',(ctx)=>{
         console.log('Demo...',ctx);
         page = Demo
         params = ctx.params
     });

     router.start();
     $: {
         console.log('params:',params);
         console.log('page:',page);
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
