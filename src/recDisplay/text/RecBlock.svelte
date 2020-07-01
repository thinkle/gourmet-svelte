<script>
 import {registerBuild} from '../../stores/debugStore.js'; registerBuild(Number("BUILD_MS"),'Ing',);
 export let value

 import RecDef from '../../common/RecDef.js';
 import {PlainInput} from '../../widgets/';
 import RecipeTextStyle from './RecipeTextStyle.svelte';
 import RichText from '../../widgets/inputs/RichText.svelte';
 import {getContext} from 'svelte'
 import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
 let initialValue;
 initialValue = value.body //prop.toHtml && prop.toHtml(value) || value

 function handleChange (event) {
     value.body = event.detail || event.target.value;
     dispatch('change',value);
 }
 
</script>
<div class="top">
    <span class="head">
        <PlainInput
            placeholder="Heading (e.g. Instructions...)"
            on:change="{()=>dispatch('change',value)}" bind:value={value.header}/>
    </span>        
</div>
<RecipeTextStyle>
    <RichText initialValue="{initialValue}"
              placeholder="First, chop the onion in a fine dice…"
              on:change="{handleChange}"
    />
</RecipeTextStyle>

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
