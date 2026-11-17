<script>
 export let onResize=undefined;
 export let fullWidth=false;

 let ifr
 import {onMount,tick} from 'svelte';
 import {unique} from '../../utils/uniq.js';
 let width
 let height
 let body
 let componentContainer;

 const wiggleRoom = 3; // a little extra space for size calculations...
 
 onMount( ()=>{
     
     ifr.onload = async function () {
         body = ifr.contentDocument
                   .querySelector("div")         
         if (componentContainer && body) {
             let styleTags = getStyleNodes();
             for (let t of styleTags) {
                 if (t) {
                     console.log('Pushing ',t,'into sandbox');
                     componentContainer.appendChild(t.cloneNode(true));
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
     classes.forEach(
         (classname)=>{
             styleNodes.push(document.querySelector(`#${classname}-style`))
         }
     );
     let alsoThese = document.querySelectorAll('.__copyIntoSandbox')
     for (let node of alsoThese) {
         styleNodes.push(node);
     }
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

<iframe class:fullWidth title="sandbox" srcdoc="{`<html><body style="margin:0;padding:0;"><div style="${!fullWidth&&'display:inline-flex'}"></div></body></html>`}" bind:this={ifr} width={width} height="{height}"> 
</iframe>
<div class="invisiwrap">
<div style="display:block" bind:this={componentContainer}>
    <slot/>
</div>
</div>

<style>
 .fullWidth {
     width: 100%;
 }
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
