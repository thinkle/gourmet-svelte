<script>
  import { untrack } from "svelte";
  import { Inline, Input, Button, Select, Option, Text } from "contain-css-svelte";
  import AisleLabel from "./AisleLabel.svelte";
  import { aisleName } from "./aisleKinds.js";
  import { guessAisle } from "../../app/shoppingAisles.js";

  let { item, choices, onsave, oncancel, saving = false, error = null } = $props();
  // Each opening mounts a fresh editor. Keep drafts if a save fails partway.
  let name = $state(untrack(() => item.name));
  let category = $state(untrack(() => item.aisle ?? ""));
  let categoryChanged = $state(false);
  let customCategory = $state("");
  const selectedCategory = $derived(customCategory.trim() || (categoryChanged ? category : item.category ?? guessAisle(name) ?? ""));
  const categoryChoices = $derived(selectedCategory && !choices.includes(selectedCategory) ? [...choices, selectedCategory] : choices);
  const dirty = $derived(name.trim().toLowerCase() !== item.key || categoryChanged || !!customCategory.trim());

  function chooseCategory(value) {
    category = value;
    categoryChanged = true;
    customCategory = "";
  }
  async function save(event) {
    event.preventDefault();
    if (saving || !name.trim()) return;
    await onsave({
      name: name.trim(),
      category: customCategory.trim() || (categoryChanged ? category : undefined),
    });
  }
</script>

<form class="shopping-item-editor" onsubmit={save}>
  <fieldset disabled={saving}>
    <label class="shopping-name-field">
      <span>Shopping Ingredient</span>
      <Input type="text" bind:value={name} aria-label="Shopping Ingredient" autocomplete="off" required autofocus />
    </label>

    <ul class="shopping-edit-originals" aria-label="Original recipe ingredients">
      {#each item.from as source}
        <li>
          {#if source.title}<small><Text muted>{source.title}{source.mult !== 1 ? ` ×${source.mult}` : ""}</Text></small>{/if}
          <p>{source.text}</p>
        </li>
      {/each}
    </ul>

    <label>
      Category
      <Select value={selectedCategory} aria-label="Category" onchange={(event) => chooseCategory(event.currentTarget.value)}>
        <Option value="">Automatic</Option>
        {#each categoryChoices as choice (choice)}
          <Option value={choice}><AisleLabel name={choice} selected={choice === selectedCategory} /></Option>
        {/each}
      </Select>
    </label>
    {#if !customCategory.trim() && !categoryChanged && !item.category && selectedCategory}
      <p class="shopping-editor-hint"><Text muted>Suggested category</Text></p>
    {:else if categoryChanged && !selectedCategory}
      <p class="shopping-editor-hint"><Text muted>The category will be suggested automatically.</Text></p>
    {/if}

    <details class="shopping-custom-category">
      <summary>Custom category</summary>
      <label>New category name
        <Input type="text" bind:value={customCategory} aria-label="New category name" placeholder="e.g. Deli counter" autocomplete="off" />
      </label>
    </details>

    <p class="shopping-editor-hint"><Text muted>Recipe wording stays unchanged. Matching item names merge.</Text></p>
    {#if error}<p role="alert"><Text warning>Could not save: {error}</Text></p>{/if}
    <Inline wrap="wrap">
      <Button primary type="submit" disabled={!name.trim() || !dirty}>{saving ? "Saving…" : "Save"}</Button>
      <Button type="button" onclick={oncancel}>Cancel</Button>
    </Inline>
  </fieldset>
</form>
