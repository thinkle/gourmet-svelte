<script>
 import {registerBuild} from '../stores/debug.js'; registerBuild(Number("BUILD_MS"));
 import RecipeList from '../recDisplay/RecipeList.svelte';
 import ShoppingList from '../shopDisplay/ShoppingList.svelte';
 import {
     Bar,
     Button,
     IconButton,
     JsonDebug,
     LazyIf,
     ModalLauncher,
     Modal,
     FullHeight,
     Status,
     Tabs,
     Tab,
     WhiskLogo,
 } from '../widgets/';
 import OpenRecipes from '../recDisplay/OpenRecipes.svelte';

 import {connected,
        localRecipes,
        openLocalRecipes,
        recipeActions} from '../stores/recipeStores.js';
 let opener;
 let syncingPromise


 import {storedRecipes} from '../stores/recipeStores.js';

 import {getContext,onMount} from 'svelte';
 import {writable} from 'svelte/store'
 let hideOpenButton = writable(true);

 let page='RecipeList'

</script>



{#if $connected}
    <Bar>

        <div slot="left">
            <Tabs>
                <Tab
                    active="{page=='RecipeList'}"
                    on:click="{()=>page='RecipeList'}"
                >
                    Recipe List
                </Tab>
                <Tab
                    active="{page=='ShoppingList'}"
                    on:click="{()=>page='ShoppingList'}"
                >
                    Shopping List
                </Tab>
                {#if $openLocalRecipes.length > 0}
                    <Tab active="{page=='OpenRecipes'}"
                         on:click="{()=>page='OpenRecipes'}"
                    >
                        {#if $openLocalRecipes.length==1}
                            View Recipe
                        {:else}
                            View Recipes ({$openLocalRecipes.length})
                        {/if}
                    </Tab>
                {/if}
            </Tabs>
        </div>
        <div slot="right">
            <Button
                on:click="{async ()=>opener.open(await recipeActions.createRecipe())}">
                New Recipe
            </Button>
        </div>
    </Bar>
    <FullHeight scrolls="true">
        <LazyIf condition="{page=='ShoppingList'}">
            <ShoppingList/>
        </LazyIf>
        <LazyIf condition="{page=='RecipeList'}">
            <RecipeList
                onRecipeClick="{
                               (id)=>localRecipes.open(id).then(()=>opener.open(id))
                               }"
            />
        </LazyIf>
        <OpenRecipes bind:this="{opener}"
                     hide="{page!=='OpenRecipes'}"
                     onOpen="{()=>page='OpenRecipes'}"
        />
    </FullHeight>
    <Bar>
        <div slot="center">
            <Status/>
        </div>
        <div slot="right">
            <button on:click="{()=>syncingPromise=recipeActions.doSync()}">Sync with Server?</button>
            <button on:click="{()=>syncingPromise=recipeActions.doSync(true)}">Small Sync</button>
        </div>
        <div slot="left">
            {#if syncingPromise}
                {#await syncingPromise}
                    Syncing...
                {:then json}
                    Cool, done syncing! {JSON.stringify(json)}
                {:catch error}
                    Failed :( {console.log(error)} {error}
                {/await}
            {/if}
        </div>
    </Bar>
{:else}
    <div>
        <WhiskLogo/>
    </div>
{/if}
{#if DEV}
    <div>
        Stored<JsonDebug data={$storedRecipes}/>
        Local<JsonDebug data={$localRecipes}/>
    </div>
{/if}
<style>
</style>
