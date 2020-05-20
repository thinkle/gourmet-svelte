<script>
 import IB from './IconButton.svelte';
 import {formatAmount,increment,decrement,parseAmount} from '../utils/numbers.js';
 export let value
 export let showPlusMinusButtons=false
 let UPCODES = [38,187]
 let DOWNCODES = [40]
 let displayValue
 $: {
     if (!inFocus||!editing) {
         displayValue = formatAmount(value,{unicodeFractions:!inFocus})
         console.log('Reactive set of displayValue!',displayValue,inFocus,editing);
         if (inFocus) {
             editing = true;
         }
     }
 }
 import { createEventDispatcher, setContext, getContext } from 'svelte';
 const dispatch = createEventDispatcher();
 let inFocus = true;
 let editing = false;

 function change () {
     value = parseAmount(displayValue);
     dispatch('change',value);
 }

 function doIncrement () {
     let amount = increment(value.amount);
     let difference =  amount - value.amount;
     if (value.rangeAmount) {
         value = {
             amount,
             rangeAmount : value.rangeAmount + difference
         }
     }
     else {
         value = {amount}
     }
     displayValue = formatAmount(value,{unicodeFractions:!inFocus})
     event.preventDefault()
     dispatch('change',value)
 }

 function doDecrement () {
     let amount = decrement(value.amount)
     let difference = value.amount - amount;
     if (value.rangeAmount) {
         value = {
             amount,
             rangeAmount : value.rangeAmount - difference
         }
     }
     else {
         value = {amount}
     }
     displayValue = formatAmount(value,{unicodeFractions:!inFocus})
     event.preventDefault()
     dispatch('change',value)
 }

 function onchange (e) {
     console.log('onchange',e)
     let val = parseAmount(e.target.value);
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
     console.log('key down',event.key)
 }

 function oninput (event) {
     let val = parseAmount(event.target.value);
     console.log('input: val=',val);
     if (val && (val.amount != value.amount || val.rangeAmount != value.rangeAmount)) {
         if (formatAmount(val,{unicodeFractions:false}) == event.target.value) {
             console.log('dispatch a change event...');
             value = val;
             dispatch('change',val);
         }
         else {
             console.log('Holding off update so as not to screw up input: ',event.target.value,'=>',val)
         }
     }
     console.log('Value is ',event.target.value,'?')
 }

 
</script>

<span class:buttonMode={showPlusMinusButtons}>
    <input
        on:blur={()=>inFocus=false}
        on:focus={()=>{inFocus=true;editing=false}}       
                bind:value={displayValue}
                width=8
        on:keydown={onkey}
                on:keyup={oninput}
        on:change={onchange}
        
    >
    {#if showPlusMinusButtons}
        <div class="minibuttons">
            <IB on:click={doIncrement} bare={true} icon="keyboard_arrow_up"></IB>
            <IB on:click={doDecrement} bare={true} icon="keyboard_arrow_down"></IB>
        </div>
    {/if}
</span>


<style>
 input {width: 6rem;}
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
