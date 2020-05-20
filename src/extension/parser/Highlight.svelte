<script>
 import Tag from './Tag.svelte';
 import {backgroundUpdateTag,backgroundRemoveTag} from '../messaging/tags.js';
 import ComponentSandbox from './ComponentSandbox.svelte';
 import {onMount} from 'svelte';
 export let name='?';
 export let detail='';
 export let targetNode;
 export let targetContent;
 export let id;
 export let ref;
 export let address // DEBUG PURPOSES ONLY...
 let tagElement
 let makeWay = false;
 import {tagClassname} from './metadata.js';
 import _ from 'lodash';
 
 export function remove () {
     zzgrmthighlight = false;
 }

 onMount(
     ()=>{
         if (targetContent) {
             ref.appendChild(targetContent)
         }
         else if (targetNode) {
             ref.appendChild(targetNode)
         }
     }
 );
 let zzgrmthighlight = true;
 function doRemove () {
     remove();
     try {
         backgroundRemoveTag.send(id)
     }
     catch (err) {
         console.log("Are you testing? Can't send chrome message outside of extension")
         console.log('Ignoring error',err)
         console.log('Removing tag...')
     }

 }
 let lastTag = name
 $: if (lastTag != name) {
     updateTagname()
 }
 function updateTagname () {
     console.log('Update tag',name)
     backgroundUpdateTag.send({id,tag:name})
 }

 function updateText (event) {
     console.log('Update',event.target.innerHTML);
     backgroundUpdateTag.send({
         id,
         tag:name,
         html:event.target.innerHTML,
         text:event.target.textContent,
     });
 }

 function updateDetail () {
     backgroundUpdateTag.send({
         id,detail
     })
 }

 const updateTextDebounced = _.debounce(e=>updateText(e),500);
 const updateDetailDebounced = _.debounce(()=>updateDetail(),500);
 
 $: { if (detail) {updateDetailDebounced()}}

 let tagWidth
 let tagHeight

 function onResize(w,h) {
     tagWidth = w;
     tagHeight = h;
 }

 function getStyle () {
     return `--width:${tagWidth}px;--height:${tagHeight}px`
 }

</script>

<div class:zzgrmthighlighterblock={true} class={tagClassname} class:makeWay class:zzgrmthighlight id={id} style={getStyle(tagWidth,tagHeight)} on:click={()=>makeWay=true} on:blur={()=>makeWay=false}>
    <span contenteditable={zzgrmthighlight} on:input={updateTextDebounced}  bind:this={ref} on:blur={()=>makeWay=false}>
    </span>
    <div bind:this={tagElement} class="zzgrmttag">
        <ComponentSandbox onResize={onResize}
        >
            <Tag  bind:name={name}  detail={detail} onRemove={doRemove}/>
        </ComponentSandbox>
    </div>
    <!-- <blockquote>{address}</blockquote> -->
</div>

<style>
 blockquote {
     visibility: hidden;
     position: absolute;
     z-index: 999999999;
     background-color: pink;
     color: navy;
 }
 div:hover blockquote {
     visibility: visible;
 }
 .zzgrmthighlighterblock {
     display: inline-block;
     padding : 0;
     margin : 0;
     transition: padding 200ms;
 }
 .zzgrmthighlight.makeWay {
     padding-top: var(--height);
     padding-right: var(--width);
 }
 .zzgrmthighlight.makeWay .zzgrmttag {
     top: 0;
     right: 0;
 }
 .zzgrmttag {
     transition: all 200ms;
     position: absolute;
     right : calc(-0.85 * var(--width));
     top : calc(-0.85 * var(--height));
 }
 .zzgrmthighlight {
     background-color: #fdf7d7;
     position: relative;
 }

</style>
<svelte:options accessors/>
