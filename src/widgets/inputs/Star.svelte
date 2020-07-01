<script>
 import {draw} from 'svelte/transition'
 export let size
 export let x
 export let curvy
 export let points = 5;
 export let indelay = 0;
 export let outdelay = 0;
 export let duration = 200;
 export let editable = true;
 export let notransition=false
 export let pointiness = 0.45 // one-to-zero scale
 let cx = x+size/2
 let cy = size/2
 let strokeWidth = size/20
 size = size - strokeWidth // adjust for stroke width
 let pointAngleChange = Math.PI*2/(points*2);
 let outer = true
 let ro = size/2 // outer radius
 let ri = pointiness*size/2 * (curvy&&0.5||1) // inner radius
 let theWholeStar
 for (let point = 0; point<=1+(points*2); point++) {
     let theta = Math.PI + pointAngleChange/2 + point * pointAngleChange 
     let r = outer ? ro : ri;
     let p = {
	 x:cx + Math.cos(theta) * r,
	 y:cy + Math.sin(theta) * r
     }
     if (!theWholeStar) {
	 theWholeStar = `M ${p.x} ${p.y} `
     } else if (outer) {
	 theWholeStar += `${curvy && ' '|| 'L'} ${p.x} ${p.y} `
     } else {
	 theWholeStar += ` ${curvy && ' Q' || 'L'} ${p.x} ${p.y} `
     }
     outer = !outer
 }
 let control = false;
 
 function onIntroEnd () {
     ready = true;
 }
 let fill 
 $: fill = notransition
</script>

<g class:editable class:fill style="{`stroke-width:${strokeWidth};--duration:${duration}ms`}" >
    <path in:draw|local="{{delay:indelay,duration}}"
	  out:draw|local="{{delay:outdelay,duration}}"
	  on:introstart="{()=>fill=true}"
	  on:outrostart="{()=>fill=false}"
          d="{theWholeStar}"
	  on:click
    />
</g>

<style>
 
 path {
     stroke: var(--starstroke,'gold');
     fill : transparent;
     transition: fill var(--duration);
     stroke-linecap: round;
     stroke-linejoin: round;
 }
 .editable path:hover,.editable.fill path:hover {
     fill : var(--starhover,'gold');
 }
 .fill path {
     fill : var(--starfill,'gold');
 }
 path {
     pointer-events: none;
 }
 .editable path {
     pointer-events: all;
 }
 
</style>
