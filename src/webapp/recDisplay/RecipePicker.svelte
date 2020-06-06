<script>
 import {registerBuild} from '../../stores/debug.js'; registerBuild(Number("BUILD_MS"));
 import RecipeList from './RecipeList.svelte';
 import IconButton from '../../widgets/IconButton.svelte';
 import { crossfade, scale } from 'svelte/transition';
 import {fade} from 'svelte/transition';
 import {send,receive} from './pickerTransition.js';
 export let message = 'Pick recipe to include as ingredient'
 export let onSelected;
 export let onClose;
 
</script>
<section class='screen' in:fade="{{duration:500}}" out:fade="{{duration:500}}">
    <div class='dialog'
         in:receive out:send
    >
        <span class="close"><IconButton bare="true" icon="close" on:click="{onClose()}" /></span>
        
        <h2>
            {message}
        </h2>
        <RecipeList
            onRecipeClick={onSelected}
        />
        
    </div>    
</section>
<style>
 section {
     position: fixed;
     top : 0;
     left : 0;
     width: 100vw;
     height: 100vh;
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
 }

 .close {
     float: right
 }
 
</style>
