<script>
 import Tester from '../widgets/Tester.svelte';
 import {testRecs} from '../common/mocks/recipes.js'
 import Recipe from './recDisplay/Recipe.svelte';
 import RecDisplayTests from './recDisplay/DemoRecDisplay.svelte';
 import WidgetTests from '../widgets/WidgetTests.svelte';
 import widgetTestPaths from '../widgets/widgetTests.js';
 import LocalDataTester from './LocalDataTester.svelte';
 import RecipeDataTester from '../stores/RecipeDataTester.svelte';
 import RemoteApiTester from '../data/RemoteApiTester.svelte';
 import HighlightTest from '../extension/parser/HighlightTest.svelte';
 export let demo
 
 let demos = {
     widgets : WidgetTests,
     rec : RecDisplayTests,
     localData : LocalDataTester,
     remote: RemoteApiTester,     
     rd : RecipeDataTester,
     highlight : HighlightTest,
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
</style>
