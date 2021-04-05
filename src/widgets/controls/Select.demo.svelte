<script>
  import Select from "./Select.svelte";
  import { Button } from "../index";

  function onChange(e) {
    console.log(e.target.value);
  }

  let fancyValues = [
    { name: "Tom", age: 42 },
    { name: "Grace", age: 13 },
    { name: "Lila", age: 9 },
  ];

  let person = null;
</script>

<div>
  <Button>Here is a Button for Reference</Button>
  <br />
  <Select on:change={onChange}>
    <option value="foo">Cool <i>Format</i></option>
    <option value="bar">Beans <b>bolder</b></option>
  </Select>

  Fancy Select with Object:
  <Select bind:value={person}>
    {#each fancyValues as person}
      <option value={person}>{person.name}</option>
    {/each}
  </Select>

  Regular old select
  <select bind:value={person}>
    {#each fancyValues as person}
      <option value={person}>{person.name}</option>
    {/each}
  </select>

  Selected Person: {JSON.stringify(person)}
</div>

<style>
  div {
    margin: 2em;
  }
</style>
