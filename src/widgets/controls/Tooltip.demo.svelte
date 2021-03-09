<script>
 import {tooltip} from './tooltip.js'
 import {StatusIcon} from '../'
 let show
 let spans = ['Cool beans','Awesome sauce','Fan-nnn-tastic']
</script>

<h2>
    {#each spans as span}
	<span use:tooltip="{{content:`${span}This one uses an action`}}">{span}</span>
    {/each}
    <StatusIcon icon="save">Save icon with a tooltip!</StatusIcon>

</h2>

<p use:tooltip={{content:"this one is absolute positioned"}}>
    Foof
    <StatusIcon icon="save">Save icon with a tooltip!</StatusIcon>

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
    <StatusIcon icon="save">Save icon with a tooltip!</StatusIcon>

</blockquote> 

<blockquote style="right:10px">
    <StatusIcon icon="save">Save icon with a tooltip!</StatusIcon>
</blockquote>>

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
