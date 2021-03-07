<script>

 export let stackSidesAt = 700;
 export let maxWidth = 1200;
 export let leftWidth=300
 export let maxWidthLeft = undefined;
 export let maxWidthRight = undefined;

 import FullHeight from './FullHeight.svelte';
 import {IconButton} from '../';
 import {registerBuild} from '../../stores/debugStore.js'; registerBuild(Number("BUILD_MS"));
 import {onMount} from 'svelte';
 import {Resizer} from '../';
 let stackMode = false;
 let ref
 let leftSideRef;
 let leftOffScreen = false;
 let initialLeftWidth
 import {watchResize} from 'svelte-watch-resize';
 var observer;
 onMount(
     ()=>{
        observer = new IntersectionObserver(
        (entries)=>{
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
                    leftSideRef.style = ''
                }
            }
        },
        {threshold : [.2]}

     );
 });


 function handleResize () {
     if (ref.clientWidth < Number(stackSidesAt)) {
         stackMode = true;
     }
     else {
         stackMode = false;
     }
 }

 let leftSideFlyIn = false;
 let flyDistance = 0;
 let extraFlyInPad = 30
 function toggleLeftSideFlyIn () {
    leftSideFlyIn = !leftSideFlyIn;
    flyDistance = leftSideRef.parentElement.scrollTop;
    leftSideRef.style = leftSideFlyIn && `
        transform: translateY(${flyDistance+extraFlyInPad}px);
        border: 3px solid var(--accent-bg);
        background-color: var(--white);
        opacity: 1;
        position: relative;
        z-index: 2;
        color: var(--black);

    ` || ''
    console.log('toggled flyIn',leftSideFlyIn,flyDistance,leftSideRef)
 }

 $: { 
     if (leftSideRef) {    
        observer.observe(leftSideRef);
    }
 }
</script>

<FullHeight>
    <div use:watchResize={handleResize} bind:this={ref} class="sidebyside"
         style="{`
                --max-width:${maxWidth};
                --max-left:${maxWidthLeft};
                --max-right:${maxWidthRight};
                `}"
         class:stackMode
    >
        <div class="side l" style="{!stackMode && `--left-width:${leftWidth}px`}" bind:this={leftSideRef}>
            {#if leftSideFlyIn}
            <div style={`position:absolute; right: 3px; top: -${extraFlyInPad}px;`}>
            <IconButton icon="close" on:click={toggleLeftSideFlyIn}/>
            </div>
        {/if}
	    <div class="head scrollHead">
	        <slot name="leftHead">
	        </slot>            
	    </div>        
	    <div class="scrollBox" >
           
	        <slot name="left"></slot>
	    </div>	    
        </div>
        {#if !stackMode}
            <Resizer
                onStart="{({x,y})=>initialLeftWidth=leftWidth}"
                onDrag="{(dx)=>leftWidth=initialLeftWidth-dx}"
            />
        {/if}
        <div class:showHandle={leftOffScreen && !leftSideFlyIn} class="mobileHandle" on:click={toggleLeftSideFlyIn}>
            <slot name="leftHandle">ING</slot>
        </div>
        <div class="side r">
	    <div class="head scrollHead">
	        <slot name="rightHead">
	        </slot>
	    </div>
	    <div class="scrollBox">
	        <slot name="right"></slot>
	    </div>	    
        </div>
    </div>
</FullHeight>
<style>
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
     width: min(var(--max-width),100vw);
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
 .stackMode .l,.stackMode .r {
     height: auto;
     margin: auto;
 }

 .stackMode .l {
     transition: all 300ms;
 }

 .mobileHandle {
     display: none;
     transition: opacity 300ms; 
     z-index: 2;
 }
 .stackMode .mobileHandle {
     display: flex;
     opacity: 0;
 }
.showHandle.mobileHandle {
    opacity: 1;
}

 .mobileHandle {
     position: sticky;
     top: 10px;
     margin-left: auto;
     margin-right: var(--side-pad);
     width: 50px;
     height: 50px;
     margin-top: -50px;
     background-color: var(--accent-bg);
     color: var(--accent-fg);
     text-align: center;
     border-radius: 50%;
     align-items: center;
     justify-content: center;
 }

 @media print {
     .scrollBox {
         overflow:visible
     }
 }
 
</style>