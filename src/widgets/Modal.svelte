<script>
 import {send,receive} from './modalTransition.js'
 import {fade} from 'svelte/transition';
 import IconButton from './IconButton.svelte';
 export let onClose;

</script>
<section class='screen' in:fade="{{duration:500}}" out:fade="{{duration:500}}">
    <div class='dialog'
	 in:receive={{key:1}} out:send={{key:1}}
    >
        <span class="close">
	    <IconButton bare="true" icon="close" on:click="{onClose}"/>
	</span>
        <slot/>
        
    </div>    
</section>
<style>
 section {
     position: fixed;
     top : 0;
     left : 0;
     width: 100%;
     height: 100%;
     background-color: #00000077;
     display: flex;
     align-items: center;
     justify-content: center;
 }

 .dialog {
     height: 80vh;
     max-width: 1200px;
     margin: auto;
     background: white;
     padding: 10px;
     box-shadow: 4px 4px #777;
     overflow-y: scroll;
 }

 .close {
     float: right
 }
 
</style>
