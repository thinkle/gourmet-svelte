<script>
 import {registerBuild} from '../../stores/debugStore.js'; registerBuild(Number("BUILD_MS"));
 export let text=''
 export let ing = undefined;
 export let onEnter=undefined;
 export let onDelete=undefined;
 export let onChange=undefined;
 export let onInput=undefined;
 export let shouldFocus=undefined;
 export let showAddButton=false;
 export let placeholder="e.g. 1 cup sugar…"
 export let multipliable=true;

 import {IconButton,NumberUnitDisplay,PlainInput,Underline} from '../index.js';
 import {getShopItem} from '../../utils/ingredientUtils.js';

 let originalValue;

 export function getValue () {return parsed}
 export function clear () {
     text=''
     ing=undefined;
 }
 export function focus () {
     ref.focus()
     shouldFocus = false; // only do this once
 }

 import {floatToFrac,formatAmount,parseAmount} from '../../utils/numbers.js';
 import {parseUnit} from '../../utils/unitAmounts.js';
 let parsed;
 let ref
 import {onMount, tick, getContext} from 'svelte';
 //import rangy from 'rangy'
 // rangy.init();
 let fireInputOnNextParse
 let doMarkup;

 let shopItem;

 function parse () {
     if (text) {
         let amt = parseAmount(text);
         let unitAndText = parseUnit(amt.posttext||amt.pretext, true); // true means we require a unit
         delete amt.pretext;
         delete amt.posttext;
         parsed = {
             amount : {
                 ...amt,
                 unit : unitAndText.unit,
                 standardUnit : unitAndText.standardUnit,
             },
             text : unitAndText.text,
             originalText : text,
             shopItem
         }
     }
     else {
         parsed = {
             text : ''
         }
     }
     if (fireInputOnNextParse) {
         onInput && onInput(parsed);
         fireInputOnNextParse = false
     }
 }
 
 let lastIng; // don't keep re-parsing our ingredient if it hasn't changed
 function handleIncomingIng (ing) {
     if (ing && JSON.stringify(ing)!==lastIng) {
         if (ing.amount) {
             text = `${formatAmount(ing.amount,{unicodeFractions:false})} ${ing.amount.unit||''} ${ing.text}`
         }
         else {
             text = ing.text;
         }
         lastIng = JSON.stringify(ing);
         ing = undefined; // kill our ingredient reference now
         parse();
         markup();
     } else if (lastIng) {
         //console.log('skip unnecessary parse');
     }
 }

 function onKeyup (event) {
     if (event.keyCode!=13) {
         fireInputOnNextParse = true;
     }
     if (event.keyCode==8 && text=='') {
         if (onDelete) {
             onDelete()
         }
     }
 }

 function doSubmit () {
     if (onEnter) {
         let result = onEnter(parsed);
         if (result) {
             clear()
         }
         else {
             markupAndChange();
         }     
     }
 }
 
 function onKeypress (event) {
     // Check for "enter" key
     if (event.keyCode==13) {
         doSubmit();         
         event.preventDefault();
     }
 }

 function markupAndChange () {
     markup()
     if (onChange) {
         onChange(parsed);}
 }

 function onFocus  () {
     showFeedback = true;
     ref.innerHTML = ref.innerText
 }

 function onFocusOut () {
     ref.innerHTML = getMarkup()
     showFeedback = false;
 }
 
 function getMarkup () {
     if (text && parsed && parsed.amount) {
         return text 
             .replace(parsed.amount.unit,`<span class="unit">${parsed.amount.unit}</span>`)
             .replace(parsed.amount.textAmount,`<span class="amount">${parsed.amount.textAmount}</span>`)
             .replace(parsed.amount.textRangeAmount,`<span class="amount rangeamount">${parsed.amount.textRangeAmount}</span>`);
     } else {
         return text.replace('<[^>]*>','');
     }
 }

 function markup () {
     // mark up text based on parsed...
     if (parsed.amount) {         
                  html = getMarkup();
                        }     
 }


 async function onInputEvent () {
     //     await tick();
     //  feedback = getMarkup()
     // ref.innerHTML = ref.innerHTML.replace(/style=[^ ]/,'')
 } 

 let html
 
 onMount (()=>markup())
 $: shouldFocus && ref && focus();
 $: parse(text)
 $: handleIncomingIng(ing)
 let showFeedback=false;

 function updateShopItem (event) {
     shopItem = event.target.value
 }

 let multiplier = getContext('multiplier');
 
</script>

<div on:focusin="{onFocus}" on:focusout="{onFocusOut}" class="vbox">
    {#if parsed && parsed.amount && (parsed.amount.amount||parsed.amount.unit) && ref && showFeedback}
        <div class="anchor">
            <div class="input realtime-feedback">
                {@html getMarkup(ref.innerText,parsed,text)}
                <!-- <br>Shopping Item: <input on:change={updateShopItem} value={parsed['shopItem']||getShopItem(parsed)}> -->
            </div>
        </div>
    {/if}
    <div class="contains" class:withButton="{showAddButton}">
        <Underline>
            <div on:blur={markupAndChange}  on:input="{onInputEvent}" bind:this={ref} on:keyup={onKeyup} on:keypress={onKeypress} bind:textContent={text} bind:innerHTML={html} contenteditable="true" class="input"
                 placeholder="{placeholder}"
            >
            </div>
        </Underline>
        {#if showAddButton}
            <IconButton bare={true} icon="add" on:click="{doSubmit}" />
        {/if}
    </div>
    {#if multipliable && multiplier && $multiplier!=1 && parsed && parsed.amount}
        <span class="multiplied">
            (&times;{floatToFrac($multiplier)}={formatAmount(parsed.amount,{multiplier:$multiplier})})
        </span>
    {/if}
</div>
<style>
 .realtime-feedback {
     background-color: var(--white);
     color: var(--grey);
     position: absolute;
     bottom : 3px;
     left: 0;
     opacity: 1;
     font-size: var(--xsmall);
     padding-top: var(--xsmall);
 }
 .anchor {
     height:0px;
     width:100%;
     position: relative;
 }
 .realtime-feedback {
 }
 .withButton {
     display: flex;
     flex-direction: row;
 }
 .withButton div {
     flex-grow: 1;
 }
 .input {
     margin-top: var(--xsmall);
     padding-left: calc(2.4 * var(--xsmall));
     text-indent: calc(-2.4 * var(--xsmall));
     min-width: 8em;
 }
 .input :global(span.amount),.input :global(span.unit) {
     border-top: 1px solid black;
     padding-top: 3px;
     position: relative;
     text-indent: 0;
 }

 .input :global(.amount) {
     display: inline-block;
     min-width: calc(var(--xsmall)*4);
 }
 .input :global(.unit) {
     display: inline-block;
     min-width: calc(var(--xsmall)*4);
 }

 .input :global(.amount::before) {
     background-color: white;
     content : 'amount';
     position: absolute;
     top : calc(-1.2 * var(--xsmall));
     left : 0;
     font-size: var(--xsmall);
 }
 .input :global(.unit::before) {
     background-color: white;
     content : 'unit';
     position: absolute;
     top : calc(-1.2 * var(--xsmall));     
     left : 0;
     font-size: var(--xsmall);
 }
 div[placeholder]:empty:before {
     content: attr(placeholder);
     color: #555; 
 } 
 .multiplied {
     display: inline-block;
     padding-left: calc(var(--xsmall)*4);
     font-size: var(--xsmall);
     color: var(--grey);
 }
</style>
