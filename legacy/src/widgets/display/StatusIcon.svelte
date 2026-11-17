<script>
 import {fly} from 'svelte/transition'
 import {tooltip as tooltipAction} from '../index.js';
 import {IconButton,Tooltip} from '../';
 export let icon
 export let tt=''
 export let tooltip=undefined
 export let tooltipWidth;
 let showTooltip;
 let domRef;
</script>

<span use:tooltipAction="{{content:tt}}" bind:this={domRef}>
    <i class="material-icons"
       class:clickable="{tooltip}"
       on:click="{()=>showTooltip=!showTooltip}"
    >
        {icon}
    </i>
    <Tooltip width={tooltipWidth} show={showTooltip} target={domRef} interactive={true}>
        <span class="topRight">
            <IconButton inverse={true} icon="close" bare={true} small={true} on:click={()=>showTooltip=false}/>
        </span>
        <slot/>
    </Tooltip>
</span>
<style>
 
 span {
     position: relative;
 }
 
 .topRight {
     position: absolute;
     right: -5px;
     top: -5px;
     z-index: 3;
 }

 .clickable:hover {
     background-color: var(--medium-bg);
     color: var(--medium-fg);
     border-radius: 50%;
 }
</style>
