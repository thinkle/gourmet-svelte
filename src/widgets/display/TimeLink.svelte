<script>
 import {IconButton,Timer,OneLiner} from '../';
 import Moveable from 'svelte-moveable';
 import times from '../../utils/times.js';
 export let seconds=60
 export let label=""
 export let timestring=""
 import { fly } from 'svelte/transition';
 export let value=undefined;
 let draggable = true;
 let active = false;
 let timerHidden = false;
 function toggleTimer () {
     if (!show) {
         show = true;
     }
     else {
         timerHidden = !timerHidden;
     }
 }
 $: if (value) {
     seconds = value.seconds
     label = value.name
     timestring = value.text
 }
 
 let show = false;
 let ref;
 let timerBox;
 const frame = {
     translate : [0,0]
 }
 
 export function addToDOM (node) {
     node.parentElement.insertBefore(ref,node);
     node.remove();
 }

 function moveToTop (node) {
     let {top,left} = node.getBoundingClientRect();
     let bod = document.querySelector('body')
     bod.appendChild(node);
     node.style.position = 'fixed';
     node.style.top = top + 'px';
     node.style.left = left + 'px';
 }
 
</script>

<label>
    {#if label}{label.replace(/[.;:?,!]$/,'')}{/if}
</label>
<div bind:this={ref} on:click="{(e)=>e.preventDefault()}">
    {#if show}
        <div
            use:moveToTop>
        <div class:hidden="{timerHidden}"
             class="timerBox"
             bind:this="{timerBox}"
             on:mouseover="{()=>active=true}"
             on:mouseleave="{()=>active=false}"
             transition:fly
              >
            <div class="top">
                <IconButton
                    iconSize="12px"
                    on:click="{()=>timerHidden=true}"
                    icon="close"
                    bare="true"/>
            </div>
            <div class="content">
                <Timer onEditModeToggle={(edit)=>draggable=!edit}
                                        duration={seconds}
                       onComplete={()=>{timerHidden=false}}
                />
                <label><OneLiner>{@html timestring||times.getDescription(seconds)}</OneLiner></label>
            </div>
        </div>
        </div>
        {#if !timerHidden}
            <Moveable
                target="{timerBox}"
                origin="{false}"
                scrollable="{true}"
                draggable="{draggable}"
                on:drag="{(arg) => {
                         const {target,beforeTranslate} = arg.detail;
                         frame.translate = beforeTranslate;
                         target.style.transform = `translate(${beforeTranslate[0]}px, ${beforeTranslate[1]}px)`;
                         }}"
                on:dragStart="{
                        ({ detail: { set } }) => {
                        set(frame.translate)
                        }
                        }"
            />
        {/if}
    {/if}
</div>
<span class:active href="#showTimer" on:click={toggleTimer}>
    <slot>
        {timestring||times.getDescription(seconds)}
    </slot>
</span>

    

<style>
 .timerBox .content {
     padding: 5px;
     display: flex;
     flex-direction: column;
     align-items: center;
 }
 .timerBox {
     position: absolute;
     z-index: 2;
     background-color: #fff;
     display: flex;
     flex-direction: column;
     border: 1px solid #77f;
     box-shadow: 2px 2px #aaa;
 }
 .timerBox label {
     max-width: 200px;
 }
 .timerBox .top {
     display: flex;
     align-self: stretch; /* fill horizontal space */
     flex-direction: row; /* lay out button on horizontal axis */
     justify-content: flex-end; /* stretch button to end of box */
     font-size: 10px;
     background-color: #aaa;
 }
 .hidden {
     pointer-events: none;
     visibility: hidden;
 }
 div {
     display: inline-block;
     position: relative;
 }
 span:hover,span.active {
     text-decoration: underline;
 }
 span.active {
     background-color: yellow;
 }
 :global(.moveable-line) {
     background-color: transparent !important;
 }

</style>
