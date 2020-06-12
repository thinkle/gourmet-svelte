<script>
 import {registerBuild} from '../../stores/debugStore.js'; registerBuild(Number("BUILD_MS"));

 import RecipeList from '../RecipeList.svelte';
 import {Modal,
         IconButton} from '../../widgets/';

 import { crossfade, scale } from 'svelte/transition';
 import {fade} from 'svelte/transition';
 export let message = 'Pick recipe to include as ingredient'
 export let onSelected;
 export let onClose;
 
</script>
<Modal
    key="picker"
    {onClose}>
    
    <!-- <span class="close"><IconButton bare="true" icon="close" on:click="{onClose()}" /></span> -->
    <h2>
        {message}
    </h2>
    <RecipeList
        onRecipeClick={onSelected}
    />
</Modal>
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
