<script>
  // Title, categories, rating, yields, times and sources. Each writes to the
  // draft only when the user changes it; missing fields are shown empty.
  import { Button, CircleButton, FormItem, FormProvider, Fieldset, Input, Inline } from "contain-css-svelte";
  import CategoryTag from "../../../components/CategoryTag.svelte";
  import StarInput from "../../../components/StarInput.svelte";
  import { listView, parseDuration } from "../../../app/recipeEdit.js";
  import { fmtTime } from "../../../app/lib.js";
  import { floatToFrac, fracToFloat } from "../../../utils/numbers.js";

  /** @type {{ edit: import("../../../app/editState.svelte.js").RecipeEdit, suggestions?: string[] }} */
  let { edit, suggestions = [] } = $props();
  const d = $derived(edit.draft);
  const listId = `cats-${Math.random().toString(36).slice(2)}`;

  const cats = $derived(listView(d.categories, "categories"));
  const yields = $derived(listView(d.yields, "yields"));
  const times = $derived(listView(d.times, "times"));
  const sources = $derived(listView(d.sources, "sources"));
  const unused = $derived(suggestions.filter((s) => !cats.some((c) => c.name === s)));

  let newCat = $state("");
  function addCategory() {
    const names = newCat.split(",").map((s) => s.trim()).filter(Boolean);
    if (!names.length) return;
    const list = edit.list("categories");
    for (const name of names) if (!list.some((c) => c.name === name)) list.push({ name });
    newCat = "";
  }
  function catKey(e) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addCategory(); }
    else if (e.key === "Backspace" && !newCat && cats.length) edit.list("categories").pop();
  }

  // Change one key of one row, leaving the row's other keys as stored.
  const setRow = (field, i, key, value) => { edit.list(field)[i][key] = value; };

  // "1 1/2", "2-3" or "1.5" to a number; anything else leaves the amount alone.
  function readAmount(s) {
    const t = String(s).trim();
    if (!t) return undefined;
    if (/^\d*\.\d+$/.test(t)) return Number(t);
    const n = fracToFloat(t);
    return typeof n === "number" && Number.isFinite(n) ? n : null;
  }
  function setYieldAmount(i, s) {
    const n = readAmount(s);
    if (n === null) return;
    const row = edit.list("yields")[i];
    if (n === undefined) delete row.amount;
    else if (n !== row.amount) row.amount = n;
  }
  function setTimeText(i, text) {
    const row = edit.list("times")[i];
    if (row.text === text) return;
    row.text = text;
    const seconds = parseDuration(text);
    if (seconds) row.seconds = seconds;
  }
</script>

<FormProvider layout="above" fullWidth>
  <div class="details-editor">
    <FormItem>
      {#snippet label()}Title{/snippet}
      <Input value={d.title ?? ""} placeholder="What is it called?" oninput={(e) => edit.set("title", e.currentTarget.value)} />
    </FormItem>

    <Fieldset>
      {#snippet legend()}Categories{/snippet}
      <Inline wrap>
        {#each cats as c, i}
          <CategoryTag name={c.name} onclose={() => edit.list("categories").splice(i, 1)} />
        {/each}
        <Input bind:value={newCat} list={listId} placeholder="Add a category" aria-label="Add a category"
          onkeydown={catKey} onchange={() => { if (unused.includes(newCat.trim())) addCategory(); }} onblur={addCategory} />
      </Inline>
      <datalist id={listId}>{#each unused as s}<option value={s}></option>{/each}</datalist>
    </Fieldset>

    <Fieldset>
      {#snippet legend()}Rating{/snippet}
      <StarInput value={d.rating} onchange={(v) => edit.set("rating", v)} />
    </Fieldset>

    <Fieldset>
      {#snippet legend()}Makes{/snippet}
      {#each yields as y, i}
        <Inline>
          <Input value={floatToFrac(y.amount, { unicodeFractions: false })} placeholder="4" aria-label="Amount"
            onchange={(e) => setYieldAmount(i, e.currentTarget.value)} />
          <Input value={y.unit ?? ""} placeholder="servings" aria-label="Unit" oninput={(e) => setRow("yields", i, "unit", e.currentTarget.value)} />
          <CircleButton aria-label="Remove" onclick={() => edit.list("yields").splice(i, 1)}>×</CircleButton>
        </Inline>
      {/each}
      <Button onclick={() => edit.list("yields").push({ unit: "" })}>Add a yield</Button>
    </Fieldset>

    <Fieldset>
      {#snippet legend()}Times{/snippet}
      {#each times as t, i}
        <Inline wrap>
          <Input value={t.name ?? ""} placeholder="Bake" aria-label="What" oninput={(e) => setRow("times", i, "name", e.currentTarget.value)} />
          <Input value={t.text ?? (t.seconds ? fmtTime(t.seconds) : "")} placeholder="1 hr 15 min" aria-label="How long"
            onchange={(e) => setTimeText(i, e.currentTarget.value)} />
          <span class="understood" title="How Gourmet read this time">{t.seconds ? fmtTime(t.seconds) : "—"}</span>
          <CircleButton aria-label="Remove" onclick={() => edit.list("times").splice(i, 1)}>×</CircleButton>
        </Inline>
      {/each}
      <Button onclick={() => edit.list("times").push({ name: "", text: "", seconds: 0 })}>Add a time</Button>
    </Fieldset>

    <Fieldset>
      {#snippet legend()}Sources{/snippet}
      {#each sources as s, i}
        <Inline wrap>
          <Input value={s.name ?? ""} placeholder="Grandma's notebook" aria-label="Source name" oninput={(e) => setRow("sources", i, "name", e.currentTarget.value)} />
          <Input type="url" value={s.url ?? ""} placeholder="https://…" aria-label="Link" oninput={(e) => setRow("sources", i, "url", e.currentTarget.value)} />
          <CircleButton aria-label="Remove" onclick={() => edit.list("sources").splice(i, 1)}>×</CircleButton>
        </Inline>
      {/each}
      <Button onclick={() => edit.list("sources").push({ name: "", url: "" })}>Add a source</Button>
    </Fieldset>
  </div>
</FormProvider>
