<script>
 import localApi from './dexieApi.js';
 import {JsonDebug,Button} from '../../widgets'
 async function addRec () {
     results = await localApi.addRecipe({title:'Hello world',savedRemote:0});
 }
 let results
 let sortProp='title'
</script>


<br><Button on:click={()=> localApi.connect()} >Connect</Button>
<br><Button on:click={()=>addRec()} >Add Rec</Button>
<br><Button on:click={async ()=>results= await localApi.getRecipe(1)} >Get Rec #1</Button>
<br><Button on:click={async ()=>results= await localApi.getRecipes()}>Get recipes</Button>
<br><Button on:click="{async ()=>results= await localApi.getRecipes(
                 {limit:50,
                  query:{deleted:0},
                  sort:sortProp}
                 )}">Get sorted recs</Button> <input bind:value="{sortProp}">
<br><Button on:click={async ()=>{debugger;results= await localApi.getRecipes({
                 query:{savedRemote:0}
                 })}}>Get unsynced</Button>
<JsonDebug data="{results}"/>


