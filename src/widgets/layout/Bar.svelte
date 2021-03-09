<script>
  export let large = false;
  export let scrollAll = undefined;
  export let scrollLeft = undefined;
  export let scrollRight = undefined;
  export let scrollCenter = undefined;
  export let growLeft = undefined;
  export let growRight = undefined;
  export let maxWidth = undefined;
  export let alignTop;
  export let z = 0;
  export let style = "";
  function stopEvents(event) {
    event.stopPropagation();
  }

  function getStyle() {
    if (maxWidth) {
      style = `width: min(${maxWidth},calc(100vw)); margin: auto; ${style};`;
    }
    if (z) {
      style = `z-index: ${z}; ${style}`;
    }
    return style;
  }
</script>

<div
  class:alignTop
  class:large
  class="bar"
  style={getStyle(maxWidth)}
  class:scroll={scrollAll}
  on:click={stopEvents}
>
  <div class="left" class:scroll={scrollLeft} class:grow={growLeft}>
    <slot name="left" />
  </div>
  <div class="center" class:scroll={scrollCenter}>
    <slot name="center" />
  </div>
  <div class="right" class:scroll={scrollRight} class:grow={growRight}>
    <slot name="right" />
  </div>
</div>

<style>
  
  .grow {
    flex-grow: 3;
  }

  .bar > div {
    flex-shrink: 1;
    max-width: 100%;
  }

  .bar {
    display: flex;
    flex-shrink: 0;
    min-height: var(--bar-height);
    padding: var(--bar-top, 0.5rem) var(--side-pad, 1rem);
    line-height: 1.5;
    align-items: center;
    white-space: nowrap;
  }
  .bar.large {
    min-height: calc(var(--bar-height) * 2);
  }
  .bar.alignTop {
    align-items: start;
  }
  .bar > div > :global(div) {
    display: flex;
    flex-grow: 1;
  }
  .bar > div {
    display: flex;
  }

  .center {
    margin-left: auto;
    margin-right: auto;
  }

  .right {
    margin-left: auto;
  }
  .left {
    margin-right: auto;
  }
  .scroll {
    overflow-x: scroll;
  }

  .right :global(button) {
    margin-left: 4px;
  }
  .left :global(button) {
    margin-right: 4px;
  }
  .center :global(button) {
    margin-left: 2px;
    margin-right: 2px;
  }

  @media screen and (max-width: 920px) {
    .bar {
      font-size: 60%;
    }
  }
</style>
