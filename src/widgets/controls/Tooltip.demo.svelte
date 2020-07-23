<script>
 import {tooltip} from './tooltip.js'
 let show
 let spans = ['Cool beans','Awesome sauce','Fan-nnn-tastic']
</script>

<h2>
    {#each spans as span}
	<span use:tooltip="{{content:`${span}This one uses an action`}}">{span}</span>
    {/each}
</h2>

<p use:tooltip={{content:"this one is absolute positioned"}}>
    Foof
</p>

<blockquote >
    <div  use:tooltip={{content:"this one is on the top of the bottom"}}>
	Bottom 0
    </div>
    <div  use:tooltip={{content:"this one is on the  bottom"}}>
	Bottom 1
    </div>
    <div use:tooltip={{content:"this one is on the very bottom"}}>		
	Bottom 2
    </div>
</blockquote> 
<style>
 blockquote {
     position: fixed;
     bottom: 0;
     margin: 0;
 }
 p {
     position: absolute; 
     top: 100px; 
     right: 0;
     width: 100px;
     height: 100px;
     border: 2px solid #f00;
 }
</style>
