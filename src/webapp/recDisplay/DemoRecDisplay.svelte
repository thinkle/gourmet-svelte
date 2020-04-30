<script>
 import Tester from '../../widgets/Tester.svelte';
 import {testRecs} from '../../common/mocks/recipes.js'
 import Recipe from './Recipe.svelte';
</script>

<div>
    <Tester name="Test Recipe"
            options={Object.keys(testRecs)}
            let:option={recname}
    >
        <Recipe rec={testRecs[recname]}>
        </Recipe>
    </Tester>
</div>