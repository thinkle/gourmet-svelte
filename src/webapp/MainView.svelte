<script>
 import {registerBuild} from '../stores/debugStore.js'; registerBuild(Number("BUILD_MS"));
 import RecipeList from '../recDisplay/RecipeList.svelte';
 import ShoppingList from '../shopDisplay/ShoppingList.svelte';
 import {shoppingList,recipesOnList} from '../stores/shoppingStores.js';
 import {
     Bar,
     Button,
     IconButton,
     JsonDebug,
     LazyIf,
     ModalLauncher,
     Modal,
     NavActions,
     FullHeight,
     Status,
     Tabs,
     Tab,
     WhiskLogo,
 } from '../widgets/';
 import OpenRecipes from '../recDisplay/OpenRecipes.svelte';

 import {connected,
        localRecipes,
        openLocalRecipes,recipePage,
        recipeActions} from '../stores/recipeStores.js';
 let opener;
 let syncingPromise


 import {storedRecipes} from '../stores/recipeStores.js';

 import {getContext,onMount} from 'svelte';
 import {writable} from 'svelte/store'
 let hideOpenButton = writable(true);

 let page='RecipeList'

 let selectedRecipes = []

 function deleteSelected () {
     selectedRecipes.map(
         // fix me when we get proper bulk operation...
         recipeActions.deleteRecipe
     )
 }
 function shopSelected () {
     selectedRecipes.map(shoppingList.addRecipe); // inefficient, but I don't think we'll care
 }
 function openSelected () {
     selectedRecipes.map((id)=>localRecipes.open(id).then(()=>opener.open(id)))
 }

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
                    {#if $recipesOnList && $recipesOnList.length}
                        ({$recipesOnList.length})
                    {/if}
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
    
    <LazyIf condition="{page=='ShoppingList'}">
        <ShoppingList/>
    </LazyIf>
    <LazyIf condition="{page=='RecipeList'}">
        {#if selectedRecipes.length > 0}
            <Bar>
                <div slot="right">
                    Bulk Actions:
                    <NavActions>
                        <li>
                            <IconButton icon="delete"
                                        on:click={deleteSelected}
                            >
                                Delete
                            </IconButton>
                        </li>
                        <li>
                            <IconButton icon="shopping_cart"
                                        on:click={shopSelected}
                            >
                                Add to Shopping List
                            </IconButton>
                        </li>
                        <li>
                            <IconButton icon="open"
                                        on:click={openSelected}
                            >
                                Open
                            </IconButton>
                        </li>
                    </NavActions>
                </div>
            </Bar>
        {/if}
        <RecipeList
            onSelectionChange="{(ids)=>selectedRecipes=ids}"
            onRecipeClick="{
                           (id)=>localRecipes.open(id).then(()=>opener.open(id))
                           }"
        />
    </LazyIf>
    <OpenRecipes bind:this="{opener}"
                 hide="{page!=='OpenRecipes'}"
                 onOpen="{()=>page='OpenRecipes'}"
    />
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
        Page<JsonDebug data={$recipePage}/>
        Stored<JsonDebug data={$storedRecipes}/>
        Local<JsonDebug data={$localRecipes}/>
    </div>
{/if}
<style>
</style>
