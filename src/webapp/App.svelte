<script>
 import {stamp} from '../stores/debugStore.js'
 import {registerBuild} from '../stores/debugStore.js'; registerBuild(Number("BUILD_MS"),'App',);
 import router from 'page';
 import Landing from './Landing.svelte';
 import Admin from './Admin.svelte';
 import MainView from './MainView.svelte';
 import ManageDB from './ManageDB.svelte';
 import SingleRecipe from '../recDisplay/SingleRecipe.svelte';
 import Demo from './Demo.svelte';
 import Sidebar from '../extension/web/Sidebar.svelte';
 import ShoppingList from '../shopDisplay/ShoppingList.svelte';
 import {testRecs} from '../common/mocks/recipes.js'

 let name = 'Gourmet';
 let page;
 let params = {};
 let keyboardUser;
 let containerScrolls = false;
 router('/',()=>{
     page = MainView;
     containerScrolls = false;
     params={
     }
 }
 );
 router('/admin',()=>{
     page = Admin;
     containerScrolls = true;
     params={
     }
 }
 );
 
 router('/manage',()=>{
     console.log('manage!');
     page = ManageDB;
     containerScrolls = true;
     params={
     }
 }
 );
 router('/rec/:id',(ctx)=>{
     page = SingleRecipe
     containerScrolls = false;
     params = {
         id:ctx.params.id
     };
 });
 router('/sidebar',()=>{
     page = Sidebar;
     params={
     };
     containerScrolls = false;
 }
 );
 router('/rl',()=>{
     page = RecipeList;
     containerScrolls = false;
     params={}}
 );
     router('/shop',()=>{
         page = ShoppingList;
         params={
         };
         containerScrolls = false;
     }
     );
     router('/oneRec',()=>{page = Recipe; params={rec:testRecs.standard}});
     router('/demo/',(ctx)=>{
         page = Demo
         params = {

         }
         containerScrolls = true;
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
    <Landing scrolls="{containerScrolls}">
        <!-- <span slot="rightnav">
             {#if page!==MainView}<a href="/">Recipe List</a>{/if}
             </span> -->
        <svelte:component this={page} {...params}/>
    </Landing>
    <div style="position: fixed; z-index: 99; bottom: 2px; right: 250px; font-size: 8pt;">{$stamp}</div>
</div>
<svelte:window on:keyup={detectKeyboardUser} on:mousedown={detectMouseUser}/>

<style>

 p {
     font-size : var(--small);
     font-family: var(--brandFont);
 }
 div {
     margin: auto;
     max-width: 1200px;
     font-family: var(--uiFont);
     font-size: 100%;
 }

 :global(body) {
     overflow-y: hidden; /* Mistake? */
 }

 :root {
     /* Colors */
     --white : #fefffa;
     --black : #111131;
     --link : #001160;
     --grey : #727272;
     --light-bg : #eef8fa;
     --light-fg : #322742;
     --medium-bg: #dadaff;
     --medium-fg: #343434;
     --focus-border: #2222df;
     --light-underline : #aaa;
     --medium-underline : #666;
     --heavy-underline : #222;
     --note-bg : #ffffad;
     --note-fg : #333333;
     --note-light-bg : #ffffdf;
     --note-light-fg: #333;
     --accent-bg: #AFD2E9; 
     --accent-fg: #121234;
     /* Typography */
     --recipeFont : Lora, Ubuntu, Cantarell, serif;
     --recipeHeadFont : Lora,'Noto Sans',Ubuntu,Cantarell,-apple-system,sans-serif;
     --brandFont : 'Gimlet Sans Web','Noto Sans',Ubuntu,Cantarell,-apple-system,sans-serif;
     --uiFont : 'Noto Sans', Ubuntu, Cantarell, -apple-system, sans-serif;
     --large : 2rem;
     --small : 0.8rem;
     --xsmall : 0.6rem;
     /* Sizes */
     --bar-height: 30px;
     /* Inputs and Buttons */
     --inputBorderColor : #aaa;
     --inputBorder : 1px solid var(--inputBorderColor);
     --focusedInputBorder : 3px solid #777;
     --inputRadius : 3px;
     --inputPadding: 5px;
 }
 :global(input,textarea,[contenteditable]) {
     /* border : var(--inputBorder);
        padding: var(--inputPadding);
        border-left: none;
        border-top: none;
        border-right: none; */
 }
 :global(input:focus,textarea:focus,[contenteditable]:focus) {
     /* border-width: 3px */
 }
 
 :global(:focus) {
     outline-style: none;
 }
 .keyboardUser :global(:focus) {
     outline-color: var(--focus-border);
     outline-style : auto;
 }
 :global(.slot) {
     display: contents;
 }
 :global(*) {
     box-sizing: border-box;
 }
 :global(a) {
     color: var(--link);
     text-decoration: none;
 }
 :global(a:hover) {
     text-decoration: underline;
 }
</style>
