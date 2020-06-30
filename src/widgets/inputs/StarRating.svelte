<script>
 import Star from './Star.svelte';
 import {tick} from 'svelte'
 export let stars = 5
 export let size = 75
 export let pad = 5;
 export let value = 0;
 export let editable=true;
 export let maxTransitionTime = 500;

 let t = maxTransitionTime/stars
 export let curvy
 let active = []
 let all = []
 let lastValue = value;
 $: resetAll(stars)
 $: resetActive(value)
 function resetAll (n) {
     for (let i=0; i<n; i++) {all.push(i)}
 }
 function resetActive () {
     active = []
     for (let i=0; i<value; i++) {
	 active.push(i);
     }

     setTimeout(()=>lastValue = value,maxTransitionTime);
 }
 
 function handleKey (e) {
     if (!editable) {return}
     if (['+','ArrowUp','ArrowRight','='].includes(e.key)) {
	 value += 1
     } else if (['-','_','ArrowDown','ArrowLeft'].includes(e.key)) {
	 value -= 1
     } else {
	 let n = Number(e.key)
	 if (n >= 0 && n <= stars) {
	     value = n
	 }
     }
 }
 
 
</script>

<svg height={size} width={stars*(size+pad)}
     style="--starstroke:var(--accent-bg,#ef2323);--starfill:var(--accent-fg,#ffff18);--starhover:var(--grey);"
    on:keyup="{handleKey}"
     tabindex="{editable&&0}"
    >
    <g
        style="--starstroke:#ddd;--starfill:#efefef;--starhover:#ffffcf">
        {#each all as i}
	<Star duration="{0}"
	      {curvy} x="{(size+pad)*i}" {size}
              {editable}
	      on:click="{()=>value=i+1}"
	/>
        {/each}
    </g>
    {#each active as i}
	<Star indelay={(i-lastValue)*t} 
	      outdelay={(lastValue-i-1)*t}
	      duration={t*2}
	      on:click={()=>value=i}
	      notransition={i<lastValue}
                      {editable}
	      {curvy} x={(size+pad)*i} {size}/>
    {/each}
</svg>
{#if editable}
    <input
        type="number"
        bind:value="{value}"
        on:change>
{/if}

<style>
 input {display:none}
</style>
