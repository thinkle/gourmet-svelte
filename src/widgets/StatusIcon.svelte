<script>
 import {fly} from 'svelte/transition'
 import IconButton from './IconButton.svelte';
 export let icon
 export let tooltip
 export let showTooltip=false;
 export let tooltipLeft=false
 export let tooltipRight=true
 export let tooltipAbove=false
 export let tooltipUnder=true

 let flyProps = {duration:350}
 if (tooltipLeft) {
     flyProps.x = -100;
 }
 if (tooltipRight) {
     flyProps.x = 100;
 }
 if (tooltipAbove) {
     flyProps.y = 100;
 }
 if (tooltipUnder) {
     flyProps.y = -100;
 }

</script>

<span>
    <i class="material-icons" class:clickable={tooltip}
       on:click={()=>showTooltip=!showTooltip}
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
 }

 .topRight {
     position: absolute;
     right: 3px;
     top: 3px;
 }

 .tooltipLeft {
     left : 24px;
 }
 .tooltipRight {
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
