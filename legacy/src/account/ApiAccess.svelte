<script>
  import { onMount } from 'svelte';
  import router from 'page';
  import { user } from '../stores/userStore.js';
  import {
    createApiTokenRequest,
    listApiTokensRequest,
    revokeApiTokenRequest,
  } from '../data/requests/index.js';
  import { Button, FormTask, IconButton } from '../widgets/';

  let tokens = [];
  let createdToken = null;
  let accessMode = 'write';
  let label = '';
  let errorMessage = '';
  let apiBaseUrl = '';
  let openapiUrl = '';
  let copyStatus = '';
  let lastUserEmail = '';

  $: selectedScopes =
    accessMode === 'read'
      ? ['recipes:read']
      : ['recipes:read', 'recipes:write'];

  onMount(() => {
    apiBaseUrl = `${window.location.origin}/.netlify/functions/api`;
    openapiUrl = `${window.location.origin}/openapi.yaml`;
    refreshTokens();
  });

  $: if ($user && $user.email !== lastUserEmail) {
    lastUserEmail = $user.email;
    refreshTokens();
  }

  async function refreshTokens() {
    if (!$user) {
      tokens = [];
      return;
    }
    try {
      const response = await listApiTokensRequest.makeRequest({
        user: $user,
        params: {},
      });
      tokens = response.tokens || [];
    } catch (err) {
      errorMessage = err?.toString() || 'Failed to load tokens.';
    }
  }

  async function createToken() {
    errorMessage = '';
    createdToken = null;
    const response = await createApiTokenRequest.makeRequest({
      user: $user,
      params: { scopes: selectedScopes, label },
    });
    createdToken = response;
    label = '';
    await refreshTokens();
    return response;
  }

  async function revokeToken(id) {
    if (!id) {
      return;
    }
    await revokeApiTokenRequest.makeRequest({
      user: $user,
      params: { _id: id },
    });
    await refreshTokens();
  }

  function formatDate(value) {
    if (!value) {
      return 'Never';
    }
    return new Date(value).toLocaleString();
  }

  function scopeLabel(scopes) {
    if (!scopes || !scopes.length) {
      return 'None';
    }
    return scopes.indexOf('recipes:write') > -1 ? 'Read + Write' : 'Read only';
  }

  function buildInstructions() {
    const tokenValue = createdToken?.token || 'YOUR_API_TOKEN';
    return `You manage the user's personal Gourmet recipe database.

Use the OpenAPI spec at ${openapiUrl}.
Authenticate every request with header:
X-API-Key: ${tokenValue}

Create recipes with POST /recipes. A minimal recipe looks like:
{
  "title": "Recipe title",
  "ingredients": ["1 cup flour", "2 eggs"],
  "instructions": ["Step 1...", "Step 2..."]
}

Use GET /recipes?search=chili to find recipes.`;
  }

  async function copyText(text) {
    if (!text) {
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      copyStatus = 'Copied!';
    } catch (err) {
      copyStatus = 'Copy failed';
    }
    setTimeout(() => {
      copyStatus = '';
    }, 1500);
  }

  function goBack() {
    router('/main/RecipeList');
  }
</script>

