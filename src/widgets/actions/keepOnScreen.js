/** Dispatch event on click outside of node */
/**
 * @param  {Element} node
 */
export function keepOnScreen(node) {
  console.log("kos says width: ", node.clientWidth);
  let currentStyle = getComputedStyle(node);
  let rect = node.getBoundingClientRect();
  let forceFixed = false;
  let top = rect.top;
  let left = rect.left;
  if (rect.right > window.innerWidth) {
    console.log("off the right");
    forceFixed = true;
    if (rect.width > window.innerWidth) {
      node.setAttribute("style", "width:100vw;" + node.currentStyle);
      left = 0;
    } else {
      let diff = rect.right - window.innerWidth;
      left = rect.left - diff;
    }
  }

  if (rect.bottom > window.innerHeight) {
    console.log("off bottom");
    forceFixed = true;
    if (rect.height > window.innerHeight) {
      node.setAttribute(
        "style",
        "height:calc(100vh-10px);" + node.currentStyle
      );
      top = 5;
    } else {
      let diff = rect.bottom - window.innerHeight;
      top = rect.top - diff;
    }
  }

  if (forceFixed) {
    console.log("set fixed", top, left);
    node.setAttribute(
      "style",
      `position:fixed;top:${top}px;left:${left}px;` + node.currentStyle
    );
  }

  return {
    destroy() {},
  };
}
