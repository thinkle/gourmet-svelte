import Tooltip from "./Tooltip.svelte";

function tooltip(node, props) {
  if (!node) {
    return;
  }
  if (!props.content) {
    return;
  }
  let t;
	props.target = node
  // For reasons I still don't understand, adding a timeout avoids a bug where
  // adding tooltips in scrolling cards in RecipeList leads to an infinite loop...
  setTimeout(() => {
    //let body = document.querySelector('body')
    t = new Tooltip({ target: node, accessors: true, props });
    node.addEventListener("mouseover", () => (t.show = true));
    node.addEventListener("mouseleave", () => (t.show = false));
    node.addEventListener("focusout", () => (t.show = false));

  }, 0);

  return {
    destroy() {
      if (t) {
        t.$destroy();
      }
    },
  };
}

export { tooltip };
