<script>
 import {registerBuild} from '../../stores/debugStore.js'; registerBuild(Number("BUILD_MS"));
 export let value
 export let prop
 export let floatWidth=undefined
 export let editable=false;
 export let edit=false;
 export let showLabel=true;
 export let onChange;
 export let smallLabel=true;

 import {getContext} from 'svelte'
 import { blockCrossfade } from '../../widgets/transitions/blockCrossFade.js';
 import { fly,fade } from 'svelte/transition';
 const [send, receive] = blockCrossfade({
     duration: 300,
     fallback: fade,
 });

 import RecDef from '../../common/RecDef.js';
 import {IconButton} from '../../widgets/'

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

 var editInternal;
 $: setInternalState(edit)
 function setInternalState (state) {
     editInternal = state;
 }
 
 function turnEditOn () {
     console.log('Edit on - was ',editInternal)
     editInternal = true
 }
 function turnEditOff () {
     console.log('Edit OFf - was ',editInternal)
     editInternal = false;
 }
 function handleChange (v) {
     console.log('Rec Prop has a change!');
     onChange && onChange(value);
 }

 $: fullWidth = editInternal && prop.minEditWidth >= floatWidth

 function hasValue () {
     if (prop.array && value.length > 0) {
         return true;
     } else if (!prop.array && value) {
         return true;
     } else {
         return false;
     }
 }

 let lastEdit
 $: handleEditToggle(editInternal)
 function handleEditToggle (editInternal) {
     console.log(prop.name,'toggles to',editInternal,'from',lastEdit)
     if (lastEdit == true && !edit) {
         // Turning from edit to not edit!
         console.log(prop.name,'Edit is turning off - check values',prop.array,prop.isNull,value);
         let orig = value;
         if (prop.array && value && prop.isNull) {
             value = value.filter((v)=>!prop.isNull(v))
             if (value != orig) {
                 console.log('Filtered',orig,'to',value);
                 handleChange(value);
             }
         } 
     }
     lastEdit = editInternal;
 }

</script>

{#if (editInternal || hasValue(value))}
    <div
        style="{`--available-width: ${floatWidth}px; --min-edit-width: ${prop.minEditWidth}`}"
        class:float={!editInternal && (value&&value.float||value&&value[0]&&value[0].float)}
        class="block"
        class:title="{prop.isTitle}"
        class:fullWidth="{fullWidth}"
        on:dblclick="{turnEditOn}"
        class:hideLabel="{prop.hideLabel}"
        class:editing="{editInternal}"
    >
        {#if (showLabel && (!prop.hideLabel)) || editInternal}
            <div class="top" >
                <label class:small={smallLabel} on:click={()=>ref.focus()}>{prop.label}</label>
                {#if editable && !editInternal}
                    <span class="editbutton">
                        <IconButton
                            small="{smallLabel}"
                            icon="edit"
                            bare="true"
                            ariaLabel="{`Edit ${prop.label}`}"
                            on:click={turnEditOn}
                        />
                    </span>
                {/if}
                {#if editInternal && !edit}
                    <span class="donebutton">
                        <IconButton small="{smallLabel}"
                                    icon="done"
                                    bare="true"
                                    ariaLabel="{`Finish editing ${prop.label}`}"
                                    on:click={turnEditOff}/>
                    </span>
                {/if}
            </div>
        {:else if editable && !edit}
            <div class='floatingEditButton'>
                {#if editable && !editInternal}
                    <span class="editbutton">
                        <IconButton
                            bare="true"
                            icon="edit"
                            ariaLabel="{`Edit ${prop.label}`}"
                            on:click={turnEditOn}
                        />
                    </span>
                {/if}
                {#if editInternal && !edit}
                    <span class="donebutton">
                        <IconButton
                            icon="done"
                            bare="true"
                            ariaLabel="{`Finish editing ${prop.label}`}"                        
                            on:click={turnEditOff}/>
                    </span>
                {/if}
            </div>
        {/if}


        <div>
            {#if editInternal}
                <div class="editContainer">
                    <!-- out:fly|local={{x:150}} in:fly|local={{y:-50,delay:300}}> -->
                    <RecPropEditor
                        bind:this="{ref}"
                        bind:value="{value}"
                        prop="{prop}"
                        onChange="{handleChange}"
                    />
                </div>
            {:else}
                <div
                >
                    <!-- out:fly|local={{x:150}} in:fly|local={{y:-50,delay:300}}> -->
                <RecPropDisplay
                    value={value}
                    prop={prop}
                />
                </div>
            {/if}            
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
     flex-grow: 1;
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
 .small {
     font-size: var(--small);
     line-height: 2; /* Make sure out descenders show up... */
 }
 
 .block .floatingEditButton {
     width: 40px;
     float: right;
 }
 .title {
     display: flex;
     flex-direction: row-reverse;
 }
 @media (min-width: 600px) {
     .title {
         white-space: normal; /* Allow wrapping on title, even in navbar */
     }
 }
 
 .editing.title {
     flex-direction: column;
 }

 .block.editing {
     width : var(--available-width);
     border-color: #eee;
     transition: border-color 300ms;
 }
 .block.editing:focus-within {
     border-color: #888;
     transition: border-color 300ms;
 }
 .block.editing:focus-within label {
     font-weight: bold;
 }
 
 .block {
     border: 1px solid transparent;
     padding: 3px;
 }

 .fullWidth.block.editing {
     clear: right;
     width: 100%;
     box-sizing: border-box;
 }
 div {
     flex-grow: 1;
 }
 .float {
     float: right;
 }

</style>
