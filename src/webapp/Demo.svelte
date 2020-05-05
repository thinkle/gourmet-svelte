<script>
 import Tester from '../widgets/Tester.svelte';
 import {testRecs} from '../common/mocks/recipes.js'
 import Recipe from './recDisplay/Recipe.svelte';
 import RecDisplayTests from './recDisplay/DemoRecDisplay.svelte';
 import WidgetTests from '../widgets/WidgetTests.svelte';
 import LocalDataTester from './LocalDataTester.svelte';
 import RecipeDataTester from '../stores/RecipeDataTester.svelte';
 export let demo
 
 let demos = {
     rec : RecDisplayTests,
     localData : LocalDataTester,
     widgets : WidgetTests,
     tester : Tester,
     rd : RecipeDataTester,
 }

 $: {
     console.log('Demo is',demo);
 }
</script>
<div>
    {#if demo}
    <svelte:component this="{demos[demo]}" initialShow={true} />
    {:else}
    <Tester name="Widgets" >
        <WidgetTests/>
    </Tester>
    <Tester name="Recipe Display" >
        <RecDisplayTests/>
    </Tester>
    <LocalDataTester/>
    {/if}
</div>
<style>
</style>
