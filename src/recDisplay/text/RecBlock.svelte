<script>
 import {registerBuild} from '../../stores/debugStore.js'; registerBuild(Number("BUILD_MS"),'Ing',);
 export let value
 export let editable=true;
 export let forceEdit=true;
 export let showLabel=true;
 import RecDef from '../../common/RecDef.js';
 import {PlainInput} from '../../widgets/';
 import RecipeTextStyle from './RecipeTextStyle.svelte';
 import RichText from '../../widgets/inputs/RichText.svelte';
 import {getContext} from 'svelte'
 import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
 var displayValue;
 $: displayValue = value.body //prop.toHtml && prop.toHtml(value) || value
 let initialValue;

 $: {
     if (!editedThisTime) {
         console.log('Resetting initialValue to ',displayValue);
         initialValue = displayValue;
     }
 }
 
 let editedThisTime = false;
 
 var edit;
 var editOn = false;
 $: edit = editOn || forceEdit;

 $: {
     console.log('Edit',edit,'editOn',editOn,'force',forceEdit)
 }

 $: {
     if (!edit) {
         console.log('Not yet edited - setting');
         editedThisTime = false
     }
 }
 
 function turnEditOn () {
     initialValue = displayValue 
     console.log('Edit on - was ',editOn)
     editOn = true
 }
 function turnEditOff () {
     console.log('Edit OFf - was ',editOn)
     editOn = false;
     editedThisTime = false;
 }

 function handleChange (event) {
     if (!editedThisTime) {console.log('Setting editedThisTime to true!')}
     editedThisTime = true;
     value.body = event.detail || event.target.value;
     dispatch('change',value);
 }
 
</script>
<div class="contain">
    <div class="top">
        {#if showLabel}
            {#if edit}
                <span class="head">
                <PlainInput
                    placeholder="Heading (e.g. Instructions...)"
                    on:change="{()=>dispatch('change',value)}" bind:value={value.header}/>
                </span>
            {:else}
                <h3>{value.header}</h3>
            {/if}
        {/if}
        {#if editable && !edit}
            <button class="icon" on:click={turnEditOn}>
                <i class="material-icons">edit</i>
            </button>
        {/if}
        {#if edit && !forceEdit}
            <button class="icon" on:click={turnEditOff}>
                <i class="material-icons">done</i>
            </button>
        {/if}
    </div>
    {#if edit}
        <RecipeTextStyle>
            <RichText initialValue="{initialValue}"
                      placeholder="First, chop the onion in a fine dice…"
                      on:change="{handleChange}"
            />
        </RecipeTextStyle>
    {:else}
        <div>{@html displayValue}</div>
    {/if}

</div>
<style>
 .head {
     font-family: var(--recipeHeadFont);
     font-size: 1.2rem;
     font-weight: bold;
 }
 .contain {
     max-width: 800px;
 }
 div {
     display: block;
     max-width: 100%;
 }
 .top {
     display: flex;
     margin-bottom: 0.5em;
 }
 .top button {
     align-self: flex-start;
     margin-left: auto;
     margin-bottom: 0;
     margin-right: 5px;
 }
 
</style>
