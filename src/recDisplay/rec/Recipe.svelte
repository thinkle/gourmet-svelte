<script>
  import { registerBuild } from "../../stores/debugStore.js";
  registerBuild(Number("BUILD_MS"));
  export let editOnOpen = undefined;
  export let rec = undefined;
  export let onChange = undefined;
  export let onOpenSubRec = undefined;
  export let showShopping = true;
  export let editable = true;
  //export let onEditToggle = undefined;
  export let minPropWidth = 150;

  export function setEditMode(val) {
    editMode = val;
  }

  let editMode = editOnOpen;

  import { getStyle, getColor } from "./colors.js";

  import {
    Bar,
    Button,
    AmountInput,
    IconButton,
    JsonDebug,
    Modal,
    ModalLauncher,
    NavActions,
    StatusIcon,
    Tabs,
    Tab,
    Stack,
    tooltip,
  } from "../../widgets/";
  import SideBySide from "../../widgets/layout/SideBySide.svelte";

  import IngredientList from "../ing/IngredientList.svelte";
  import TimeSummary from "./TimeSummary.svelte";
  import RecProp from "../props/RecProp.svelte";

  import RecDef from "../../common/RecDef.js";

  import { recipeState, recipeActions } from "../../stores/recipeStores.js";
  import { shoppingList } from "../../stores/shoppingStores.js";
  import { onMount, setContext, getContext } from "svelte";
  import { writable } from "svelte/store";
  import { watchResize } from "svelte-watch-resize";
  // import deepcopy from 'deepcopy';
  import { deepcopy } from "./libraries.js";

  $: {
    if (rec && !rec.title && editable) {
      editMode = true;
    }
  }

  let valid = false;
  $: {
    valid = isValid(rec);
  }

  function triggerChange() {
    if (onChange) {
      onChange(rec);
    }
  }

  $: if (rec && rightBlock && imageBlock) {
    handleResize();
  }

  var ingeditmode = false;
  $: ingredientsAreEditable = ingeditmode || editMode;

  // Store business...
  let multiplier = writable(1);
  setContext("multiplier", multiplier);
  let ingredientList = writable([]);
  setContext("ingredientList", ingredientList);
  let highlightedIngredient = writable({ active: [] });
  setContext("highlightedIngredient", highlightedIngredient);
  let popupIngPanel = false;
  /* Set ingredient list to pop down in mobile view if highlighted ingredient changes so user can
  click word in recipe to see that item pop up on the ingredient list. */
  $: {
      if ($highlightedIngredient) {
          if  ($highlightedIngredient.highlighted) {
            popupIngPanel = $highlightedIngredient.highlighted; // $highlightedIngredient.highlighted;
          } else {
            popupIngPanel = false;
          }
      }
  }

  $: if (rec && rec.ingredients) {
    // Let's check for a change before assigning...
    updateIngredientList();
  }

  function updateIngredientList() {
    let items = crawl($ingredientList);
    for (let ing of rec.ingredients) {
      if (items.indexOf(ing.text) == -1) {
        $ingredientList = deepcopy(rec.ingredients);
        return;
      }
      if (ing.ingredients) {
        for (let ii of ing.ingredients) {
          if (items.indexOf(ii.text) == -1) {
            $ingredientList = deepcopy(rec.ingredients);
            return;
          }
        }
      }
    }

    function crawl(ii, items = []) {
      for (let i of ii) {
        items.push(i.text);
        if (i.ingredients) {
          crawl(i.ingredients, items);
        }
      }
      return items;
    }
  }

  let imageBlock;
  let imageBlockWidth;
  let rightBlock;
  let widthLeftOfImage = "";
  let imageCentered = false;
  let maxImageWidth = 100;
  /* onMount(()=>{
   *     handleResize()
   * }
   * ); */

  let rightBlockWidth;
  function handleResize() {
    if (!imageBlock || !rightBlock) {
      return;
    }
    if (!imageCentered) {
      imageBlockWidth = imageBlock.clientWidth;
    }
    rightBlockWidth = rightBlock.clientWidth;
    widthLeftOfImage = rightBlock.clientWidth - imageBlockWidth - 30;
    if (widthLeftOfImage < minPropWidth) {
      widthLeftOfImage = rightBlock.clientWidth;
      imageCentered = true;
    } else {
      imageCentered = false;
    }
    maxImageWidth = rightBlockWidth - 20;
  }

  function resizeOnUpdate(node) {
    handleResize(); // initial handle resie...
    return {
      update() {
        handleResize();
      },
    };
  }

  /* Check if our recipe is valid - helps us display a message rather
    than crashing outright... */
  function isValid(rec) {
    if (!rec.ingredients || !Array.isArray(rec.ingredients)) {
      return false;
    }
    return true;
  }

  let loginContext = getContext("login");
  let doLogin;
  if (loginContext) {
    let { doLogin } = loginContext;
  } else {
    doLogin = () => window.alert("No login context");
  }

  let debug;
  let showTimesOverIngredients = false;
  let showTimeButton = false;
