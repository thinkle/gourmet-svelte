<script>
 export let content=''
 export let markupToComponentMap = {
 }
 let parsed
 let components = []
 
 function crawlNode (node) {
     if (markupToComponentMap[node.tagName]) {
	 components.push({node,
											                                            type:markupToComponentMap[node.tagName]
			 })
	 console.log('build',node.tagName);
     }
     else {
	 console.log('ignore',node.tagName)
     }
     for (let child of node.children) {
	 crawlNode(child);
     }
 }
 
 $: {
     console.log('Parsing and crawling')
     parsed =  new DOMParser().parseFromString(content, 'text/html');
     crawlNode(parsed.body);	
 }
 
 $: {if (root) {addToRoot()}}
	          
                  function addToRoot () {
		      console.log('Adding to root element')
		      components.forEach(
			  (c)=>c.component.addToDom(c.node)
		      );
		      root.appendChild(parsed.body)
		  }
 
 function mapAttrs (attributes) {
     const map = {}
		                                                                                                                    for (let a of attributes) {
			                                                                                                                map[a.name]=a.value
		                                                                                                                    }
		                                                                                                                    return map
	         }
	 
	 let root;
</script>
<div bind:this={root}>	
</div>

{#each components as component,i}
    <svelte:component this={components[i].type} bind:this={components[i].component} {...mapAttrs(components[i].node.attributes)} >{@html components[i].node.innerHTML}</svelte:component>
{/each}