<div class="page">
  <div class="header">
    <div>
      <h2>API Access</h2>
      <p>
        Create API tokens to let GPT or other tools read and write your recipe
        database.
      </p>
    </div>
    <Button on:click={goBack}>Back to Recipes</Button>
  </div>

  {#if !$user}
    <section class="panel">
      <p>Please log in to manage API access.</p>
    </section>
  {:else}
    <section class="panel">
      <h3>Create a Token</h3>
      <FormTask
        name="Create Token"
        buttonName="Create"
        icon="key"
        promiseAction={createToken}
        isReady={$user}
      >
        <label>Label</label>
        <input bind:value={label} placeholder="(optional) e.g. GPT access" />
        <label>Scope</label>
        <div class="scope-toggle">
          <label>
            <input type="radio" bind:group={accessMode} value="write" />
            Read + Write
          </label>
          <label>
            <input type="radio" bind:group={accessMode} value="read" />
            Read only
          </label>
        </div>
      </FormTask>
      {#if createdToken}
        <div class="callout">
          <strong>Token created.</strong> This value is shown once. Copy it now.
          <div class="copy-row">
            <code>{createdToken.token}</code>
            <IconButton
              icon="content_copy"
              bare="true"
              on:click={() => copyText(createdToken.token)}
            />
          </div>
        </div>
      {/if}
      {#if errorMessage}
        <div class="error">{errorMessage}</div>
      {/if}
    </section>

    <section class="panel">
      <h3>Token Settings for GPT</h3>
      <div class="field">
        <span>OpenAPI Spec URL</span>
        <div class="copy-row">
          <code>{openapiUrl}</code>
          <IconButton
            icon="content_copy"
            bare="true"
            on:click={() => copyText(openapiUrl)}
          />
        </div>
      </div>
      <div class="field">
        <span>API Base URL</span>
        <div class="copy-row">
          <code>{apiBaseUrl}</code>
          <IconButton
            icon="content_copy"
            bare="true"
            on:click={() => copyText(apiBaseUrl)}
          />
        </div>
      </div>
      <div class="field">
        <span>Header</span>
        <div class="copy-row">
          <code>X-API-Key: {createdToken?.token || 'YOUR_API_TOKEN'}</code>
          <IconButton
            icon="content_copy"
            bare="true"
            on:click={() =>
              copyText(`X-API-Key: ${createdToken?.token || 'YOUR_API_TOKEN'}`)
            }
          />
        </div>
      </div>
      <div class="field">
        <span>Sample LLM Instructions</span>
        <div class="copy-column">
          <textarea readonly rows="10">{buildInstructions()}</textarea>
          <div class="copy-actions">
            <Button on:click={() => copyText(buildInstructions())}>
              Copy Instructions
            </Button>
            {#if copyStatus}
              <span class="copy-status">{copyStatus}</span>
            {/if}
          </div>
        </div>
      </div>
    </section>

    <section class="panel">
      <h3>Existing Tokens</h3>
      {#if tokens.length === 0}
        <p>No tokens created yet.</p>
      {:else}
        <div class="token-list">
          {#each tokens as token}
            <div class="token-row">
              <div class="token-meta">
                <div class="token-label">
                  {token.label || 'Untitled token'}
                </div>
                <div class="token-preview">{token.tokenPreview}</div>
                <div class="token-details">
                  Scope: {scopeLabel(token.scopes)} | Created:
                  {formatDate(token.createdAt)} | Last used:
                  {formatDate(token.lastUsedAt)}
                  {#if token.revokedAt}
                    | Revoked: {formatDate(token.revokedAt)}
                  {/if}
                </div>
              </div>
              {#if !token.revokedAt}
                <Button on:click={() => revokeToken(token._id)}>Revoke</Button>
              {:else}
                <span class="revoked">Revoked</span>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/if}
</div>

<style>
  .page {
    max-width: 900px;
    margin: 2rem auto;
    font-family: var(--recipeFont);
    line-height: 1.6;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
  h2 {
    font-size: 2rem;
    margin-bottom: 0.25rem;
    font-family: var(--uiFont);
  }
  h3 {
    font-size: 1.5rem;
    font-family: var(--uiFont);
    margin-bottom: 0.5rem;
  }
  .panel {
    border: 1px solid var(--light-underline);
    padding: 1.5rem;
    margin-top: 1.5rem;
    background: var(--light-bg);
  }
  .scope-toggle {
    display: grid;
    gap: 0.5rem;
    padding: 0.25rem 0;
  }
  .callout {
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    border: 1px solid var(--medium-underline);
    background: #fffdf2;
  }
  .copy-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .copy-row code {
    background: #f0f2f8;
    padding: 0.3rem 0.5rem;
    border-radius: 4px;
  }
  .copy-column textarea {
    width: 100%;
    font-family: var(--uiFont);
    font-size: 0.95rem;
    padding: 0.75rem;
    border-radius: 6px;
    border: 1px solid var(--light-underline);
    background: #ffffff;
  }
  .copy-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }
  .copy-status {
    font-weight: bold;
  }
  .field {
    margin-bottom: 1rem;
  }
  .token-list {
    display: grid;
    gap: 1rem;
  }
  .token-row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid var(--light-underline);
    background: #fff;
  }
  .token-meta {
    display: grid;
    gap: 0.25rem;
  }
  .token-label {
    font-weight: bold;
  }
  .token-preview {
    font-family: var(--uiFont);
  }
  .token-details {
    font-size: 0.9rem;
    color: var(--grey);
  }
  .revoked {
    font-weight: bold;
    color: var(--grey);
    align-self: center;
  }
  .error {
    margin-top: 1rem;
    color: #b00020;
  }
</style>
