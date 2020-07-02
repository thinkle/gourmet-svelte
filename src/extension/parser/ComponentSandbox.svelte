<script>
 let ifr
 import {onMount,tick} from 'svelte';
 import {unique} from '../../utils/uniq.js';
 let width
 let height
 let body
 let componentContainer;
 export let onResize=undefined;
 const wiggleRoom = 3; // a little extra space for size calculations...
 
 onMount( ()=>{
     
     ifr.onload = async function () {
         body = ifr.contentDocument
                   .querySelector("div")         
         if (componentContainer && body) {
             let styleTags = getStyleNodes();
             for (let t of styleTags) {
                 if (t) {
                     componentContainer.appendChild(t.cloneNode(true));
                     console.log('Injected',t);
                 } else {
                     console.log('No stylesheet found for ');
                 }
             }
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

 function getStyleNodes () {
     crawlForSvelteClasses(componentContainer);
     classes = unique(classes);
     const styleNodes = []
     console.log('Looking for ',classes);
     classes.forEach(
         (classname)=>{
             styleNodes.push(document.querySelector(`#${classname}-style`))
         }
     );
     return styleNodes;
 }

 var classes = []

 function crawlForSvelteClasses (node) {
     for (const c of node.classList) {
         if (c.indexOf('svelte')>-1) {classes.push(c)}
     }
     for (const c of node.children) {
         crawlForSvelteClasses(c)
     }
 }

</script>

<iframe title="sandbox" srcdoc='<html><body style="margin:0;padding:0;"><div style="display:inline-block"></div></body></html>' bind:this={ifr} width={width} height="{height}"> 
</iframe>
<div class="invisiwrap">
<div style="display:inline-block" bind:this={componentContainer}>
    <slot/>
</div>
</div>

<style>
 .invisiwrap {
     position: absolute;
     top: 0;
     left: 0;
     visibility: hidden;
 }
 iframe {
     border: none;
 }
</style>
