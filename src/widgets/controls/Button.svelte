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
 export let tt=undefined;

 export function focus () {
     b.focus()
 }
 let b;
import { unique } from '../../utils/uniq.js';
 import {tooltip} from './tooltip.js';
 let rulerDiv;
$: if (rulerDiv) {
    console.log('width=',rulerDiv.clientWidth);
    if (!width && rulerDiv && rulerDiv.clientWidth) {
        width = rulerDiv.clientWidth + 'px';
    }
}
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
    aria-label="{ariaLabel||tt}"
    use:tooltip="{{content:tt}}"   
>
    <b class:toggled="{!toggled}"><slot name="unselected"/></b>
    {#if toggle && !bare}
        <span class:toggled></span>
    {/if}
    <b class:toggled="{toggled}"><slot/></b>
</button>
{#if toggle && !invisible}
<div class="measurer" bind:this={rulerDiv}>
<svelte:self 
invisible=true
toggled=true
{inverse}
{bare}
{busy}
{toggle}
{rtl}
{width}
{fontSize}
{small}
{disabled}
{compact} 
{ariaLabel}
{tt}
><u><slot/></u>
<u slot="unselected"><slot name="unselected"/></u></svelte:self>
</div>
{/if}

<style>
    u {
        text-decoration: none;
        display: contents;
    }
.measurer {
    position: fixed;
    top: -2000px;
    visibility: hidden;
    border: 3px solid green;
}  
 b { 
     display: contents; 
     font-weight: normal 
    }

 .toggle b {
     display: flex;
     align-items: center;
     justify-content: center;
     font-weight: normal;
 }

 .toggle b.toggled {
     font-weight: bold;
     display: flex;
     align-items: center;
     justify-content: center;
 }

 .toggle b:first-child {
     margin-right: 5px;
 }
 .toggle b:first-child:empty {
     margin-right: 0;
 }
 
 button {
     font-family : var(--uiFont);
     display: inline-flex;
     justify-content: center;
     align-items: center;
     padding: 5px;
     transition: all 300ms;
     box-sizing: border-box;
     width: var(--button-width);
     border-radius: 10px;
     border-width: 1px;
     border-style: solid;
     border-color: var(--light-underline);
     background-color: var(--white);
     color: var(--black);
 }
 
 button.customSize {
     font-size: var(--fontSize);
 }
 
 button.small {
     font-size: var(--small);
 }
 button.bare.toggle {
     border-width: 1px;
     border-color: transparent;
 }
 button.bare.toggle:hover {
     border-color: var(--accent-bg);
 }
 button.bare.toggled {
     background-color: var(--light-bg);
     color: var(--light-fg);
 }
 button.bare.toggled {
     border-width: 1px;
     border-color: var(--medium-bg);
 }

 button.bare {
     border-width: 0;
     background-color: transparent;
 }
 button.bare:hover {
     border-width: 1px; 
 }
 button:hover {
     color: var(--black-fg);
     background: var(--light-bg) radial-gradient(circle, transparent 1%, var(--light-bg) 1%) center/15000%;
     border-color: var(--accent-bg);
 }
 button:active {
     background-color: var(--medium-bg);
     color: var(--medium-fg);
     background-size: 100%;
     transition: background 0s;
 }

 .inverse {
     background-color: var(--light-fg);
     color: var(--light-bg);
 }
 .inverse:hover {
     color: var(--light-bg);
     background: var(--light-fg) radial-gradient(circle, transparent 1%, var(--light-fg) 1%) center/15000%;
 }
 .inverse:active {
     border-color: var(--accent-fg);
     background-color: var(--black);
     color: var(--light-bg);
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
 @media print {
     button {
         display: none;
     }
 }

</style>
