<script>
 import {onMount,tick} from 'svelte';
 export let content=''
 export let markupToComponentMap = {
 }
 let parsed
 let components = []
 
 function crawlNode (node) {
     if (markupToComponentMap[node.tagName]) {
	 components.push({node,type:markupToComponentMap[node.tagName]
			 })
     }
     for (let child of node.children) {
	 crawlNode(child);
     }
     components = components;
 }
 
 /* $: {
  *     parsed =  new DOMParser().parseFromString(content, 'text/html');
  *     crawlNode(parsed.body);	
  * } */
 

 async function makeComponentsAndMountThem (root) {
     parsed =  new DOMParser().parseFromString(content, 'text/html');
     crawlNode(parsed.body);
     await tick();
     addToRoot(root)
 }


 function magic (node) {
     makeComponentsAndMountThem(node);
     return {
         update () {
             makeComponentsAndMountThem(node)
         },
         destroy () {
             node.innerHTML = ''
         }
     }
 }

 //onMount(addToRoot)
 function addSelfToDom (node,i) {
     let target = components[i].node;
     target.parentElement.insertBefore(node,target);
     target.remove();
 }


 function addToRoot (root) {
     /* components.forEach(
	(c)=>c.component.addToDOM(c.node)
      * ); */
     let toAppend = []
     for (let i=0; i<parsed.body.childNodes.length; i++) {
         toAppend.push(parsed.body.childNodes[i]);
     }
     for (let node of toAppend) {
         root.appendChild(node)
     }
 }
 
 function mapAttrs (attributes) {
     const map = {
     };
     for (let a of attributes) {
	 map[a.name]=a.value
     }
     return map
 }
 
 /*  let root; */



</script>
<div use:magic={content}>
</div>
<!-- Components mounted below will be removed from their position and added to the DOM
     by JavaScript. They must each support an addToDOM method which takes a DOM parent
     and adds them to it.
-->
{#each components as component,i}
    <span use:addSelfToDom={i}><svelte:component  
        this={components[i].type} 
        bind:this={components[i].component} 
        {...mapAttrs(components[i].node.attributes)} ><!-- no whitespace!
        -->{@html components[i].node.innerHTML}<!-- no whitespace!
    --></svelte:component></span>
{/each}
<style>
 div {
     margin: 0; padding: 0; 
 }
</style>
