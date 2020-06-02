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
     listen();
     onStart();
 }
 
 
 function listen () {
     function listenUp () {
	 window.removeEventListener('mouseup',listenUp)
	 window.removeEventListener('mousemove',listenMove)
         resizing = false;
	 onFinish();
     }
     
     function listenMove (event) {
	 var dx = origin.x - event.pageX;
	 var dy = origin.y - event.pageY;
	 console.log('move!',dx,dy)

	 onDrag(dx,dy);			
     }
     window.addEventListener('mouseup', listenUp);
     window.addEventListener('mousemove',listenMove);
 }
 
</script>
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
