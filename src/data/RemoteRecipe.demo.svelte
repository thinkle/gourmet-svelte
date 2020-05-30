<script>
 import {jsonConcisify} from '../utils/textUtils.js';
 import {RecipeApi} from '../data/remoteApi.js';
 import { user, redirectURL } from '../stores/user.js';
 import {testRecs} from "../common/mocks/recipes.js";
 import deepcopy from 'deepcopy';
 let remoteApi
 $: remoteApi = RecipeApi($user);
 let selectedProp;
 
 let promise
 let currentFunction
 let savedResults = []
 let theOne
 let functions = [
     {
         name:'Add recipe',
         action:()=>{
             promise = remoteApi.addRecipe(
                 deepcopy(testRecs.standard)
             );
         }
     },
     {
         name : 'Fetch the one back',
         action : ()=>{
             promise = remoteApi.getRecipe(
                 theOne._id
             );
         }
     },
     {
         name : 'Update the one',
         action : ()=>{
             theOne.title = 'UPDATED: '+theOne.title
             promise = remoteApi.updateRecipe(
                 theOne
             );
         }
     },
     {
         name : 'Fetch 10',
         action : ()=>{
             promise = remoteApi.getRecipes({limit:10});
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
        {jsonConcisify(theOne)}
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
            <div>{jsonConcisify(data)}</div> <p on:click={()=>theOne=data}>Make "the one"</p>
            {#if data.result}
                {#if Array.isArray(data.result)}
                    .result:
                    {#each data.result as item}
                        <div on:click={()=>theOne=item}>{jsonConcisify(item)}</div>
                    {/each}
                {:else}
                    <div on:click={()=>theOne=data.result}>.result: {jsonConcisify(data.result)}</div>
                {/if}
            {/if}

        {:catch err}
            <h3>Got error :(</h3>
            <div>{jsonConcisify(err)}</div>
        {/await}
    {/if}

    
    {#if savedResults}
        {#each savedResults as data}
            <div>{jsonConcisify(data)}</div> <p on:click={()=>theOne=data}>Make "the one"</p>
            {#if data.result}
                {#if Array.isArray(data.result)}
                    .result:
                    {#each data.result as item}
                        <div on:click={()=>theOne=item}>{jsonConcisify(item)}</div>
                    {/each}
                {:else}
                    <div on:click={()=>theOne=data.result}>.result: {jsonConcisify(data.result)}</div>
                {/if}
            {/if}

        {/each}
    {/if}
</div>

