<script>
import TimeSummary from './TimeSummary.svelte'
 import {Tester,Bar,Button,FullHeight,FullScreen} from '../../widgets/';
 import {testRecs} from '../../common/mocks/recipes.js'
 import Recipe from './Recipe.svelte';
 export let initialShow=true;
 export let change=0
 function onChange (v) {
     console.log('Recipe change',v)
     change+=1
 }
</script>

<Tester
  name="Test Recipe"
  options="{Object.keys(testRecs)}"
  let:option="{recname}"
  initialShow="{initialShow}"
>
  <TimeSummary rec="{testRecs[recname]}"
                onChange="{onChange}"
        />
    </Tester>
