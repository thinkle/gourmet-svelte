<script>
 import Tag from './Tag.svelte';
 import ComponentSandbox from './ComponentSandbox.svelte';
 import {onMount} from 'svelte';
 export let name='?';
 export let detail='';
 export let targetNode;
 export let targetContent;
 export let id;
 let ref;
 let tagElement
 let makeWay = false;


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
 function remove () {
     zzgrmthighlight = false;
     try {
         chrome.runtime.sendMessage(
             //settings.chromeExtensionId,
             {
                 action:'removeTag',
                 id:id,
                 origin:'content',
             },
             (response)=>{console.log('I heard back from bg! %s',response)}
         );
     }
     catch (err) {
         console.log("Are you testing? Can't send chrome message outside of extension")
         console.log('Ignoring error',err)
         console.log('Removing tag...')
     }

 }
 let lastTag = name
 $: if (lastTag != name) {
     updateTag()
 }
 function updateTag () {
     console.log('Update tag',name)
     try {
         chrome.runtime.sendMessage(
             {
                 action:'updateTag',
                 message : {
                     id:id,
                     part:name,
                 }
             },
             (response)=>{
                 console.log('Heard back after update')
                 lastTag = tag
             }
         );
     }
     catch (err) {
         console.log("Are you testing? Can't send chrome message outside of extension")
         console.log('Ignoring error',err)
         console.log('new tag = ',id,name);
     }
 }

 function updateContents (event) {
     console.log('Update',event.target.innerHTML);
     try {
         chrome.runtime.sendMessage(
             {
                 action:'updateTag',
                 message : {
                     id:id,
                     part:name,
                     parsed : {
                         html:event.target.innerHTML,
                         text:event.target.textContent
                     }
                 }
             },
             (response)=>console.log('Heard back after update')
         );
     }
     catch (err) {
         console.log("Are you testing? Can't send chrome message outside of extension")
         console.log('Ignoring error',err)
         console.log('new tag = ',id,name,event.target.innerHTML);
     }
 }

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

<div class:makeWay class:zzgrmthighlight id={id} style={getStyle(tagWidth,tagHeight)} on:click={()=>makeWay=true} on:blur={()=>makeWay=false}>
    <span contenteditable={zzgrmthighlight} on:input={updateContents}  bind:this={ref} on:blur={()=>makeWay=false}>
    </span>
    <div bind:this={tagElement} class="zzgrmttag">
        <ComponentSandbox onResize={onResize}
        >
            <Tag  bind:name={name}  bind:detail={detail} onRemove={remove}/>
        </ComponentSandbox>
    </div>
</div>

<style>
 .zzgrmthighlight {
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
