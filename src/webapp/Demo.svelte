<script>
 import Tester from '../widgets/Tester.svelte';
 import {testRecs} from '../common/mocks/recipes.js'
 import Recipe from './recDisplay/Recipe.svelte';
 import RecDisplayTests from './recDisplay/DemoRecDisplay.svelte';
 import WidgetTests from '../widgets/WidgetTests.svelte';
</script>
<div>
    <Tester name="Widgest" >
        <WidgetTests/>
    </Tester>
    <Tester name="Recipe Display" >
        <RecDisplayTests/>
    </Tester>

</div>
<style>
</style>
