<script>
 import {jsonConcisify} from '../utils/textUtils.js';
 import {RemoteRecipeData} from '../data/remoteRecipeData';
 import { user, redirectURL } from '../stores/userStore.js';
 import {testRecs} from "../common/mocks/recipes.js";
 import deepcopy from 'deepcopy';
 import {getNutrientInfoRequest,queryNutrientRequest} from './requests/index.js';
 let remoteRecipeData
 $: remoteRecipeData = RemoteRecipeData($user);
 let selectedProp;
 
function showData (d) {
    console.log('Data:',d);
    return jsonConcisify(d);
}

 let promise
 let currentFunction
 let savedResults = []
 let theOne
 let functions = [
     {
         name:'queryNutrientRequest',
         action:()=>{
            promise = queryNutrientRequest.makeRequest({params:{query:'baked potato'}});
         }
    },
    {
        name: 'getNutrientInfoRequest',
        action:()=>{
            promise = getNutrientInfoRequest.makeRequest({params:{id:'1450081'}})
        }
    },
     {
         name:'Add recipe',
         action:()=>{
             promise = remoteRecipeData.addRecipe(
                 {recipe:deepcopy(testRecs.standard)}
             );
         }
     },
     {
         name : 'Fetch the one back',
         action : ()=>{
             promise = remoteRecipeData.getRecipe(
                 theOne._id
             );
         }
     },
     {
         name : 'Update the one',
         action : ()=>{
             theOne.title = 'UPDATED: '+theOne.title
             promise = remoteRecipeData.updateRecipe(
                 theOne
             );
         }
     },
     {
         name : 'Fetch 10',
         action : ()=>{
             promise = remoteRecipeData.getRecipes({limit:10});
         }
     }
 ]
 
 
</script>
<div>
    <h3>Non-Automated Testing Remote Rec Fetch Testing</h3>
    <p>Because sometimes you need to see stuff in the real world...</p>
    {#if theOne}
    <div style="float:right;width:30%">
        <h2>The One</h2>
        {showshowData(theOne)}
    </div>
    {/if}
    {#each functions as f}
        <button on:click={()=>{
                         console.log('Run action',f.name);
                         currentFunction=f.name;
                         f.action();
                         }}>
            {f.name}
        </button>
    {/each}
    
    {#if promise}
        {#await promise}
            Fetching data... {currentFunction}
        {:then data}
            <h3>Got data :)</h3> <button on:click={()=>savedResults = [data,...savedResults]}>save</button>
            <div>{showData(data)}</div> <p on:click={()=>theOne=data}>Make "the one"</p>
            {#if data.result}
                {#if Array.isArray(data.result)}
                    .result:
                    {#each data.result as item}
                        <div on:click={()=>theOne=item}>{showData(item)}</div>
                    {/each}
                {:else}
                    <div on:click={()=>theOne=data.result}>.result: {showData(data.result)}</div>
                {/if}
            {/if}

        {:catch err}
            <h3>Got error :(</h3>
            <div>{showData(err)}</div>
        {/await}
    {/if}

    
    {#if savedResults}
        {#each savedResults as data}
            <div>{showData(data)}</div> <p on:click={()=>theOne=data}>Make "the one"</p>
            {#if data.result}
                {#if Array.isArray(data.result)}
                    .result:
                    {#each data.result as item}
                        <div on:click={()=>theOne=item}>{showData(item)}</div>
                    {/each}
                {:else}
                    <div on:click={()=>theOne=data.result}>.result: {showData(data.result)}</div>
                {/if}
            {/if}

        {/each}
    {/if}
</div>

