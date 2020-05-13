<script>
 import IB from './IconButton.svelte';
 import {onMount} from 'svelte';
 import Timer from '../utils/TimerDrawer.js';
 import Times from '../utils/Times.js';
 export let size = 100;
 export let duration = 60;
 let timeLeft;
 import DurationInput from './DurationInput.svelte';
 $: timeLeft = duration * 1000;
 
 let timer = Timer({timerSize:size,secondHand:true});
 let canv;
 let endTime;
 let now;
 let remaining;

 const INITIAL = 1
 const PAUSED = 2
 const GOING = 3
 let editMode = false;

 let state = INITIAL
 
 function pause () {
     remaining = endTime - now;
     timer.pause();
     state = PAUSED
 }

 function reset () {
     timer.pause();
     state = INITIAL;
 }

 function resume () {
     if (state==INITIAL) {
         endTime = new Date().getTime() + (duration*1000)
     }
     else {
         endTime = now + remaining;
     }
     timer.resume();
     state=GOING
 }

 function edit () {
     editMode = !editMode;
 }

 function toggleTimer () {
     if (state==INITIAL) {
         resume()
     }
     else if (state==GOING) {
         if (endTime > now) {
             pause();
         }
         else {
             reset();
         }
     }
     else if (state==PAUSED) {
         resume()
     }
 }
 
 onMount (startUp)

 function startUp () {
     timer.ctx = canv.getContext('2d');
     timer.pause();
     let i = setInterval(drawTimer,300);
     return function () {
         clearInterval(i)
     }
 }
 
 function drawTimer () {
     if (state==GOING) {
         timer.draw(timeLeft/1000);
     }
     else if (state==INITIAL) {
         timer.draw(duration)
     }
     else { // paused
          timer.draw(remaining/1000)
          }
     now = new Date().getTime();
     if (endTime) {
         timeLeft = endTime - now;
     }
     
 }
 function updateDuration (event) {
     duration = event.detail.seconds;
 }
</script>

<div style={`width:${size*1.25}px`}>
    {#if state==INITIAL}
        <span class="topright"><IB inverse={editMode} on:click="{edit}">edit</IB></span>
    {/if}
    {#if editMode}
        <DurationInput minimal={true} timerSize={size} value={{seconds:duration}} on:change={updateDuration}/>
    {:else}
        {#if state==PAUSED||timeLeft<0}
            <span class="topleft"> <IB on:click="{reset}">replay</IB></span>
        {/if}
        {#if state==GOING}
            <IB on:click="{pause}">pause_circle_filled</IB>
        {:else}
            <IB on:click="{resume}">play_circle_filled</IB>
        {/if}
    {/if}
    <canvas class:hidden={editMode}  on:click={toggleTimer} width="{size}"  height="{size}" bind:this={canv}/>
</div>

<style>
 div {
     text-align: center;
     position: relative;
 }

 .topleft {
     position: absolute;
     top: 0;
     left: 0;
 }

 .topright {
     position: absolute;
     top: 0;
     right: 0;
 }
 .hidden {
     visibility: hidden;
 }
 canvas {
     display: block;
     margin: auto;
 }
</style>

