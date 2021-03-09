<svelte:options accessors />

<script>
  // properties you will want to pass through tooltip.js
  export let content = "";
  export let interactive;
  export let width = 120;
  export let pad = 5;
  export let arrow = 4;
  export let target;
  // Properties set by tooltip.js as it works
  export let show = false;
  let x = 0;
  let y = 0;
  let topMode, rightMode, leftMode;

  import { fade } from "svelte/transition";

  $: show && target && adjustPosition();
  let ttwidth;
  $: ttwidth = width; // rename for convenience... (since getBoundingClientRect returns {width})

  function adjustPosition() {
    let {
      top,
      bottom,
      left,
      right,
      width,
      height,
    } = target.getBoundingClientRect();
    // vertical component...
    let bottomRoom = window.innerHeight - bottom;
    if (bottomRoom < top) {
      y = top;
      topMode = true
    } else {
      y = bottom;
      topMode = false;
    }
    //horizontal component

    let rightRoom = window.innerWidth - right;
    let spillOver = (ttwidth - width) / 2;

    if (spillOver < left && spillOver < rightRoom) {
      // center
      leftMode = false;
      rightMode = false;
      x = (left + right) / 2;
    } else if (rightRoom > left) {
      // right
      rightMode = true;
      leftMode = false;
      x = left;
    } else {
      //"left";
      leftMode = true;
      rightMode = false;
      x = right;
    }
  }
</script>

{#if show}
  <div
    style={`position:fixed;z-index:99;top:${y}px;left:${x}px;--width:${width}px;--pad:${pad}px;--arrow:${arrow}px`}
  >
    <div
      class="tip"
      class:interactive
      in:fade={{ delay: 100, duration: 200 }}
      out:fade={{ delay: 400, duration: 450 }}
      class:top={topMode}
      class:bottom={!topMode}
      class:right={rightMode}
      class:left={leftMode}
      class:center={!leftMode && !rightMode}
    >
      <slot />{content}
    </div>
  </div>
{/if}

<style>
  .tip {
    pointer-events: none;
    background-color: var(--accent-bg, #555);
    color: var(--accent-fg, #fff);
    text-align: center;
    border-radius: 6px;
    padding: 5px;
    position: absolute;
    z-index: 99;
    font-size: small;
    width: var(--width);
    white-space: normal;
  }
  .tip :global(a) {
    color: var(--accent-fg, #fff);    
  }
  .tip.interactive {
      pointer-events: unset;
  }
  .top {
    bottom: var(--pad);
  }
  .bottom {
    top: var(--pad);
  }
  .left {
    right: var(--pad);
  }
  .right {
    left: var(--pad);
  }
  .center {
    left: calc(var(--width) / -2);
    text-align: center;
  }
  /* arrows */
  .tip::before {
    content: "";
    position: absolute;
    width: 0px;
    height: 0px;
  }
  .top::before {
    bottom: calc(var(--arrow) * -2);
    left: calc(var(--width) / 2 - var(--arrow));
    border-color: var(--accent-bg, #555) transparent transparent transparent;
    border-width: var(--arrow);
    border-style: solid;
  }
  .bottom::before {
    top: calc(var(--arrow) * -2);
    left: calc(var(--width) / 2 - var(--arrow));
    border-color: transparent transparent var(--accent-bg, #555) transparent;
    border-width: var(--arrow);
    border-style: solid;
  }
  .right::before {
    left: calc(var(--width) / 3 - var(--arrow));
  }
  .left::before {
    left: calc(var(--width) * 2 / 3 - var(--arrow));
  }

  @media print {
    div {
      display: none;
    }
  }
</style>
