<script>
  import { registerBuild } from "../../stores/debugStore";
  registerBuild(Number("BUILD_MS"));
  import Button from "./Button.svelte";
  let b;
  export let invisible = false; // useful if we want to take up the normal space in our layout whether active or not
  export let inverse = false;
  export let icon;
  export let bare = false;
  export let toggle = false;
  export let toggled = false;
  export let iconSize = undefined;
  export let fontSize = undefined;
  export let small = undefined;
  export let left = false;
  export let compact = false;
  export let busy = false;
  export let disabled = false;
  export let width = undefined;
  export let ariaLabel = undefined;
  export let tt = "";

  const autoLabel = {
    close: "close",
    delete: "delete",
  };

  if (!ariaLabel) {
    ariaLabel = autoLabel[icon] || (icon && icon.replace("_", " "));
  }

  export function focus() {
    b.focus();
  }
  function getStyle() {
    if (iconSize) {
      return `font-size: ${iconSize};`;
    } else if (fontSize) {
      return `font-size: ${fontSize};`;
    } else if (small) {
      return "font-size: 12px";
    } else {
      return "";
    }
  }
</script>

<Button
  {bare}
  {busy}
  {disabled}
  {inverse}
  {invisible}
  {toggle}
  {toggled}
  {small}
  {compact}
  {width}
  {ariaLabel}
  {tt}
  rtl={left}
  on:click
  on:focus
  on:blur
  on:keypress
  on:keyup
  bind:this={b}
>
  <span class:left class:compact><slot /></span>
  <i
    class="material-icons"
    class:compact
    class:left
    style={getStyle(small, iconSize, fontSize)}
  >
    {icon}
  </i>
</Button>

<style>
  span {
    margin-right: 6px;
  }
  .left {
    margin-left: 6px;
    margin-right: 0;
  }
  .compact,
  span.left:empty,
  span:empty {
    margin: 0;
  }
</style>
