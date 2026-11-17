<script>
  export let id;
  export let shared = false;

  import {
    connected,
    connectedRemote,
    recipeActions,
    storedRecipes,
    openLocalRecipes,
    localRecipes,
    recipeState,
  } from "../stores/recipeStores.js";
  import Recipe from "./rec/Recipe.svelte";
  import { Button, FullHeight, Bar, WhiskLogo, NavActions } from "../widgets/";
  import router from "page";

  async function open() {
    if (!shared) {
      if (!isNaN(Number(id))) {
        await recipeActions.openRecipe(Number(id));
      } else {
        await recipeActions.openRecipe(id);
      }
    }
  }

  $: if ($connected && !shared && id) {
    console.log("Open", id);
    open(id);
  }

  $: if ($connectedRemote && shared && id) {
    console.log('Here we go!',$connected)
    recipeActions.openSharedRecipe(id);
  }
  $: console.log("R:", $localRecipes[id]);
</script>

<Bar>
  <a slot="left" target="_BLANK" href="/"> Recipe List </a>
  <span slot="center">{$localRecipes[id] && $localRecipes[id].title}</span>
  <b slot="right">Gourmet</b>
</Bar>
<FullHeight scroll={false}>
  {#if shared}
    <Bar>
      <h3 slot="left">
        {$localRecipes[id]?.owner?.email || "Someone"} shared a recipe with you!
      </h3>
      <div slot="right">
        <NavActions>
            <li>
            <Button on:click={
              () => recipeActions
                      .copySharedRecipes([$localRecipes[id]])
                      .then((result)=>result.length && setTimeout(1000,router.redirect(`/rec/${result[0]._id}`)))
            }
                >Copy to your Recipes
            </Button>
            </li>
            <li>
            <Button on:click={() => window.print()}>Print</Button>
            </li>
        </NavActions>
      </div>
    </Bar>
  {/if}
  {#if $localRecipes[id]}
    <Recipe
      rec={$localRecipes[id]}
      editable={!shared}
      showShopping={!shared}
      onChange={(rec) => {
        console.log("SingleRecipe onChange", rec);
        $localRecipes[rec.id] = rec;
      }}
    />
  {:else}
    <blockquote>
      Loading recipe... just one second
      <WhiskLogo />
      <!-- <button on:click={()=>open(id)}>Kick it</button> -->
    </blockquote>
  {/if}
</FullHeight>

<style>
  blockquote {
    position: fixed;
    width: 100vw;
    height: 100vh;
    top: 0;
    left: 0;
    align-items: center;
    justify-items: center;
  }

  @media print {
      * {display: none}
  }
</style>
