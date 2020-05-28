<script>
 import router from 'page';
 import Landing from './Landing.svelte';
 import Admin from './Admin.svelte';
 import Recipe from './recDisplay/Recipe.svelte';
 import RecipeList from './recDisplay/RecipeList.svelte';
 import SingleRecipe from './recDisplay/SingleRecipe.svelte';
 import Demo from './Demo.svelte';
 import Sidebar from '../extension/web/Sidebar.svelte';
 import {testRecs} from '../common/mocks/recipes.js'


 let name = 'Gourmet BUILD_TIME';
 let page;
 let params = {};
 router('/',()=>{page = RecipeList; params={}});
 router('/admin',()=>{page = Admin; params={}});
 router('/rec/:id',(ctx)=>{
     page = SingleRecipe
     params = {
         id:Number(ctx.params.id)
     };
 });
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
    <p>{name}</p>
    <Landing>
        <svelte:component this={page} {...params}/>
    </Landing>
</div>
<style>
 p {
     font-size : var(--small);
     font-family: var(--brandFont);
 }
 .app {
     margin: auto;
     max-width: 1200px;
 }

 :root {
     /* Colors */
     --grey : #727272;
     --black : #efefef;
     --white : #121212;
     --light-bg : #fbf6ff;
     --light-fg : #111122;
     --medium-bg: #dadaff;
     --medium-fg: #343434;
     --focus-border: #2222df;
     --light-underline : #aaa;
     --medium-underline : #666;
     --heavy-underline : #aaa;
     --note-bg : #ffffad;
     --note-fg : #333333;
     --note-light-bg : #ffffdd;
     --note-light-fg: #333;
     /* Typography */
     --recipeFont : Lora, Ubuntu, Cantarell, serif;
     --recipeHeadFont : Lora,'Noto Sans',Ubuntu,Cantarell,-apple-system,sans-serif;
     --brandFont : 'Gimlet Sans Web','Noto Sans',Ubuntu,Cantarell,-apple-system,sans-serif;
     --uiFont : 'Noto Sans', Ubuntu, Cantarell, -apple-system, sans-serif;
     --small : 0.8rem;
     --xsmall : 0.6rem;
 }

 
</style>
