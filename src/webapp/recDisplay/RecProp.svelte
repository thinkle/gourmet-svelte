<script>

 import {getContext} from 'svelte'
 export let floatWidth
 export let value
 export let prop
 export let editable=false;
 export let forceEdit=false;
 export let showLabel=true;
 export let onChange;
 export let smallLabel=true;
 import RecDef from '../../common/RecDef.js';
 import IconButton from '../../widgets/IconButton.svelte';

 import RecPropEditor from './RecPropEditor.svelte'
 import RecPropDisplay from './RecPropDisplay.svelte'

 let modes = RecDef.EditModes
 
 let ref;

 $: if (prop.array) {
     if (!value) {
         value = []
     }
 }

 import { quintOut } from 'svelte/easing';
 import { fly } from 'svelte/transition';


 var edit;
 var editOn = false;

 $: edit = editOn || forceEdit;
 
 
 function turnEditOn () {
     console.log('Edit on - was ',editOn)
     editOn = true
 }
 function turnEditOff () {
     console.log('Edit OFf - was ',editOn)
     editOn = false;
 }
 function handleChange (v) {
     onChange && onChange(value);
 }

 $: fullWidth = edit && prop.minEditWidth >= floatWidth

 function hasValue () {
     if (prop.array && value.length > 0) {
         return true;
     } else if (!prop.array && value) {
         return true;
     } else {
         return false;
     }
 }

</script>

{#if (edit || hasValue(value))}
<div class="block" class:title={prop.isTitle} class:fullWidth={fullWidth}>
    <div>
        {#if showLabel && (!prop.hideLabel)}
            <div class="top" >
                <label class:small={smallLabel} on:click={()=>ref.focus()}>{prop.label}</label>
                {#if editable && !edit}
                    <span class="editbutton" >
                        <IconButton small={smallLabel} icon="edit" bare="true" on:click={turnEditOn}/>
                    </span>
                {/if}
                {#if edit && !forceEdit}
                    <IconButton small={smallLabel} icon="done" bare="true" on:click={turnEditOff}/>
                {/if}
            </div>
        {/if}
        {#if prop.hideLabel && editable && !forceEdit}
            <div class='floatingEditButton'>
                {#if editable && !edit}
                    <span class="editbutton" ><IconButton bare="true" icon="edit" on:click={turnEditOn}/></span>
                {/if}
                {#if edit && !forceEdit}
                    <IconButton icon="done" bare="true" on:click={turnEditOff}/>
                {/if}
            </div>
        {/if}


        <div>
            {#if edit}
                <div out:fly|local={{x:150}} in:fly|local={{y:-50,delay:300}}>
                    <RecPropEditor
                        bind:this={ref}
                                  bind:value={value}
                        prop={prop}
                                  onChange={handleChange}
                    />
                </div>
            {:else}
                <div out:fly|local={{x:150}} in:fly|local={{y:-50,delay:300}}>
                <RecPropDisplay
                    value={value}
                    prop={prop}
                />
                </div>
            {/if}            
        </div>
    </div>

</div>
{/if}

<style>
 .invisible {
     /*      visibility: hidden; */
     opacity: 0.2;
     position: fixed;
     right: 300px;
     top: 350px;
    
 }
 label {
     font-family: var(--recipeHeadFont);
 }
 
 .block {
     display: block;
     font-family: var(--recipeFont);
 }
 .block.title {
     font-family: var(--recipeHeadFont);
 }
 .top {
     display: block;
 }
 .top button {
     margin-left: 1em;
 }

 b {
     margin-right: 0.5em;
 }
 input {
     margin-bottom: 0;
 }
 button.edit {
     align-self: flex-end;
     margin-bottom: 0}
 input {
     color: var(--black);
     background-color: var(--white);}


 .arrayval {
     padding-right: 1em;
 }

 .editbutton {
     visibility: hidden;
 }
 div:hover .editbutton {
     visibility: visible;
 }
 .block {
     /*      display: inline-block; */
 }
 .small {
     font-size: var(--small);
 }
 .floatingEditButton {
     width: 40px;
     float: right;
 }
 .fullWidth {
     clear: right;
 }
</style>
