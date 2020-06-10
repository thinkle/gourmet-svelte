<script>
 import {floatToFrac,fracToFloat,increment,decrement} from '../../utils/numbers.js';
 import {IconButton} from '../index.js';
 const DOWNCODES = [40,189]
 const UPCODES = [38,187]
 export let value;
 export let showPlusMinusButtons=false
 let useUnicode = true;
 let displayValue;
 $: displayValue = floatToFrac(value,{unicodeFractions:useUnicode});
 
 import { createEventDispatcher, setContext, getContext } from 'svelte';
 const dispatch = createEventDispatcher();
 import {tick} from 'svelte';

 function change () {
     value = fracToFloat(displayValue);
     dispatch('change',value);
 }

 function doIncrement () {
     value = increment(value);
     event.preventDefault()
     dispatch('change',value)
 }

 function doDecrement () {
     value = decrement(value);
     event.preventDefault()
     dispatch('change',value)
 }

 function onchange (e) {
     console.log('onchange',e)
     let val = fracToFloat(e.target.value);
     if (val != value) {
         console.log('dispatching change event')
         dispatch('change',val);
         value = val;
     }
 }


 function onkey (event) {
     let newVal
     if (UPCODES.indexOf(event.keyCode) > -1) {
         doIncrement()
     }
     if (DOWNCODES.indexOf(event.keyCode) > -1) {
         doDecrement()
     }
 }

 function oninput (event) {
     let val = fracToFloat(event.target.value);
     console.log('input: val=',val);
     if (val && val != value) {
         if (floatToFrac(val,{unicodeFractions:false}) == event.target.value) {
             console.log('dispatch a change event...');
             value = val;
             dispatch('change',val);
         }
         else {
             console.log('Holding off update so as not to screw up input: ',event.target.value,'=>',val)
         }
     }
 }

</script>
<span class:buttonMode={showPlusMinusButtons}>
    <input
        on:blur={()=>useUnicode=true}
                on:focus={()=>useUnicode=false}
        on:keyup="{oninput}" bind:value={displayValue} width=2 on:keydown={onkey} on:change={onchange} >
    {#if showPlusMinusButtons}
        <div class="minibuttons">
            <IconButton compact="{true}" fontSize="0.8rem" on:click={doIncrement} bare={true} icon="keyboard_arrow_up"></IconButton>
            <br>
            <IconButton compact="{true}" fontSize="0.8rem" on:click={doDecrement} bare={true} icon="keyboard_arrow_down"></IconButton>
        </div>
    {/if}
</span>


<style>
 input {width: 4rem;}
 span {position: relative;}
 div {
     width: 1rem;
     position: absolute;
     right:0;
     top:0;
     font-size: 0.3rem;
 }
 
 .buttonMode {
     width: 5rem;
 }

 :global(.minibuttons button.icon) {
     padding: 0;
     margin: 0;
     width: 1rem;
 }

 :global(.minibuttons button.icon i.material-icons) {
     font-size: 0.8rem;
 }

</style>
