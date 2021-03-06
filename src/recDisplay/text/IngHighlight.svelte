<script>
  import { scrollIntoView } from "../../utils/scrolling.js";
  export let target;
  import { getContext } from "svelte";
  import { writable } from "svelte/store";
  export let content = "";
  export let highlightedIngredientFromProps = undefined;
  export let useStyle = false;

  let highlightedIngredient =
    highlightedIngredientFromProps || getContext("highlightedIngredient");

  function toggleHighlight() {
    if ($highlightedIngredient.highlighted != target) {
      $highlightedIngredient.highlighted = target;
      $highlightedIngredient.scrolledTextFor = target; // don't scroll after we click :)
    } else {
      $highlightedIngredient.highlighted = undefined;
    }
  }
  function hoverOn() {
    $highlightedIngredient.hover = target;
  }
  function hoverOff() {
    $highlightedIngredient.hover = undefined;
  }

  // We might eventually care about de-registering, but it probably doesn't matter much.
  // The UI "problem" not deregistering will create is just that ingredients in the ing-list
  // will highlight after we've deleted some text with them. Not that big a deal I think.
  $highlightedIngredient.active = [...$highlightedIngredient.active, target];

  import { derived } from "svelte/store";
  let highlightedItem = derived(
    highlightedIngredient,
    ($highlightedIngredient) => $highlightedIngredient.highlighted
  );

  function scroll(node, highlighted) {
    return {
      update(highlighted) {
        if (
          highlighted === target &&
          $highlightedIngredient.scrolledTextFor !== target
        ) {
          if (scrollIntoView(node)) {
            // it returns true if successful...
            $highlightedIngredient.scrolledTextFor = target;
          }
        }
      },
    };
  }

  function getStyle(hover, highlight) {
    if (useStyle) {
      if (hover) {
        return `
             background-color: #ffffdd;
             color: #333;
`;
      } else if (highlight) {
        return `background-color: #ffffad;
                 color: #333;
                 
                 `;
      }
    }
  }
</script>

<span
  class:hover={target == $highlightedIngredient.hover}
  class:highlight={target == $highlightedIngredient.highlighted}
  on:click={toggleHighlight}
  on:mouseover={hoverOn}
  on:mouseleave={hoverOff}
  use:scroll={$highlightedItem}
  style={getStyle(
    $highlightedIngredient.hover == target,
    $highlightedIngredient.highlighted == target
  )}
>
  <slot />
  {content}
</span>

<style>
  .hover {
    background-color: var(--note-light-bg);
    color: var(--note-light-fg);
  }

  .highlight {
    background-color: var(--note-bg);
    color: var(--note-fg);
  }
  span {
    font-weight: 900;
    color: #444;
  }
</style>
