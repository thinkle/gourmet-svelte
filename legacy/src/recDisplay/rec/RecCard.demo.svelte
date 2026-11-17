<script>
 export let initialShow = true;
 import {testRecs} from '../../common/mocks/recipes.js'
 import {Tester} from '../../widgets'
 import RecCard from './RecCard.svelte';
 let size="md"
</script>
<Tester
    name="Test Recipe"
    options="{Object.keys(testRecs)}"
    let:option="{recname}"
    initialShow="{initialShow}"
>
    <div>
        <button on:click={()=>size="sm"}>sm</button>
        <button on:click={()=>size="md"}>md</button>
        <button on:click={()=>size="lg"}>lg</button>
        <input bind:value="{size}">
    </div>
    
    <div>
        <RecCard {size} rec={testRecs[recname]}/>
        <RecCard {size} rec={testRecs['standard']}/>
    </div>
</Tester>

<style>
 div {
     margin: auto;
     flex-direction: column;
     
 }
</style>
