<script>
 export let onDrag=()=>{}
 export let onStart=()=>{}
 export let onFinish=()=>{}
 export let width='5px'
 export let height='100vh'
 export let cursor='ew-resize;'
 let origin
 let resizing
 function start (event) {
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
 
</script>
<svelte:window
    on:mouseup="{listenUp}"
    on:mousemove="{listenMove}"
/>
<div
    class="resizer"
    class:resizing
    on:mousedown="{start}"
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
