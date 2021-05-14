<script>
  export let stackSidesAt = 700;
  export let maxWidth = 1200;
  export let leftWidth = 300;
  export let maxWidthLeft = undefined;
  export let maxWidthRight = undefined;
  export let forceLeftFlyIn = false;

  import FullHeight from "./FullHeight.svelte";
  import { IconButton } from "../";
  import { registerBuild } from "../../stores/debugStore";
  registerBuild(Number("BUILD_MS"));
  import { onMount } from "svelte";
  import { Resizer } from "../";
  let stackMode = false;
  let ref;
  let leftSideRef;
  let leftOffScreen = false;

  let initialLeftWidth;
  import { watchResize } from "svelte-watch-resize";
  var observer;
  onMount(() => {
    observer = new IntersectionObserver(
      (entries) => {
        if (!leftSideFlyIn) {
          if (entries[0].isIntersecting === true) {
            leftOffScreen = false;
          } else {
            leftOffScreen = true;
          }
        } else {
          /* If we scroll back up, put the ingredients back where they started */
          if (!entries[0].isIntersecting) {
            leftSideFlyIn = false;
            leftSideRef.style = "";
          }
        }
      },
      { threshold: [0.2] }
    );
  });

  function handleResize() {
    if (ref.clientWidth < Number(stackSidesAt)) {
      stackMode = true;
    } else {
      stackMode = false;
    }
  }

  let leftSideFlyIn = false;
  let flyDistance = 0;
  let extraFlyInPad = 55;

  $: !stackMode && leftSideRef && resetLeftSide();

  function resetLeftSide() {
    leftSideFlyIn = false;
    leftSideRef.style = "";
  }

  function toggleLeftSideFlyIn() {
    if (!leftSideRef || !leftSideRef.parentElement) {
      return;
    }
    leftSideFlyIn = !leftSideFlyIn;
    flyDistance = leftSideRef.parentElement.scrollTop;
    leftSideRef.style =
      (leftSideFlyIn &&
        `
        transform: translateY(${flyDistance + extraFlyInPad}px);
        border: 3px solid var(--accent-bg);
        background-color: var(--white);
        opacity: 1;
        position: relative;
        z-index: 2;
        color: var(--black);

    `) ||
      "";
  }

  $: {
    if (leftSideRef) {
      observer.observe(leftSideRef);
    }
  }

  $: forceLeftFlyIn && stackMode && forceFlyIn();

  function forceFlyIn() {
    if (!leftSideFlyIn) {
      toggleLeftSideFlyIn();
      forceLeftFlyIn = false;
    }
  }
</script>

<FullHeight>
  <div
    use:watchResize={handleResize}
    bind:this={ref}
    class="sidebyside"
    class:stackMode
    style={`
                --max-width:${maxWidth};
                --max-left:${maxWidthLeft};
                --max-right:${maxWidthRight};
                `}
  >
    <div
      class="side l"
      style={!stackMode && `--left-width:${leftWidth}px`}
      bind:this={leftSideRef}
    >
      <div class="head scrollHead">
        <slot name="leftHead" />
      </div>
      <div class="scrollBox">
        <slot name="left" />
      </div>
    </div>
    {#if !stackMode}
      <Resizer
        onStart={({ x, y }) => {
          initialLeftWidth = leftSideRef.clientWidth;
        }}
        onDrag={(dx) => {
          leftWidth = initialLeftWidth - dx;
        }}
      />
    {/if}
    <div class="mobileHandleWrap" class:showHandle={leftOffScreen}>
      {#if !leftSideFlyIn}
        <IconButton
          icon="arrow_drop_down_circle"
          on:click={toggleLeftSideFlyIn}
          tooltip="Pop down content"
        >
          <slot name="leftHandle" />
        </IconButton>
      {:else}
        <IconButton icon="close" on:click={toggleLeftSideFlyIn} />
      {/if}
    </div>
    <div class="side r">
      <div class="head scrollHead">
        <slot name="rightHead" />
      </div>
      <div class="scrollBox">
        <slot name="right" />
      </div>
    </div>
  </div>
</FullHeight>

<style>
  /* First child of head gets bottom border - whatever element they put in slot */
  .head > :global(*) {
    border-bottom: 1px solid var(--grey);
    margin: 0;
    padding-bottom: 3px;
  }
  .side {
    display: flex;
    flex-direction: column;
    padding: var(--panel-pad, 11px);
  }
  .side .scrollBox {
    flex-grow: 1;
  }
  .sidebyside {
    display: flex;
    width: min(var(--max-width), 100vw);
    margin: auto;
    max-height: 100%;
    flex-grow: 1;
  }
  .sidebyside.stackMode {
    display: block;
    overflow-y: scroll;
  }
  .scrollBox {
    overflow-y: scroll;
  }
  .stackMode .scrollBox {
    overflow-y: unset;
  }

  .scrollBox::-webkit-scrollbar {
    width: 5px;
  }
  .stackMode .scrollBox::-webkit-scrollbar {
    width: 0px;
  }
  .scrollBox::-webkit-scrollbar-thumb {
    border-radius: 10px;
    background-color: var(--accent-bg);
  }

  .l {
    max-width: var(--max-left);
    padding-left: var(--side-pad);
    width: var(--left-width);
  }
  .r {
    max-width: var(--max-right);
    flex-grow: 1;
    padding-right: var(--side-pad);
  }
  .stackMode .l,
  .stackMode .r {
    height: auto;
    margin: auto;
  }

  .stackMode .l {
    transition: all 200ms; /* Note: this number interacts with the delay on scrolling in Ingredient.svelte */
  }

  .mobileHandleWrap {
    position: sticky;
    top: 10px;
    height: 0;
    display: block;
    text-align: right;
    z-index: 3;
  }

  .mobileHandleWrap {
    display: none;
    transition: opacity 300ms;
    z-index: 3;
  }
  .stackMode .mobileHandleWrap {
    opacity: 0;
    display: block;
    margin-right: var(--side-pad);
  }
  .showHandle.mobileHandleWrap {
    opacity: 1;
  }

  @media print {
    .scrollBox {
      overflow: visible;
    }
  }
</style>
