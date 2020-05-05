<script>
 import {onMount} from 'svelte';
 import Timer from '../utils/TimerDrawer.js';
 import Times from '../utils/Times.js';
 import {getAngle,deg} from '../utils/TrigHelper.js'
 export let value
 export let timerSize=50
 let fref
 export function focus () {
        fref.focus()
 }

 import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();

 let canv;
 let mousedown = false

 let timer = Timer({timerSize});

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
 onMount(drawTimer)

 function onmousemove (event) {
     if (event.which==1) {
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
                 value.seconds = Math.round(curVal / timer.unit) * timer.unit
             }
         }
         lasttheta = getAngle(event.offsetX-cx,event.offsetY-cy)
     }
     else {
         startVal = value.seconds;
         curVal = value.seconds;
         lasttheta = undefined;
         if (mouseChangeStart) {change();}
         mouseChangeStart = false;

     }
 }
 
 function change () {
     value.text = Times.getDescription(value.seconds)
     dispatch('change',
              value)
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

</script>

<span class="container">
    <div class="hms" >
        <input width="2" on:change={changeHours} type="number" value={Times.getHMS(value.seconds).hours}
               step="{timer.unit < (60*60) && 1 || timer.unit/(60*60)}"
        >
        <span class="colon" >:</span>
        <input bind:this={fref} width="2" on:change={changeMinutes} type="number" value={Times.getHMS(value.seconds).minutes.toString(10).padStart(2,'0')}
               step="{timer.unit < 60 && 1 || timer.unit > 60 && 15 || timer.unit/60}"
        >    <span class="colon" >:</span>
        <input width="2" on:change={changeSeconds} type="number" value={Times.getHMS(value.seconds).seconds.toString(10).padStart(2,'0')}
               step="{timer.unit < 60 && timer.unit || 15}"
        >
    </div>
    <canvas on:mousemove={onmousemove}  width={timerSize} height={timerSize} bind:this={canv}></canvas>
    <input class="text" on:change={change} type="text" bind:value={value.text}>
</span>

<style>
 .container {
     display: inline-grid;
     grid-template-areas :
         "hms timer"
         "text timer"
         ;
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
     border-bottom: 0;
 }
 canvas {

 }
 .colon {
     font-weight: bold;
     font-size: 2em;
 }
</style>
