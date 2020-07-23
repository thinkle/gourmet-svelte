<script>
 import {fly} from 'svelte/transition'
 import {tooltip as tooltipAction} from '../index.js';
 import {IconButton} from '../';
 export let icon
 export let tt=''
 export let tooltip=undefined
 export let showTooltip=false;
 export let tooltipLeft=false
 export let tooltipRight=true
 export let tooltipAbove=false
 export let tooltipUnder=true
 if (tooltipLeft) {
     tooltipRight = false;
 }
 if (tooltipAbove) {
     tooltipUnder = false;
 }
 let flyProps = {duration:350}
     if (tooltipLeft) {
         flyProps.x = 100; /* Comes from the right */
     }
 if (tooltipRight) {
     flyProps.x = -100; /* Comes from the left */
 }
 if (tooltipAbove) {
     flyProps.y = 100; /* Comes from below */
 }
 if (tooltipUnder) {
     flyProps.y = -100; /* Comes from above */
 }

</script>

<span use:tooltipAction="{{content:tt}}">
    <i class="material-icons"
       class:clickable="{tooltip}"
       on:click="{()=>showTooltip=!showTooltip}"
    >
        {icon}
    </i>
    {#if tooltip && showTooltip}
        <div class:tooltipLeft class:tooltipRight class:tooltipAbove class:tooltipUnder
             transition:fly={flyProps}
        >
            <span class="topRight">
                <IconButton icon="close" bare="true" small="true" on:click={()=>showTooltip=false}/>
            </span>
            <slot/>
        </div>
    {/if}

</span>
<style>
 
 span {
     position: relative;
 }
 div {
     position: absolute;
     z-index: 99;
     width: 350px;
     background-color: var(--note-bg);
     color : var(--note-fg);
     padding: 24px;
     white-space: normal;
 }

 .topRight {
     position: absolute;
     right: 3px;
     top: 3px;
 }

 .tooltipRight {
     left : 24px;
 }
 .tooltipLeft {
     right : 24px;
 }
 .tooltipAbove {
     bottom : 24px;
 }
 .tooltipUnder {
     top: 24px;
 }
 .clickable:hover {
     background-color: var(--medium-bg);
     color: var(--medium-fg);
     border-radius: 50%;
 }
</style>
