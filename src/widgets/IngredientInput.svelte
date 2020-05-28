<script>
 export let text=''
 export let ing = undefined;
 export let onEnter
 export let onDelete
 export let onChange
 export let onInput
 export let shouldFocus

 $: shouldFocus && ref && focus();

 console.log('ing:',ing)
 export function getValue () {return parsed}
 export function clear () {
     text=''
     ing=undefined;
 }
 export function focus () {
     console.log('Called focus!');
     ref.focus()
 }

 import {parseAmount,formatAmount} from '../utils/numbers.js';
 import {parseUnit} from '../utils/unitAmounts.js';
 let parsed;
 let ref
 
 import {onMount, tick} from 'svelte';
 //import rangy from 'rangy'
 // rangy.init();
 let fireInputOnNextParse
 let doMarkup;
 $: {
     parse(text)
 }

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
                       }
                   }
                   else {
                       parsed = {
                       }
                   }
                   if (fireInputOnNextParse) {
                       onInput && onInput(parsed);
                       fireInputOnNextParse = false
                   }
                   if (doMarkup) {
                       //markup();
                       //doMarkup = false; // do it once
                   }
                   }

 $: {
     if (ing) {
         console.log('Cool got an ingredient, parse it!')
         if (ing.amount) {
             text = `${formatAmount(ing.amount,{unicodeFractions:false})} ${ing.amount.unit||''} ${ing.text}`
         }
         else {
             text = ing.text;
         }
         ing = undefined; // kill our ingredient reference now
         parse();
         markup();
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
 function onKeypress (event) {
     // Check for "enter" key
     if (event.keyCode==13) {
         if (onEnter) {
             console.log('Fire on enter!');
             let result = onEnter(parsed);
             if (result) {
                 clear()
             }
             else {
                 markupAndChange();
             }
             event.preventDefault();
         }
     }
 }
 /* else {
    // Handle the "easy" case 4 automated parsing...
    let actualRange = window.getSelection().getRangeAt(0);
    let endRange = document.createRange();//Create a range (a range is a like the selection but invisible)
    endRange.selectNodeContents(ref);//Select the entire contents of the element with the range
    endRange.collapse(false);// collapse to end
    let lastChild = ref.childNodes[ref.childNodes.length-1]
    let lastChildEndRange = document.createRange();
    lastChildEndRange.selectNodeContents(lastChild);
    lastChildEndRange.collapse(false); // collapse to end
    if (actualRange.startContainer == endRange.startContainer &&
    actualRange.endContainer == endRange.endContainer && 
    actualRange.startOffset == endRange.startOffset && actualRange.endOffset==endRange.endOffset) {
    console.log('At end!')
    console.log('Restore selection to last child node')
    markup()
    tick().then(()=>setEndOfContenteditable(ref))
    } else if (
    actualRange.startContainer == lastChildEndRange.startContainer &&
    actualRange.endContainer == lastChildEndRange.endContainer &&
    actualRange.startOffset == lastChildEndRange.startOffset &&
    actualRange.endOffset==lastChildEndRange.endOffset) {
    console.log('At end of last child');
    console.log('Restore selection to last child node')
    markup()
    tick().then(()=>setEndOfContenteditable(ref))
    }
    else {
    console.log('Not at end');
    console.log('End is:',endRange,'or',lastChildEndRange,'but we are at',actualRange);
    }
    }
    }     */


 /* function setEndOfContenteditable(contentEditableElement)
    {
    var range,selection;
    if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
    {
    range = document.createRange();//Create a range (a range is a like the selection but invisible)
    range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
    range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
    selection = window.getSelection();//get the selection object (allows you to change selection)
    selection.removeAllRanges();//remove any selections already made
    selection.addRange(range);//make the range you have just created the visible selection
    }
    else if(document.selection)//IE 8 and lower
    { 
    range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
    range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
    range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
    range.select();//Select the range (make it the visible selection
    }
    } */

 function markupAndChange () {
     markup()
     if (onChange) {
         console.log('Fire change!');
         onChange(parsed);}
 }

 function markup () {
     // mark up text based on parsed...
     if (parsed.amount) {
         let t = text
             .replace(parsed.amount.unit,`<span class="unit">${parsed.amount.unit}</span>`)
             .replace(parsed.amount.textAmount,`<span class="amount">${parsed.amount.textAmount}</span>`)
             .replace(parsed.amount.textRangeAmount,`<span class="amount rangeamount">${parsed.amount.textRangeAmount}</span>`);
         html = t;
     }     
 }

 let html
 onMount (()=>markup())
</script>

<div on:blur={markupAndChange} bind:this={ref} on:keyup={onKeyup} on:keypress={onKeypress} bind:textContent={text} bind:innerHTML={html} contenteditable="true" class="input" >
</div>
<style>

 .input {
     margin-top: var(--xsmall);
     padding-left: calc(2.4 * var(--xsmall));
     text-indent: calc(-2.4 * var(--xsmall));
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
     content : 'amount';
     position: absolute;
     top : calc(-1.2 * var(--xsmall));
     left : 0;
     font-size: var(--xsmall);
 }
 .input :global(.unit::before) {
     content : 'unit';
     position: absolute;
     top : calc(-1.2 * var(--xsmall));
     left : 0;
     font-size: var(--xsmall);
 }
</style>
