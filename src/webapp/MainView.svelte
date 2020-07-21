<script>
 import {registerBuild} from '../stores/debugStore.js'; registerBuild(Number("BUILD_MS"));
 import RecipeList from '../recDisplay/RecipeList.svelte';
 import ShoppingList from '../shopDisplay/ShoppingList.svelte';
 import {shoppingList,recipesOnList} from '../stores/shoppingStores.js';
 import {user} from '../stores/userStore.js';
 import status from '../stores/statusStore.js';
 import ImportExport from './ImportExport.svelte';
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
     StatusIcon,
     Tabs,
     Tab,
     WhiskLogo,
 } from '../widgets/';
 import OpenRecipes from '../recDisplay/OpenRecipes.svelte';

 import {connected,
        connectedRemote,
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

 import {mostRecentRequest} from '../data/requests/';
 $: {if ($connected && $connectedRemote && $user) {
     console.log('We *are* connected: sync away!');
     syncIfNeeded()
    }};

 let syncing
 let synced
 async function syncIfNeeded (force=false) {
     if (syncing) {return} // no double sync...
     let lastSyncTime = Number(localStorage.getItem('lastSync'));
     let now = new Date().getTime();
     let timeSinceSync = now - lastSyncTime;
     if (timeSinceSync > 1000 * 60 * 60 || force) {
         // if we have synced in the last hour, don't bother
         syncing = true
         console.log('Auto-sync!');
         syncingPromise = recipeActions.doSync(); // auto-sync
         await syncingPromise;
         console.log('COMPLETE!');
         localStorage.setItem('lastSync',new Date().getTime());
         syncing = false;
         synced = true
     } else {
         console.log(`Last sync was only ${timeSinceSync/1000} seconds ago, no need to sync`);
         return
     }
 }

 function onRecipeSelected (id, mode) {
     if (mode=='shop') {
         shoppingList.addRecipe(id);
     } else {
         localRecipes.open(id).then(()=>opener.open(id,mode=='edit'))
     }
 }

 let debug

 let toolbar = getContext('toolbar');
 let showImportExportModal = false;
 let importToolbarItem = toolbar.addItem({
     key:'import-export',
     props : {
         icon:'import_export',
     },
     content:'Import',
     onClick () {showImportExportModal=!showImportExportModal}
 });
 console.log('ADDED TOOLBAR ITEM!!!');

 $: if (showImportExportModal) {
     importToolbarItem.showModal();
 } else {
     importToolbarItem.hideModal();
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
    </Bar>
    
    <LazyIf condition="{page=='ShoppingList'}">
        <ShoppingList/>
    </LazyIf>
    <LazyIf condition="{page=='RecipeList'}">
        <RecipeList
            onSelectionChange="{(ids)=>selectedRecipes=ids}"
            onRecipeClick="{onRecipeSelected}"
        >
            <div slot="right" class="slot">
                <Status/>
                <NavActions>
                    <li>
                        {#if !synced}
                            <IconButton
                                on:click="{()=>syncIfNeeded(true)}"
                                icon="refresh"
                                inline="true"
                                busy="{syncing}"
                            >Sync to Cloud
                            </IconButton>
                        {:else}
                            <StatusIcon
                                icon="cloud_done"
                                tooltip="{true}"
                            >
                                Synced all recipes from the cloud to the browser
                                at {new Date(Number(localStorage.getItem('lastSync'))).toLocaleString()}
                            </StatusIcon>
                        {/if}
                    </li>
                    <li>
                        <Button
                            on:click="{async ()=>opener.open((await recipeActions.createRecipe()).id)}">
                            New Recipe
                        </Button>
                    </li>
                </NavActions>
            </div>
            <div class="slot" slot="selectedLeft">
                {selectedRecipes.length} Selected
            </div>
            <div class="slot" slot="selectedRight">
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

        </RecipeList>
    </LazyIf>
    <OpenRecipes bind:this="{opener}"
                 hide="{page!=='OpenRecipes'}"
                 onOpen="{()=>page='OpenRecipes'}"
    />
{:else}
    <div>
        <WhiskLogo/>
    </div>
{/if}
{#if showImportExportModal}
<Modal key="import-export"
       modalVisible="{showImportExportModal}"
       onClose="{()=>showImportExportModal=false}">
    <ImportExport/>
</Modal>
{/if}

{#if DEV}
    <ModalLauncher key="debug-main" modalVisible="{debug}">
        <Button on:click="{()=>debug=!debug}">DEBUG</Button>
    </ModalLauncher>
    {#if debug}<Modal key="debug-main" onClose="{()=>debug=false}">
        <div>
            Page<JsonDebug data={$recipePage}/>
            Stored<JsonDebug data={$storedRecipes}/>
            Local<JsonDebug data={$localRecipes}/>
            Shopping<JsonDebug data="{$shoppingList}"/>
            Status <JsonDebug data="{$shoppingList}"/>
            Status <JsonDebug data="{$status}"/>
        </div>
    </Modal>
    {/if}
{/if}
<style>
</style>
