<script>
  import { Inline, Input, Button, Select, Option, Text } from "contain-css-svelte";
  import AisleLabel from "./AisleLabel.svelte";
  import { aisleKind, aisleName } from "./aisleKinds.js";

  let { item, choices, onchoose, onrename, oncancel } = $props();
  let newAisle = $state("");

  function addAisle(event) {
    event.preventDefault();
    if (newAisle.trim()) onchoose(newAisle.trim());
  }
</script>

<div class="aisle-picker">
  <p><Text muted>Current aisle: <strong>{item.aisle ? aisleName(item.aisle) : "None"}</strong>{item.guess ? " (suggested)" : ""}</Text></p>
  {#if choices.length > 7}
    <label>
      Aisle
      <Select value={item.aisle ?? ""} aria-label="Aisle for {item.name}" onchange={(event) => onchoose(event.currentTarget.value)}>
        {#if !item.aisle}<Option value="" disabled>Choose an aisle</Option>{/if}
        {#each choices as name (name)}
          <Option value={name}><AisleLabel {name} selected={name === item.aisle} /></Option>
        {/each}
      </Select>
    </label>
  {:else}
    <Inline wrap="wrap">
      {#each choices as name (name)}
        <Button class={`aisle-choice aisle-${aisleKind(name) ?? "custom"}`} aria-pressed={name === item.aisle}
          onclick={() => onchoose(name)} aria-label="Put {item.name} in {aisleName(name)}">
          <AisleLabel {name} selected={name === item.aisle} />
        </Button>
      {/each}
    </Inline>
  {/if}
  <form onsubmit={addAisle}>
    <label>
      New aisle
      <Inline>
        <Input type="text" placeholder="e.g. Deli" bind:value={newAisle} aria-label="New aisle for {item.name}" autocomplete="off" />
        <Button type="submit" disabled={!newAisle.trim()}>Add aisle</Button>
      </Inline>
    </label>
  </form>
  <Inline wrap="wrap">
    {#if item.category}<Button onclick={() => onchoose("")}>Reset aisle</Button>{/if}
    <Button onclick={onrename}>Rename item…</Button>
    <Button onclick={oncancel}>Cancel</Button>
  </Inline>
</div>
