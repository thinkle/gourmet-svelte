<script>
 import IB from './IconButton.svelte';
 import {onMount} from 'svelte';
 import Timer from '../../utils/timerDrawer.js';
 import Times from '../../utils/times.js';
 export let onEditModeToggle;
 export let size = 100;
 export let duration = 60;
 export let onComplete;
 let timeLeft;
 import {DurationInput} from '../';
 $: timeLeft = duration * 1000;
 
 let timer = Timer({timerSize:size,secondHand:true});
 
 $: timer && canv && setComputedColors()
 function setComputedColors () {
     timer.activeTimeColor = getComputedStyle(canv).getPropertyValue('--accent-bg');
     timer.pauseTimeColor =  getComputedStyle(canv).getPropertyValue('--accent-fg');
 }

 let canv;
 let endTime;
 let now;
 let remaining;

 const INITIAL = 1
 const PAUSED = 2
 const GOING = 3
 let editMode = false;
 let lastEditMode = false;
 $: if (editMode != lastEditMode) {
     lastEditMode = editMode;
     if (onEditModeToggle) {onEditModeToggle(editMode);}
 }
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
        <span class="topright"><IB inverse={editMode} on:click="{edit}" bare={true} icon="edit"></IB></span>
    {/if}
    {#if editMode}
        <DurationInput minimal={true} timerSize={size} value={{seconds:duration}} on:change={updateDuration}/>
    {:else}
        {#if state==PAUSED||timeLeft<0}
            <span class="topleft"> <IB on:click="{reset}" bare={true} icon="replay"></IB></span>
        {/if}
        {#if state==GOING}
            <IB on:click="{pause}" bare={true} icon="pause_circle_filled"></IB>
        {:else}
            <IB on:click="{resume}" bare={true} icon="play_circle_filled"></IB>
        {/if}
    {/if}
    <canvas class:hidden={editMode}  on:click={toggleTimer} width="{size}"  height="{size}" bind:this={canv}/>
    {#if state==GOING}
        <blockquote>{timeLeft/1000} seconds left</blockquote>
    {/if}
    {#if timeLeft <=0 && state==GOING && !editMode }
        <audio
            autoplay="true"
            controls
            src="/phone.wav">
            Your browser does not support the
            <code>audio</code> element.
        </audio>
        {onComplete && onComplete() && ''}
    {/if}
</div>

<style>
 blockquote {
     display: none;
 }
 audio {display: none}
 
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

