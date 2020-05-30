<script>
 import Tester from '../widgets/Tester.svelte';
 import localApi from '../data/dexieApi.js';
 
async function addRec () {
     results = await localApi.addRecipe({title:'Hello world'});
 }
 let results
</script>


<Tester name="Local Data" >
    <button on:click={()=> localApi.connect()} >Connect</button>
    <button on:click={()=>addRec()} >Add Rec</button>
    <button on:click={async ()=>results= await localApi.getRecipe(1)} >Get Rec #1</button>
    <button on:click={async ()=>results= await localApi.getRecipes()}>Get recipes</button>
    <pre>{results && JSON.stringify(results)}</pre>
</Tester>

