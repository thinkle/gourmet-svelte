<script>
 export let size=24;
 import { draw,fade } from 'svelte/transition';
 let show = false;
 setTimeout(() => show =  true, 500) 
 
</script>
{#if show}
    <svg  fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor" width={size} height={size}>
        <!-- bottom -->
	<path out:fade in:draw={{duration:1000}}  d="
			       M3.8,9.5a5.7,5.7 0 1,0 11.4,0a5.7,5.7 0 1,0 -11.4,0		
			       M20.45503,18.8282 L19.17349,20.23477 
			       l-5,-5,									 
			       l0,-0.5
			       l-1,-1
			       M19.17349,20.23477 L20.45503,18.8282
			       l-5,-5
			       l-0.5,0
			       l-1,-1
			       "
	/>
	<path out:fade in:draw={{duration:1000,delay:100}}  d="
			       M3.8,9.5a5.7,5.7 0 1,0 11.4,0a5.7,5.7 0 1,0 -11.4,0		
			       M20.45503,18.8282 L19.17349,20.23477 
			       l-5,-5,									 
			       l0,-0.5
			       l-1,-1

			       "
	/>
	<path out:fade in:draw={{duration:1000,delay:200}}  d="
			       
			       M19.17349,20.23477 L20.45503,18.8282
			       l-5,-5
			       l-0.5,0
			       l-1,-1
			       "
	/>
	<path out:fade in:draw={{duration:1000,delay:250}}  d="
			       M3.8,9.5a5.7,5.7 0 1,0 11.4,0a5.7,5.7 0 1,0 -11.4,0								
			       "
	/>
	<path out:fade in:draw={{duration:1000,delay:500}} 
			       on:introend={()=>show=false}
			       on:outroend={()=>show=true}  d="					
			       M4.8,9.5a4.7,4.7 0 1,0 9.4,0a4.7,4.7 0 1,0 -9.4,0
	      "
	/>
    </svg>    
{/if}
<style>
 path {
     fill: #ffffffff;
     stroke-width: 0.8;
     stroke : black;
 }</style>
