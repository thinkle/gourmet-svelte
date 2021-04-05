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
  let bigList = ["happy"];
  for (let i = 0; i < 100; i++) {
    bigList.push(bigList[0]);
  }
</script>

<div>
  <Button>Here is a Button for Reference</Button>
  <br />
  <Select on:change={onChange}>
    <option value="foo">Cool <i>Format</i></option>
    <option value="bar">Beans <b>bolder</b></option>
  </Select>
  <Select on:change={onChange}>
    {#each bigList as item, n}
      <option value={n}>
        <b>{item}</b>
        <i>{item}</i>
        <u>{item}</u>
      </option>
    {/each}
  </Select>
  Fancy Select with Object:
  <Select bind:value={person}>
    {#each fancyValues as person, i}
      <option value={person}>{person.name}</option>
    {/each}
  </Select>

  <p>
    This one will be over a bit
    <Select>
      <option value={2}>Hello world</option>
      <option value={1}>Hello world there</option>
      <option value={3}
        ><span style="white-space: nowrap"
          >Hello world there it is really nice to see how we fly off the edge of
          the screen.</span
        ></option
      >
    </Select>
  </p>
  <p>
    This one will be over a bit
    <Select>
      <option value={2}>Hello world</option>
      <option value={1}>Hello world there</option>
      <option value={3} style="white-space: nowrap"
        >Hello world there it is really nice to see how we fly off the edge of
        the screen fly fly fly fly fly fly fly off the edge.</option
      >
    </Select>
  </p>

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
