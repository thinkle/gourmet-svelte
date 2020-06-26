<script>
 export let invisible=false; // useful if we want to take up the normal space in our layout whether active or not
 export let inverse=false;
 export let bare=false;
 export let busy=false;
 export let toggle=false;
 export let toggled=false;
 export let rtl=false;
 export let width=undefined;
 export let fontSize=undefined;
 export let small=undefined;
 export let disabled=undefined;
 export let compact=false; /* No padding, no margin */
 export let ariaLabel=undefined;

 export function focus () {
     b.focus()
 }
 let b;
</script>
<button
    class:disabled
    class:compact
    class:rtl
    class:bare
    class:inverse
    class:invisible
    class:toggle
    class:toggled
    class:busy
    class:small
    style="{`--fontSize:${fontSize};--button-width:${width}`}"
    class:customSize={fontSize}
    on:click
    on:focus
    on:blur
    on:keypress
    on:keyup
    bind:this="{b}"
    disabled="{disabled||busy}"
    aria-label="{ariaLabel}"
>
    {#if toggle}
        <span class:toggled></span>
    {/if}
    <slot/>
</button>
<style>
 .inverse {
     background-color: var(--light-fg);
     color: var(--light-bg);
 }
 button {
     font-family : var(--uiFont);
     display: inline-flex;
     justify-content: center;
     align-items: center;
     border-radius: 10px;
     border-width: 1px;
     border-style: solid;
     padding: 5px;
     transition: all 300ms;
     width: var(--button-width);
 }
 
 button.customSize {
     font-size: var(--fontSize);
 }
 
 button.small i {
     font-size: var(--small);
 }
 
 button.bare {
     border: none;
     background-color: transparent;
 }

 button:hover {
     color: var(--light-fg);
     background: var(--light-bg) radial-gradient(circle, transparent 1%, var(--light-bg) 1%) center/15000%;
 }
 .inverse:hover {
     color: var(--light-bg);
     background: var(--light-fg) radial-gradient(circle, transparent 1%, var(--light-fg) 1%) center/15000%;
 }
 .inverse:active {
     background-color: var(--medium-fg);
     color: var(--medium-bg);
     background-size: 100%;
     transition: background 0s;
 }

 button:active {
     background-color: var(--medium-bg);
     color: var(--medium-fg);
     background-size: 100%;
     transition: background 0s;
 }
 .invisible {
     visibility: hidden;
 }

 /* outside circle of toggle */
 span {
     display: inline-block;
     margin-right: 6px;
     width: 36px;
     height: 24px;
     border-radius: 12px;
     border: 1px solid var(--medium-fg);
     background-color: var(--medium-bg);
     transition: all;
 }
 span.toggled {
     background-color: var(--light-bg);
 }
 /* Inside circle of toggle */
 span::after {
     content: " ";
     display: inline-block;
     background-color: var(--medium-fg);
     border-color: var(--medium-bg);
     border-radius: 50%;
     height: 24px;
     width: 24px;
     box-sizing: border-box;
     text-align: left;
     position: relative;
     left: -8px;
     top: 0;
     transition: all 300ms;
 }

 span.toggled::after {
     left:8px;
     background-color: var(--light-fg);
 }
 .rtl {
     flex-direction: row-reverse;
 }
 .rtl span {
     margin-right: 0;
     margin-left: 6px;
 }
 .compact {
     margin: 0;
     padding: 0;
 }
 .compact span {
     margin: 0;
 }
 .disabled,
 .busy,
 .disabled:hover,
 .busy:hover {
     color: var(--grey);
 }
 .busy {
     cursor: wait;
 }


</style>
