<script>
 export let large=false
 export let scrollAll=undefined
 export let scrollLeft=undefined
 export let scrollRight=undefined
 export let scrollCenter=undefined
 export let growLeft=undefined;
 export let growRight=undefined

 function stopEvents (event) {
     event.stopPropagation();
 }
 


</script>

<div class:scroll="{scrollAll}" class:large class="bar"  on:click="{stopEvents}">
    <div class="left" class:scroll="{scrollLeft}" class:grow="{growLeft}">
        <slot name="left"/>
    </div>
    <div class="center" class:scroll="{scrollCenter}">
        <slot name="center"/>
    </div>
    <div class="right" class:scroll="{scrollRight}" class:grow="{growRight}">
        <slot name="right"/>
    </div>
</div>

<style>
 .grow {
     flex-grow: 3
 }

 .bar {
     display: flex;
     height: var(--bar-height);
     padding: 0.5rem 1rem;
     line-height: 1.5;
     align-items: center;
     white-space: nowrap;
 }
 .bar.large {
     height: calc(var(--bar-height) * 2);
 }

 .bar > div > :global(div),
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

</style>
