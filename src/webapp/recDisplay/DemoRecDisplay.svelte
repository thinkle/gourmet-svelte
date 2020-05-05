<script>
 import Tester from '../../widgets/Tester.svelte';
 import {testRecs} from '../../common/mocks/recipes.js'
 import Recipe from './Recipe.svelte';
 export let initialShow
</script>

<div> 
    <Tester name="Test Recipe"
            options={Object.keys(testRecs)}
            let:option={recname}
            initialShow={initialShow}
    >
        <Recipe rec={testRecs[recname]}>
        </Recipe>
    </Tester>
</div>