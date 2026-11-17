<script>
 import {registerBuild} from '../../stores/debugStore.js'; registerBuild(Number("BUILD_MS"));
 export let url;
 export let value={};
 export let maxSize=1200;
 
 import { tick,createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();

 import {Button,IconButton,PlainInput,Underline} from '../'
 
 let fullUrl
 let existingImage
 import pica from 'pica';
 let p = pica()
 let targetWidth = 0;
 let targetHeight = 0;

 url = value && value.url || url
  
 function onExistingLoaded () {
     targetWidth = existingImage.clientWidth;
     targetHeight = existingImage.clientHeight;
     console.log('FETCH WIDTH',targetWidth);
 }
 
 $: if (url && value) {
     // reactive update
     value.url = url;
     dispatch('change',value)
 }

 function updateUrl(event) {
     const file = event.target.files[0];
     const reader = new FileReader();

     reader.addEventListener("load", async function () {
         // convert image file to base64 string
         fullUrl = reader.result;
         url = ''
         targetWidth = undefined;
         targetHeight = undefined;
         console.log('Using pica...',p);         
     }, false);
     
     if (file) {
         reader.readAsDataURL(file);
     }
 }

 async function onFQLoaded () {
     console.log('Full image is',fullQuality.clientWidth,fullQuality.clientHeight);
     let options = {
     }
     if (fullQuality.clientWidth < maxSize &&
         fullQuality.clientHeight < maxSize) {
         url = fullUrl;
     } else {
         if (fullQuality.clientWidth  > fullQuality.clientHeight) {
             targetWidth = maxSize;
             targetHeight = targetWidth * (fullQuality.clientHeight/fullQuality.clientWidth);
             
         } else {
             targetHeight = maxSize;
             targetWidth = maxSize * (fullQuality.clientWidth/fullQuality.clientHeight);
         }
         console.log('resize to',targetWidth,targetHeight);
         await tick();
         let result = await p.resize(
             fullQuality,
             resizeCanvas,
             {toWidth:targetWidth,
             toHeight:targetHeight}
         )
         console.log('Done resizing');
         console.log('Got result',result)
         url = result.toDataURL()
     }
 }
 
 let fullQuality;
 let resizeCanvas;
 let fileMode=false;
 let elementWidth;

 let renderWidth, renderHeight;
 let widthToReactTo
 $: widthToReactTo = value.width
 $: recalculateWidth(elementWidth,targetWidth,url,widthToReactTo);

 function recalculateWidth () {
     let width = value && value.width || (elementWidth - 30)
     if (width && targetWidth) {
         if (targetWidth < width) {
             renderWidth = targetWidth;
             renderHeight = targetHeight;
         } else {
             renderWidth = width;
             renderHeight = renderWidth * (targetHeight/targetWidth);
         }
     } else if (value && value.width) {
         renderWidth = value.width;
         renderHeight = value.height;
     } else if (elementWidth) {
         renderWidth = elementWidth;
         renderHeight = undefined;
     } 
 }
 
 let fileInput
</script>
<div bind:clientWidth={elementWidth} class="ruler">
    {elementWidth}
</div>
<div class="image" style="{url && `width:${renderWidth}px;height:${renderHeight}px;background-repeat:none;background-size:contain;background-image:url(${url});`}" class:hasImage="{url}">
    <div class="inputs">
        <div class="row">
            <label>
                {#if url}
                    Replace Image
                {:else}
                    Add Image
                {/if}
            </label>
            {#if fileMode}
                <label class="file-input-wrap">
                    <input
                        bind:this="{fileInput}"
                        accept="image/*"
                        type="file"
                        on:change="{updateUrl}"
                    >
                    <IconButton icon="image" on:click="{()=>fileInput.click()}">Upload</IconButton>
                </label>
            {:else}
                URL: <Underline flexgrow="{true}" grow="{false}">
                    <input style="width:100%;background:transparent;" type="text" bind:value="{url}">
                </Underline>
            {/if}
            <span class="right">
                <IconButton
                    icon="attach_file"
                    toggle="{true}"
                    toggled="{fileMode}"
                    on:click="{()=>fileMode=!fileMode}"/>
            </span>
        </div>
        <div class="row">
            <label>Caption: <PlainInput flexgrow={true} grow={false} bind:value="{value.caption}" /></label>
            <!-- <Button toggle="true" toggled="{!value.float}" on:click="{()=>value.float=!value.float}"></Button> -->
        </div>
        <div class="row">
            <label><input type="radio" bind:group="{value.width}" value="{undefined}"> Full Width</label>
            <label><input type="radio" bind:group="{value.width}" value="{650}"> Medium</label>
            <label><input type="radio" bind:group="{value.width}" value="{400}"> Small</label>
            <label><input type="radio" bind:group="{value.width}" value="{250}"> Smaller</label>
            <!-- <Button toggle="true" toggled="{!value.float}" on:click="{()=>value.float=!value.float}"></Button> -->
        </div>
        {#if value.width}
            <div class="row">
                <Button bare="{true}" toggle="true" toggled="{value.float}" on:click="{()=>value.float=!value.float}">
                    <span slot="unselected">Center Image</span>
                    <span>Float Image</span>
                </Button>
                <!-- <Button toggle="true" toggled="{!value.float}" on:click="{()=>value.float=!value.float}"></Button> -->
            </div>
        {/if}
    </div>
    
</div>
{#if url}
    <img style="{`max-width:${maxSize}px;max-height:${maxSize}px`}" on:load={onExistingLoaded} class="fq" bind:this={existingImage} src={url}>
{/if}
{#if fileMode}
    <canvas bind:this="{resizeCanvas}" width="{targetWidth}" height="{targetHeight}"></canvas>
    <img class="fq" on:load="{onFQLoaded}" bind:this="{fullQuality}" src="{fullUrl}">
{/if}



<style>
 .ruler {
     height: 0;     
     overflow: hidden;
 }
 .image {
     display: flex;
     max-width: calc(100% - 2em);
 }
 .right {
     margin-left: auto;
 }

 .inputs {
     flex-grow: 1;
 }
 .inputs .row {
     display: flex;
     margin-top: 5px;
 }

 .hasImage .inputs {
     background-color: #ffffffc7;
     margin-top: auto;
 }
 img {
     position: absolute;
     top: 0;
     left: 0;
 }
 canvas {
     visibility: hidden;
     position: absolute;
 }
 .fq {
     visibility: hidden;
     position: absolute;
 }
 .file-input-wrap input {
     display: none;
 }
 label {
     flex-grow: 1;
     display: flex;
 }
</style>
