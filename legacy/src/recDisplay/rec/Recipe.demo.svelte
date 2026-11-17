<script>
 import {Tester,Bar,Button,FullHeight,FullScreen} from '../../widgets/';
 import {testRecs} from '../../common/mocks/recipes.js'
 import Recipe from './Recipe.svelte';
 export let initialShow=true;
 export let change=0
 function onChange (v) {
     console.log('Recipe change',v)
     change+=1
 }
 let recname = 'standard' // hard-coded into Recipe.test.js
</script>

<FullScreen scrolls="{false}">
    <div class="slot" slot="header"><Bar>
        <div slot="center" >{change} changes...
        </div>
        <div slot="right">
            <Button on:click={()=>change=0}>Reset</Button>
        </div>
    </Bar></div>
    <div class="slot" slot="main"><Tester
        name="Test Recipe"
        options="{Object.keys(testRecs)}"
        let:option="{recname}"
        initialShow="{initialShow}"
    >

        <Recipe rec="{testRecs[recname]}"
                onChange="{onChange}"
        >
        </Recipe>
    </Tester>
    </div>
</FullScreen>
