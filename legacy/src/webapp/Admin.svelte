<script>
 import { user, redirectURL } from '../stores/userStore.js'
 import {AdminSetupRequest} from '../data/requests/index.js';
 var accessCheck
 $: accessCheck = AdminSetupRequest.makeRequest(
     {user:$user,params:{action:'has_access'}}
    );

 let actions = ['setupIndexes','create_recipes','create_recipe_index','create_user_index','query_recipes','create_users']
 let theAction;
 let theResult;

 function doAction () {
     theResult = AdminSetupRequest.makeRequest({
         user:$user,
         params:{action:theAction}
     })
 }
 

</script>
<div>
    {#await accessCheck}
        Checking for accesss...
    {:then json}
        {#if json.access}
            Yippee we got access
            {#each actions as action}
                <button class='tog' class:active={theAction==action} on:click={()=>theAction=action}>{action}</button>
            {/each}
            <button on:click={doAction}>Make Request</button>
            {#await theResult}
                Running action... {theAction}
            {:then json}
                {#if json}
                    Cool,got result for {theAction}: {JSON.stringify(json)}
                {/if}
            {:catch error}
                Bummer, got error: {JSON.stringify(error)}
            {/await}
        {:else}
            Perhaps you have the wrong user logged in?
            User: {$user && $user.email}
        {/if}
    {:catch error}
        Error checking access: {JSON.stringify(error.error)}
    {/await}
</div>
<style>
 .tog {border: none; background-color: white; margin-right: 1em;}
 .tog:hover {border-bottom: 1px solid #777;}
 .tog.active {border-bottom: 3px solid #555;}
</style>
