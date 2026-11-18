<script>
  // A recipe text body, edited in place.
  //
  // The rule that keeps stored HTML safe: nothing is written back unless the
  // user types (or formats, or pastes) in this body. Showing it, focusing it
  // and leaving it change nothing. What the region shows is the body run
  // through the same sanitizer the recipe view uses; what it writes, once
  // edited, is the region's HTML cleaned with the same rules.
  import { onMount } from "svelte";
  import { Button, Inline } from "contain-css-svelte";
  import { bodyHtml, sanitizeBody } from "../app/recipeText.js";

  let { body, onchange, label = "Text", placeholder = "First, chop the onion…" } = $props();
  let el = $state();

  // Filled once: after that the region belongs to the person typing. (A
  // revert remounts this component.)
  onMount(() => { el.innerHTML = bodyHtml(typeof body === "string" ? body : ""); });

  const emit = () => onchange?.(sanitizeBody(el.innerHTML));

  function format(command) {
    el.focus();
    document.execCommand(command, false);
    emit();
  }

  function onpaste(e) {
    const html = e.clipboardData?.getData("text/html");
    const text = e.clipboardData?.getData("text/plain") ?? "";
    e.preventDefault();
    const clean = html ? sanitizeBody(html) : bodyHtml(text);
    document.execCommand("insertHTML", false, clean);
    emit();
  }

  function onkeydown(e) {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === "b") { e.preventDefault(); format("bold"); }
    else if (mod && e.key.toLowerCase() === "i") { e.preventDefault(); format("italic"); }
  }
</script>

<div class="rich-text">
  <Inline>
    <!-- mousedown would take the selection away from the text: keep it. -->
    <Button aria-label="Bold" onmousedown={(e) => e.preventDefault()} onclick={() => format("bold")}><b>B</b></Button>
    <Button aria-label="Italic" onmousedown={(e) => e.preventDefault()} onclick={() => format("italic")}><i>I</i></Button>
    <Button aria-label="Bulleted list" onmousedown={(e) => e.preventDefault()} onclick={() => format("insertUnorderedList")}>• List</Button>
    <Button aria-label="Numbered list" onmousedown={(e) => e.preventDefault()} onclick={() => format("insertOrderedList")}>1. List</Button>
  </Inline>
  <div
    class="recipe-prose rich-text-body"
    bind:this={el}
    contenteditable="true"
    role="textbox"
    tabindex="0"
    aria-multiline="true"
    aria-label={label}
    data-placeholder={placeholder}
    oninput={emit}
    onfocus={() => document.execCommand?.("defaultParagraphSeparator", false, "p")}
    {onpaste}
    {onkeydown}
  ></div>
</div>
