<script>
 import {stamp} from '../stores/debug.js'
 import {registerBuild} from '../stores/debug.js'; registerBuild(BUILD_MS,'App',);
 import router from 'page';
 import Landing from './Landing.svelte';
 import Admin from './Admin.svelte';
 import Recipe from './recDisplay/Recipe.svelte';
 import MainView from './MainView.svelte';
 import SingleRecipe from './recDisplay/SingleRecipe.svelte';
 import Demo from './Demo.svelte';
 import Sidebar from '../extension/web/Sidebar.svelte';
 import {testRecs} from '../common/mocks/recipes.js'


 let name = 'Gourmet';
 let page;
 let params = {};
 let keyboardUser;
 router('/',()=>{page = MainView; params={}});
 router('/admin',()=>{page = Admin; params={}});
 router('/rec/:id',(ctx)=>{
     page = SingleRecipe
     params = {
         id:ctx.params.id
     };
 });
 router('/sidebar',()=>{page = Sidebar; params={}});
 router('/rl',()=>{page = RecipeList; params={}});
 router('/oneRec',()=>{page = Recipe; params={rec:testRecs.standard}});
 router('/demo/',(ctx)=>{
     page = Demo
     params = {
     }
 });

 router('/demo/:demo',(ctx)=>{
     page = Demo
     params = ctx.params
 });
 
 router.start();
 $: {
 }
 
 function detectKeyboardUser (event) {
     if (event.keyCode==9) {
         keyboardUser = true;
     }
 }
 function detectMouseUser () {
     keyboardUser = false;
 }
 
</script>

<div class:keyboardUser>
    <Landing>
        <!-- <span slot="rightnav">
             {#if page!==MainView}<a href="/">Recipe List</a>{/if}
             </span> -->
        <svelte:component this={page} {...params}/>
    </Landing>
    <div style="position: fixed; z-index: 99; bottom: 0; right: 0; font-size: 8pt;">{$stamp}</div>
</div>
<svelte:window on:keyup={detectKeyboardUser} on:mousedown={detectMouseUser}/>

<style>
 @import url('//fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap');
 @import url('//fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap');

 p {
     font-size : var(--small);
     font-family: var(--brandFont);
 }
 .app {
     margin: auto;
     max-width: 1200px;
 }

 :global(body) {
     overflow-y: hidden; /* Mistake? */
 }

 :root {
     /* Colors */
     --link : #0033a0;
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
     --heavy-underline : #222;
     --note-bg : #ffffad;
     --note-fg : #333333;
     --note-light-bg : #ffffdd;
     --note-light-fg: #333;
     /* Typography */
     --recipeFont : Lora, Ubuntu, Cantarell, serif;
     --recipeHeadFont : Lora,'Noto Sans',Ubuntu,Cantarell,-apple-system,sans-serif;
     --brandFont : 'Gimlet Sans Web','Noto Sans',Ubuntu,Cantarell,-apple-system,sans-serif;
     --uiFont : 'Noto Sans', Ubuntu, Cantarell, -apple-system, sans-serif;
     --large : 2rem;
     --small : 0.8rem;
     --xsmall : 0.6rem;
     /* Sizes */
     --navHeight: 30px;
     /* Inputs and Buttons */
     --inputBorder : 1px solid #aaa;
     --focusedInputBorder : 3px solid #777;
     --inputRadius : 3px;
     --inputPadding: 5px;
 }
 :global(input,textarea,[contenteditable]) {
     border : var(--inputBorder);
     padding: var(--inputPadding);
     border-left: none;
     border-top: none;
     border-right: none;
 }
 :global(input:focus,textarea:focus,[contenteditable]:focus) {
     border-width: 3px
 }
 
 :global(:focus) {
     outline-style: none;
 }
 .keyboardUser :global(:focus) {
     outline-color: var(--focus-border);
     outline-style : auto;
 }

 
</style>
