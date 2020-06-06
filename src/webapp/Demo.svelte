<script>
 import {registerBuild} from '../stores/debug.js'; registerBuild(Number("BUILD_MS"));
 import Tester from '../widgets/Tester.svelte';
 import {testRecs} from '../common/mocks/recipes.js'
 import Recipe from './recDisplay/Recipe.svelte';
 import RecDisplayTests from './recDisplay/Recipe.demo.svelte';
 import WidgetTests from '../widgets/Widgets.demo.svelte';
 import widgetTestPaths from '../widgets/widgetDemos.js';
 import LocalDataTester from '../data/LocalData.demo.svelte';
 import RecStoreTester from '../stores/RecipeStores.demo.svelte';
 import RemoteApiTester from '../data/RemoteApi.demo.svelte';
 import HighlightTest from '../extension/parser/Highlight.demo.svelte';
 import RecipeTextTest from './recDisplay/RecipeText.demo.svelte';
 import RecipePickerTest from './recDisplay/RecipePicker.demo.svelte';
 export let demo
 
 let demos = {
     rectext : RecipeTextTest,
     widgets : WidgetTests,
     rec : RecDisplayTests,
     localData : LocalDataTester,
     remote: RemoteApiTester,     
     recipeStores : RecStoreTester,
     highlight : HighlightTest,
     recpicker : RecipePickerTest,
     ...widgetTestPaths,
 }

 $: {
     console.log('Demo is',demo);
     console.log('Demos are',demos);
 }
</script>
<div>
    {#if demo}
        {#if !demos[demo]}
            Oops - no demo named {demo}. Maybe you meant...
            {#each Object.keys(demos) as name}
                <li><a href={`/demo/${name}`}>{name}</a></li>
            {/each}
        {:else}
            <svelte:component this="{demos[demo]}" initialShow={true} />
        {/if}
    {:else}
        {#each Object.keys(demos) as name}
            <h2>{name} <a href={`/demo/${name}`}>standalone</a></h2> 
            <svelte:component this={demos[name]} initialShow={false} />
        {/each}
    {/if}
</div>
<style>
 div {
     overflow-y: scroll;
     height: 100vh;
     width: 100vw;
     overflow-x: scroll;
 }
</style>
