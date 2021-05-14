<script>
  import { tick } from "svelte";
  import { fly, slide, fade } from "svelte/transition";
  import { flip } from "svelte/animate";
  import { quintOut } from "svelte/easing";
  import { IconButton, Underline } from "../index";
  import { unique } from "../../utils/uniq";

  export let value;
  export let onSelect;
  export let placeholder;
  export let options = [];

  let menu = [];
  let matches = [];
  let currentMatch = -1;
  let showMenu = false;
  let showAll;

  const TYPING = 1;
  const MENU = 2;

  let mode = TYPING;
  $: {
    if (!showMenu) {
      currentMatch = -1;
    }
  }

  function toggleMenu() {
    if (showMenu && showAll) {
      showMenu = false;
      showAll = false;
    } else if (showMenu && !showAll) {
      showAll = true;
    } else {
      showMenu = true;
      showAll = true;
    }
    inputRef.focus();
    mode = MENU;
  }

  function doSelect(v) {
    value = v;
    showMenu = false;
    showAll = false;
    justMatched = true;
    if (onSelect) {
      onSelect(v);
    }
  }

  function updateMatches() {
    matches = options.filter(
      (m) => m.toLowerCase().indexOf(value.toLowerCase()) > -1
    );
    if (showAll) {
      let otherOptions = options.filter((o) => matches.indexOf(o) == -1);
      menu = [...matches, ...otherOptions];
    }
  }

  $: {
    if (value) {
      matches = options.filter(
        (m) => m.toLowerCase().indexOf(value.toLowerCase()) > -1
      );
      if (showAll) {
        let otherOptions = options.filter((o) => matches.indexOf(o) == -1);
        matches = [...matches, ...otherOptions];
      }
    }
  }

  function highlight(m) {
    return m.replace(new RegExp(`(${value})`, "i"), `<u>$1</u>`);
  }

  async function setValueAfterTick(value) {
    await tick();
    doSelect(value);
    showMenu = false;
    currentMatch = -1;
    updateMatches();
  }

  const TAB = 9;
  const RET = 13;
  const SPACE = 32;

  function onKeyUp(event) {
    updateMatches();
  }
  function onKeydown(event) {
    console.log(
      "onKeydown...",
      (mode == TYPING && "Typing mode") || "Menu mode"
    );
    // RETURN means select, regardless of mode...
    if (event.keyCode == RET) {
      event.preventDefault();
      if (showMenu && currentMatch > -1 && matches.length > currentMatch) {
        value = matches[currentMatch];
      }
      setValueAfterTick(value);
      event.preventDefault();
      return;
    }
    // SPACEBAR with menu up selects... OR TAB with menu + only one match
    if (
      event.keyCode == SPACE ||
      (event.keyCode == TAB && mode == TYPING && matches.length == 1)
    ) {
      if (showMenu && currentMatch > -1 && matches.length > currentMatch) {
        value = matches[currentMatch];
        setValueAfterTick(value);
        event.preventDefault();
        return;
      }
    }
    if (mode == MENU) {
      // in menu mode... toggle up and down the whole menu...
      if ((event.keyCode == TAB && event.shiftKey) || event.keyCode == 38) {
        // up
        currentMatch -= 1;
        event.preventDefault();
      } else if (event.keyCode == TAB || event.keyCode == 40) {
        //down
        showMenu = true;
        event.preventDefault();
        currentMatch += 1;
      }
      if (
        currentMatch >= menu.length ||
        currentMatch < 0 ||
        event.keyCode == 27
      ) {
        showMenu = false;
        currentMatch = -1;
        mode = TYPING;
      }
    } else if (mode == TYPING) {
      if (event.keyCode == 40 || event.keyCode == 38) {
        showMenu = true;
        mode = MENU;
        event.preventDefault();
        currentMatch = 0;
      } else if (event.target.value && event.keyCode == TAB && event.shiftKey) {
        if (!showMenu) {
          return;
        }
        currentMatch -= 1;
        if (currentMatch > -1) {
          event.preventDefault();
        } else {
          /* else if (matches) {
           *     //currentMatch = matches.length - 1
           *     //console.log("Typing shift tab... set match to last one",currentMatch)
           *     //event.preventDefault()
           *
           * } */
          showMenu = false;
        }
      } else if (event.keyCode == TAB) {
        if (!showMenu) {
          return;
        }
        // regular tab...
        currentMatch += 1;
        if (currentMatch >= matches.length) {
          showMenu = false;
        } else {
          event.preventDefault();
        }
      } else if (event.keyCode == 27) {
        showMenu = false;
      } else {
        setTimeout(() => {
          // Ok -- otherwise we have changed the value...
          if (!showMenu) {
            if (event.target.value && matches.length) {
              showMenu = true;
              currentMatch = 0;
            }
          } else {
            if (!event.target.value) {
              showMenu = false;
              currentMatch = -1;
            }
          }
        }, 10);
      }
    } else {
      console.log("What mode are we in?");
    }
  }

  let focused;
  let inputRef;
  let inputHeight;
  function checkFocus() {
    focused = inputRef == document.activeElement;
  }
</script>

{#if showMenu}
  <div class="screen" on:click={() => (showMenu = false)} />
{/if}
<Underline grow={false}>
  <span
    class="cmb"
    style={`--inputHeight:${inputHeight}px`}
    bind:clientHeight={inputHeight}
  >
    <input
      on:blur={checkFocus}
      on:focus={checkFocus}
      bind:this={inputRef}
      on:keydown={onKeydown}
      on:keyup={onKeyUp}
      bind:value
      {placeholder}
    />
    <IconButton
      class="icon"
      on:click={toggleMenu}
      icon={(showMenu && focused && "arrow_drop_up") || "arrow_drop_down"}
      small={true}
      bare={true}
    />
    {#if showMenu}
      <ul class="menu" transition:slide>
        {#each unique(matches) as match, i (match)}
          <li
            key={match}
            class:current={currentMatch == i}
            on:click={() => doSelect(match)}
            transition:fly
            animate:flip={{ delay: 250, duration: 250, easing: quintOut }}
          >
            {@html highlight(match, value)}
          </li>
        {/each}
        {#if showAll}
          {#each unique(options) as option}
            {#if matches.indexOf(option) == -1}
              <li
                transition:fly
                on:click={() => doSelect(option)}
                class:match={value.indexOf(option) > -1}
              >
                {option}
              </li>
            {/if}
          {/each}
        {/if}
      </ul>
    {/if}
  </span>
</Underline>

<style>
  .cmb {
    position: relative;
    display: inline-flex;
  }
  .current,
  li:active {
    background-color: var(--accent-fg);
    color: var(--accent-bg);
    font-weight: bold;
  }
  li:hover {
    background-color: var(--accent-fg);
    color: var(--accent-bg);
    font-weight: bold;
  }

  li {
    transition: all 300ms;
    padding: 8px;
    border-top: 1px solid var(--light-underline);
  }
  .screen {
    z-index: 10;
    background-color: transparent;
    pointer-events: none;
    position: fixed;
    width: 100vw;
    height: 100vh;
    top: 0;
    left: 0;
  }
  ul {
    padding-left: 0px;
    width: 100%;
    position: absolute;
    top: var(--inputHeight);
    background-color: white;
    z-index: 999;
  }
</style>
