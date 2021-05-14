<script>
  import * as allRequests from "./requests/index";
  import { user } from "../stores/userStore";
  import { Button, IconButton } from "../widgets/index";
  let requestNames = Object.keys(allRequests);
  let result = {};

  function isRequest(r) {
    if (r.makeRequest) {
      return true;
    }
  }
  let paramText;

  async function makeRequest(name) {
    console.log("request:", name, paramText);
    let params;
    try {
      eval("params=" + paramText);
      console.log("Got params", params);
    } catch (err) {
      console.log("Could NOT eval params?", paramText);
      return;
    }
    result = await allRequests[name].makeRequest({
      user: $user,
      params,
    });
  }
  $: console.log("RESULT: ", result);
</script>

<main>
  <section>
    <br />Params (will be eval'ed)
    <br /><textarea bind:value={paramText} />
    <br />User: (default) ({JSON.stringify($user)})
    <hr />
    <br />RESULT of Request (will also go in console):
    {JSON.stringify(result)}
  </section>
  <section>
    {#each requestNames as r}
      {#if isRequest(allRequests[r])}
        <div>
          <h3>{r}</h3>
          <Button on:click={() => makeRequest(r)}>Make Request</Button>
          <br />Request (<IconButton
            icon="content_copy"
            on:click={() =>
              (paramText = JSON.stringify(allRequests[r].requestDef))}
          />): {JSON.stringify(allRequests[r].requestDef)}
          <br />Response: {JSON.stringify(allRequests[r].responseDef)}
        </div>
      {/if}
    {/each}
  </section>
</main>

<style>
  main {
    display: flex;
  }
  main section {
    width: 40%;
    overflow-y: scroll;
    max-height: 95vh;
  }
  div {
    margin-bottom: 1rem;
    padding: 5px;
    border: 1px solid var(--grey);
  }
  textarea {
    width: 100%;
  }
</style>
