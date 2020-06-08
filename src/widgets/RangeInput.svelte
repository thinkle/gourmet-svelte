<script>
 export let value
 export let showPlusMinusButtons=false

 import IB from './IconButton.svelte';
 import {formatAmount,increment,decrement,parseAmount} from '../utils/numbers.js';
 let UPCODES = [38,187]
 let DOWNCODES = [40]
 let displayValue
 $: {
     if (!inFocus||!editing) {
         displayValue = formatAmount(value,{unicodeFractions:!inFocus})
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
     let val = parseAmount(e.target.value);
     if (val != value) {
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
     let val = parseAmount(event.target.value);
     if (val && (val.amount != value.amount || val.rangeAmount != value.rangeAmount)) {
         if (formatAmount(val,{unicodeFractions:false}) == event.target.value) {
             value = val;
             dispatch('change',val);
         }
         else {
         }
     }
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
            <IB fontSize="0.8rem" compact="{true}" on:click={doIncrement} bare={true} icon="keyboard_arrow_up"></IB>
            <IB fontSize="0.8rem" compact="{true}" on:click={doDecrement} bare={true} icon="keyboard_arrow_down"></IB>
        </div>
    {/if}
</span>


<style>
 input {
     width: 6rem;
     box-sizing: border-box;
 }
 span {
     position: relative;
     display : inline-block;
 }
 div {
     width: 1rem;
     position: absolute;
     right:0;
     top:0;
     font-size: 0.3rem;
 }
 
 .buttonMode input {
     padding: 3px;
     padding-right: 1rem;
     border-top: var(--inputBorder);
     border-left: var(--inputBorder);
     border-right: var(--inputBorder);
 }

 .minibuttons :global(button.icon) {
     padding: 0;
     margin: 0;
     width: 1rem;
 }

 .minibuttons :global(i.material-icons) {
     font-size: 0.8rem;
 }

</style>
