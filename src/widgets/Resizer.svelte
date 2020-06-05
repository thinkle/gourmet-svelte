<script>
 export let onDrag=()=>{}
 export let onStart=()=>{}
 export let onFinish=()=>{}
 export let width='5px'
 export let height='100vh'
 export let cursor='ew-resize;'
 let origin
 let resizing
 let keyChange
 let ref;
 function start (event) {
     keyChange = {
         x:0,y:0
     }
     console.log('start');
     resizing = true;
     origin = {
	 x:event.clientX,
	 y:event.clientY
     }
     resizing = true
     onStart(origin);
 }
 
 
 function listenUp () {
     resizing = false;
     onFinish();
 }
 
 function listenMove (event) {
     if (resizing) {
         var dx = origin.x - event.pageX;
         var dy = origin.y - event.pageY;
         onDrag(dx,dy);
     }
 }

 function finishKeyboardInteraction () {
     console.log('Done with keyboarding...');
     keyChange = undefined;
     if (onFinish) {onFinish()}
 }
 
 function handleKey (event) {
     console.log('handle key',event);
     if (!keyChange) {
         keyChange = {x:0,y:0}
             if (onStart) {onStart({x:ref.clientX,y:ref.clientY})}
     }
     /* ArrowLeft 37
      * 3Resizer.svelte:43 Unhandled key:  ArrowRight 39
      * 2Resizer.svelte:43 Unhandled key:  ArrowUp 38
      * 2Resizer.svelte:43 Unhandled key:  ArrowDown 40 */
     if (event.key=='d' || event.key=='ArrowRight') {
         keyChange.x -= 5
     } else if (event.key=='a' || event.key=='ArrowLeft') {
         keyChange.x += 5
     } else if (event.key=='w' || event.key=='ArrowUp') {
         keyChange.y -=5
     } else if (event.key=='d' || event.key=='ArrowDown') {
         keyChange.y += 5
     }
     onDrag(keyChange.x,keyChange.y);
 }

</script>
<svelte:window
    on:mouseup="{listenUp}"
    on:mousemove="{listenMove}"
/>
<div
    bind:this={ref}
    tabindex="0"
    class="resizer"
    class:resizing
    on:mousedown="{start}"
    on:keydown="{handleKey}"
    on:blur="{finishKeyboardInteraction}"
    style="{`width:${width};height:${height};cursor:${cursor}`}"
>
</div>
<style>
 div:hover {
     background-color: var(--light-underline);
 }
 .resizing {
     background-color: var(--focus-border);
 }
</style>
