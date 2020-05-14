<script>
 let ifr
 import {onMount,tick} from 'svelte';
 let width
 let height
 let body
 let componentContainer;
 export let onResize
 const wiggleRoom = 3; // a little extra space for size calculations...
 
 onMount( ()=>{
     ifr.onload = async function () {
         body = ifr.contentDocument
                   .querySelector("div")
         if (componentContainer && body) {
             mountComponent();
         }
         width = body.clientWidth + wiggleRoom; // for good measure
         height = body.clientHeight + wiggleRoom;
         if (onResize) {onResize(width,height)}
     }
 });

 function mountComponent () {
     body.appendChild(componentContainer)
     let ro = new ResizeObserver( entries => {
         width = body.clientWidth + wiggleRoom
         height = body.clientHeight + wiggleRoom
         if (onResize) {
             onResize(width,height)
         }
     });
     ro.observe(body);
 }

</script>
<iframe title="sandbox" srcdoc='<html><body style="margin:0;padding:0;"><div style="display:inline-block"></div></body></html>' bind:this={ifr} width={width} height="{height}"> 
</iframe> 
<div style="display:inline-block" bind:this={componentContainer}>
    <slot/>
</div>


<style>
    div {
    position: absolute;
    top: 10000px;
    left: 10000px;
    visibility: hidden;
    }
 iframe {
     border: none;
 }
</style>