</script>

{#if valid}
  <div class="recipe-wrap" style={getStyle(rec)}>
    <!-- Above the side-by-side view... -->

    <!-- <div class="top" use:watchResize="{handleResize}"> -->

    <Bar
      large="true"
      alignTop={true}
      growLeft={true}
      maxWidth="1250px"
      style="border-bottom: 2px solid var(--accent-bg);"
    >
      <div class="titleSlot" slot="left" style="align-items: flex-end">
        <h2>
          {#each RecDef.titleProps as prop}
            <RecProp
              onChange={triggerChange}
              showLabel={false}
              {editable}
              edit={editMode}
              {prop}
              bind:value={rec[prop.name]}
            />
          {/each}
        </h2>
      </div>
      <div slot="right">
        <div class="status">
          {#if rec && editable}
            <StatusIcon 
              icon="offline_pin"
              tt="Saved to browser"
            />
            {#if rec.savedRemote}

              <StatusIcon icon="cloud_done" tooltip="true" tooltipLeft={true}>
                Saved to browser and in the cloud. Last saved at {new Date(
                  $recipeState[rec.id].last_modified
                ).toLocaleString()}
                <IconButton
                  icon="refresh"
                  bare="true"
                  small="true"
                  on:click={() => recipeActions.getRecipe(rec.id)}
                />
              </StatusIcon>
            {:else if $recipeState[rec.id]}
              <StatusIcon icon="cloud_off" tooltip="true" tooltipLeft={true}>
                Saving to the cloud failed - perhaps you're offline or you need
                to
                <span on:click={() => doLogin()}>log in again</span>. Your
                recipe is still being stored up locally in your web browser, but
                it won't be available in other devices. Saved locally at {new Date(
                  $recipeState[rec.id].last_modified
                ).toLocaleString()}
                <IconButton
                  icon="refresh"
                  bare="true"
                  small="true"
                  on:click={() => recipeActions.getRecipe(rec.id)}
                />
              </StatusIcon>
            {:else}
              <StatusIcon icon="info" tooltip="true" tooltipLeft={true}>
                Huh, no state information found for this recipe at all. Are you
                testing or is this a bug?
                <IconButton
                  icon="refresh"
                  bare="true"
                  small="true"
                  on:click={() => recipeActions.getRecipe(rec.id)}
                />
              </StatusIcon>
            {/if}            
            <StatusIcon
              icon="share"
              bare="true"
              small="true"
              tooltip="true"
              tooltipWidth={130}
            >
              {#if rec.share}
                <Stack>
                  <a class="underline" target="_blank" href={`/share/${rec._id}/`}>
                    Sharing Link
                  </a>
                  <IconButton 
                    bare="true"
                    icon="content_copy" 
                    inverse="true"
                    on:click={()=>navigator.clipboard.writeText(
                      new URL(`/share/${rec._id}/`,location.origin).toString()
                      )
                    }>
                    Copy Link
                  </IconButton>
                  <IconButton 
                    bare="true"
                    icon="lock" 
                    inverse="true"
                    on:click={()=>recipeActions.setRecipeSharing({_id:rec._id},false)}
                    tt="People you shared the recipe with will no longer be able to access it."
                    >
                    Unshare
                  </IconButton>
                </Stack>
              {:else}
                <IconButton icon="share" on:click={()=>recipeActions.setRecipeSharing({_id:rec._id},true)}
                  tt="This will allow you to share a link which lets other users see or copy your recipe."
                >Make Recipe Shareable
                </IconButton>
              {/if}
            </StatusIcon>
          {/if}
        </div>
        <NavActions>
          {#if showShopping}
            <li>
              <IconButton
                icon="shopping_cart"
                on:click={async () => {
                  await shoppingList.addRecipe(rec.id, $multiplier);
                  shoppingList.save();
                }}
              >
                Add to List
              </IconButton>
            </li>
          {/if}
          {#if editable}
            <li>
              <IconButton
                icon="edit"
                toggle={true}
                toggled={editMode}
                on:click={() => (editMode = !editMode)}
              >
                Edit{#if editMode}ing{/if}
                Recipe{#if !editMode}&nbsp;&nbsp;&nbsp;{/if}
              </IconButton>
            </li>
            {#if $recipeState[rec.id] && $recipeState[rec.id].edited}
              <li>
                <IconButton
                  icon="undo"
                  on:click={() => recipeActions.revertRecipe(rec.id)}
                  busy={$recipeState[rec.id].updating}
                >
                  Revert Changes
                </IconButton>
              </li>
              <li>
                <IconButton
                  icon="save"
                  tooltip="Attempt to save?"
                  busy={$recipeState[rec.id].updating}
                  on:click={() =>
                    recipeActions.updateRecipe(rec).then(() => {
                      editMode = false;
                    })}
                >
                  Save
                </IconButton>
              </li>
            {:else if $recipeState[rec.id] && !$recipeState[rec.id].savedRemote}
              <li>
                <IconButton
                  busy={$recipeState[rec.id].updating}
                  icon="cloud_upload"
                  on:click={() => recipeActions.updateRecipe(rec)}
                >
                  Save to Cloud
                </IconButton>
              </li>
            {/if}
          {/if}
        </NavActions>
      </div>
    </Bar>
    <!-- </div> -->
    <!-- End top section -->
    <!-- Main recipe  -->
    <SideBySide
      leftWidth="325"
      maxWidth="1250px"
      stackSidesAt={550}
      maxWidthRight="45rem"
      maxWidthLeft="45rem"
      forceLeftFlyIn={popupIngPanel}
    >
      <div class="inghead" slot="leftHead">
        <h3 on:click={() => (showTimesOverIngredients = false)}>Ingredients</h3>
        {#if !editMode && editable}
          {#if ingeditmode}
            <IconButton
              small={true}
              bare="true"
              on:click={() => (ingeditmode = false)}
              ariaLabel="Finish editing ingredients"
              icon="done"
            />
          {:else}
            <IconButton
              small={true}
              bare="true"
              ariaLabel="Edit ingredients"
              on:click={() => (ingeditmode = true)}
              icon="edit"
            />
          {/if}
        {/if}
        <div class="multiplier" use:tooltip={{ content: "Multiply recipe" }}>
          &times;
          <AmountInput
            ariaLabel="multiply by"
            value={$multiplier}
            on:change={(e) => ($multiplier = e.detail)}
            showPlusMinusButtons={true}
          />
        </div>
        {#if showTimeButton}
          <IconButton
            on:click={() =>
              (showTimesOverIngredients = !showTimesOverIngredients)}
            style="margin-left:auto;"
            bare={true}
            icon="access_time"
            toggle={true}
            toggled={showTimesOverIngredients}
            tt="Show times in recipe"
          />
        {/if}
      </div>
      <span slot="leftHandle">Ingredients</span>
      <div
        slot="left"
        on:dblclick={() => {
          if (!showTimesOverIngredients) ingeditmode = true;
        }}
      >
        <div class="timeSummary" class:hidden={!showTimesOverIngredients}>
          <TimeSummary
            onReadTimes={(times) => (showTimeButton = !!times.length)}
            {rec}
          />
        </div>
        <IngredientList
          {editable}
          {onOpenSubRec}
          onChange={triggerChange}
          editMode={ingredientsAreEditable}
          bind:ingredients={rec.ingredients}
        />
      </div>

      <div
        class="rectext"
        slot="right"
        bind:this={rightBlock}
        use:resizeOnUpdate
        style={`--widthRightBlock:${rightBlockWidth}px`}
      >
        <div
          class="topblock"
          style={`--widthLeftOfImage:${widthLeftOfImage}px`}
        >
          <div class="props">
            {#if false}
              <div
                class="images"
                class:centered={imageCentered}
                use:resizeOnUpdate
                bind:this={imageBlock}
                style={`--max-image-width:${maxImageWidth}px`}
              >
                {#each rec.images as image}
                  <!-- Small: <img alt="{image.alt||rec.title}" src="{image.thumbnailUrl}"/> -->
                  <img alt={image.alt || rec.title} src={image.url} />
                {/each}
              </div>
              <!-- close images -->
            {/if}

            {#each RecDef.recProps.filter((p) => !p.bottom) as prop}
              <div class="prop">
                <RecProp
                  floatWidth={widthLeftOfImage}
                  onChange={triggerChange}
                  {editable}
                  edit={editMode}
                  {prop}
                  bind:value={rec[prop.name]}
                />
              </div>
              <!-- Close flowing props  -->
            {/each}

            <!-- block props  -->
            {#each RecDef.recProps.filter((p) => p.bottom) as prop}
              <div class="prop bottomProp">
                <RecProp
                  floatWidth={widthLeftOfImage}
                  onChange={triggerChange}
                  {editable}
                  edit={editMode}
                  {prop}
                  bind:value={rec[prop.name]}
                />
              </div>
            {/each}
            <!-- end block props -->
          </div>
          <!-- close props -->
        </div>
        <!-- close topblock -->
      </div>
      <!-- close right slot -->
    </SideBySide>
    </div>
{:else if !rec}
  Loading recipe...
{:else}
  Invalid Recipe: {JSON.stringify(rec)}
{/if}

{#if DEV}
  <ModalLauncher key="rec-debug" modalVisible={debug}>
    <Button on:click={() => (debug = !debug)}>DEBUG</Button>
  </ModalLauncher>
  {#if debug}
    <Modal key="rec-debug" onClose={() => (debug = false)}>
      <div>
        <li>editable {editable}</li>
        <li>editMode {editMode}</li>
        <li>editOnOpen {editOnOpen}</li>
        <li>ingredientsAreEditable {ingredientsAreEditable}</li>
        <li>ingeditmode {ingeditmode}</li>
        <li>multiplier {$multiplier}</li>
        <li>edit {editMode}</li>
        <li>imageBlock {imageBlock}</li>
        <li>imageBlockWidth {imageBlockWidth}</li>
        <li>rightBlock {rightBlock}</li>
        <li>widthLeftOfImage {widthLeftOfImage}</li>
        = ''
        <li>imageCentered {imageCentered}</li>
        <li>maxImageWidth {maxImageWidth}</li>
        <li>rightBlockWidth {rightBlockWidth}</li>
        <br />rec <JsonDebug data={rec} />
        RecipeState <JsonDebug data={$recipeState} />
        IngredientList <JsonDebug data={$ingredientList} />
        highlightedIngredient <JsonDebug data={$highlightedIngredient} />
      </div>
    </Modal>
  {/if}
{/if}
<style>  
  h2 {
    flex-grow: 2;
    font-weight: bold;
    font-size: 1.5rem;
  }
  .prop:first-child {
    margin-top: 0;
  }
  .prop {
    margin-top: 5px;
  }
  .centered {
    width: 100%;
    margin: auto;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .multiplier {
    margin-left: 1em;
    margin-right: auto;
    display: flex;
  }
  .images img {
    max-width: var(--max-image-width);
  }

  @media (max-width: 599px) {
    .titleSlot {
      overflow: hidden;
    }
    h2 {
      font-size: 1.5rem;
      /* max-width: calc(100vw - 60px);
          */
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
    h2 :global(*) {
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }
  }

  .inghead {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  .recipe-wrap {
    display: contents;
  }

  .timeSummary {
    transition: all 300ms; /* scaled to oversized max-height */
    min-height: 100px;
    opacity: 1;
    max-width: 95%;
  }
  .hidden {
    opacity: 0;
  }
  .timeSummary.hidden {
    min-height: 0;
    max-height: 0;
    overflow-y: hidden;
  }

  @media print {
    .recipe-wrap :global(a::after) {
      content: " (" attr(href) ") ";
    }
    .status {
      display: none;
    }
  }
</style>
