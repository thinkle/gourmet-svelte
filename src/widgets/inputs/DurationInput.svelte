<script>
 export let value
 export let timerSize=50
 export let minimal=false;
 export function focus () {
     fref.focus()
 }


 import {onMount} from 'svelte';
 import Timer from '../../utils/timerDrawer.js';
 import Times from '../../utils/times.js';
 import {Underline} from '../';
 import {getAngle,deg} from '../../utils/trigHelper.js'

 let fref

 import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();

 let canv;
 let mousedown = false

 let timer = Timer({timerSize});
 $: timer && canv && setComputedColors()
 function setComputedColors () {

     timer.activeTimeColor = getComputedStyle(canv).getPropertyValue('--accent-bg');
     timer.pauseTimeColor =  getComputedStyle(canv).getPropertyValue('--accent-fg');
     console.log('Set computed colors!',timer.activeTimeColor,timer.pauseTimeColor);
     drawTimer();
 }


 $: cx= timerSize/2;
 $: cy = timerSize/2;
 
 let lasttheta = 0;

 $: if (value.seconds==undefined) {
     value.seconds = 0;
 }

 let direction = 0;
 let startVal = undefined
 let curVal
 let mouseChangeStart = false;
 /*  onMount(drawTimer) */

 function onmousemove (event) {
     if (event.which==1) {
         //button down
         mouseChangeStart = true;
         if (lasttheta) {
             // Our timer is a circle...
             var theta = getAngle(event.offsetX-cx,event.offsetY-cy)
             if (theta < (Math.PI/2) && lasttheta > (Math.PI*1.5)) {
                 // around the bend we go then...
                 theta += Math.PI * 2
             }
             const angleChange = theta - lasttheta
             const percentChange = angleChange / (Math.PI*2)
             let nextDir = direction
             if (percentChange < 0 && curVal==0) {
                 console.log('floor');
             }
             else {
                 curVal = Math.max(0,curVal + (timer.circleSize * percentChange))
                 value.seconds = curVal && Math.round(curVal / timer.unit) * timer.unit
             }
         }
         lasttheta = getAngle(event.offsetX-cx,event.offsetY-cy)
     }
     else {
         startVal = Number(value.seconds);
         curVal = Number(value.seconds);
         lasttheta = undefined;
         if (mouseChangeStart) {change();}
         mouseChangeStart = false;
     }
 }
 

 let changedFromText
 function change () {
     if (!changedFromText) {
         value.text = value.seconds && Times.getDescription(value.seconds) || ''
     }
     dispatch('change',
              value)
     changedFromText = false;
 }

 function changeText (event) {
     let text = event.target.value;
     let time = Times.getSecondsFromString(text);
     if (time) {
         value.seconds = time
     }
     value.text = text;
     changedFromText = true;
     change();
 }

 function changeSeconds (event) {
     let n = event.target.value
     const curtime = Times.getHMS(value.seconds||0)
     curtime.seconds = Number(n)
     value.seconds = Times.HMStoSeconds(curtime)
     change()
 }
 
 function changeMinutes (event) {
     let n = event.target.value
     const curtime = Times.getHMS(value.seconds||0)
     curtime.minutes = Number(n)
     value.seconds = Times.HMStoSeconds(curtime)
     change()
 }

 function changeHours (event) {
     let n = event.target.value
     const curtime = Times.getHMS(value.seconds||0)
     curtime.hours = Number(n)
     value.seconds = Times.HMStoSeconds(curtime)
     change()
 }
 
 function drawTimer () {
     if (!canv) {return}
     timer.ctx = canv.getContext('2d')
     timer.draw(value.seconds);

     drawKnob();


     function drawKnob () {
         let ctx = timer.ctx;
         let cx = timer.timerSize/2
         let cy = cx;
         if (lasttheta) {
             // just draw a knob?
             ctx.beginPath();
             ctx.lineWidth = 1;
             ctx.strokeStyle = '#a8a8a8';
             ctx.arc(cx,cy,0.65*(timerSize/2),0,Math.PI*2)
             ctx.stroke();
             let knobWidth = (Math.PI*2)*0.025
             ctx.beginPath();
             ctx.arc(cx,cy,0.65*(timerSize/2),lasttheta-knobWidth,lasttheta+knobWidth)
             ctx.lineWidth = 5;
             ctx.strokeStyle = 'grey'
             ctx.stroke();
         }
     }

 }

 $: {
     if (value.seconds || startVal) {
         drawTimer();
     }
 }

 function getInputStyle () {
     if (minimal) {
         return `width:${timerSize*29/100}px;
         font-size:${timerSize*12/100}px;
         padding-left : 0; padding-right: 0;
         `
     }
 }

</script>
<span class='outer'>
    {#if !minimal}
        <Underline grow="{false}">
            <input placeholder="Label (Baking Time)…" type="text"  class="text" bind:value={value.name} on:change="{change}">
        </Underline>
    {/if}
    <span class="container" class:minimal>
        <Underline>
            <div class="hms" >
                <input style={getInputStyle()} width="2" on:change={changeHours} type="number" value={Times.getHMS(value.seconds).hours}
                             placeholder="HH"
                       step="{timer.unit < (60*60) && 1 || timer.unit/(60*60)}"
                >
                <span class="colon" >:</span>
                <input
                    placeholder="MM"
                    style={getInputStyle()} bind:this={fref} width="2" on:change={changeMinutes} type="number" value={Times.getHMS(value.seconds).minutes.toString(10).padStart(2,'0')}
                                 step="{timer.unit < 60 && 1 || timer.unit > 60 && 15 || timer.unit/60}"
                >    <span class="colon" >:</span>
                <input
                    placeholder="SS"
                    style={getInputStyle()} width="2" on:change={changeSeconds} type="number" value={Times.getHMS(value.seconds).seconds.toString(10).padStart(2,'0')}
                                 step="{timer.unit < 60 && timer.unit || 15}"
                >
            </div>
        </Underline>
        <canvas tabindex=0 on:mousemove={onmousemove}  width={timerSize} height={timerSize} bind:this={canv}></canvas>
        {#if !minimal}
            <Underline>
                <input
                    placeholder="(e.g. 1/2 hour)…"
                    class="text"
                    on:change="{changeText}"
                    type="text"
                    bind:value={value.text}>
            </Underline>
        {/if}
    </span>
</span>

<style>
 .container {
     display: inline-grid;
     grid-template-areas :
         "hms timer"
         "text timer"
         ;
 }

 .container.minimal {
     display: flex;
     flex-direction: column-reverse;
     align-items: center;
 }

 .hms {
     grid-template-area: hms
 }
 canvas {
     grid-area: timer;
 }
 .text {
     grid-area: text;
     width: 10em;
     font-style: italic;
 }
 
 input {
     width: 3em;
     text-align: center;
     /*border-bottom: 0;*/
 }
 canvas {

 }
 .colon {
     font-weight: bold;
     font-size: 2em;
 }
 .outer canvas {
     opacity: 0;
     transition: opacity 300ms;
 }

 .outer:focus-within canvas {
     opacity: 1
 }
</style>
